import {CloudEvent, Mode, ValidationError, Version, CONSTANTS, CloudEventV1} from 'cloudevents'
import { JSONParser, Parser, parserByContentType, MappedParser } from 'cloudevents/dist/parsers'
import { isStringOrObjectOrThrow } from 'cloudevents/dist/event/validation';
import { sanitize, getMode, getVersion} from './headers';
import { CeKafkaMessage, CloudEventWithKafka, Headers, SanitizedHeader } from './models';
import {v03structuredParsers, v1structuredParsers} from 'cloudevents/dist/message/http/headers';
import { partitionKeyExtenstionParsers } from './parsers';

export class NotImplementedError extends Error {
    constructor(message: string) {
        super(message);
    }
}
  
/**
 * Converts a KafkaMessage to a CloudEvent
 * @implements {Deserializer}
 *
 * @param {Message} message the incoming message
 * @return {CloudEvent} A new {CloudEvent} instance
 */
export function deserialize<T>({value, headers, key, timestamp}: CeKafkaMessage): CloudEventWithKafka<T> | CloudEventWithKafka<T>[] {
    if (!value) 
        throw new ValidationError("value is null or undefined");  

    if (typeof value === 'object' && Buffer.isBuffer(value))
        value = value.toString();

    if (typeof key === 'object' && Buffer.isBuffer(key))
        key = key.toString();

    if (!headers) 
        throw new ValidationError("headers is null or undefined");

    const sanitaisedHeaders = sanitize(headers);

    const mode: Mode = getMode(sanitaisedHeaders);
    const version = getVersion(mode, sanitaisedHeaders, value);

    switch (mode) {
        case Mode.STRUCTURED:
            return parseStructured(value, sanitaisedHeaders, key, timestamp, version);
        
        case Mode.BINARY:
        case Mode.BATCH:
            throw new NotImplementedError("Binary and Batch mode events are not supported");
        
        default:
            throw new ValidationError("Unknown Message mode");
    }
}


/**
 * Creates a new CloudEvent instance based on the provided payload and headers.
 *
 * @param {Message} message the incoming Message
 * @param {Version} version the spec version of this message (v1 or v03)
 * @returns {CloudEvent} a new CloudEvent instance for the provided headers and payload
 * @throws {ValidationError} if the payload and header combination do not conform to the spec
 */
function parseStructured<T>(value: string, headers: SanitizedHeader, key: string | undefined, timestamp: string | undefined, version: Version): CloudEvent<T> {

    isStringOrObjectOrThrow(value, new ValidationError("value must be an object or a string"));

    const eventObj = JSON.parse(value as string);

    console.log(timestamp, eventObj.time);
    
    if(eventObj.time)
        eventObj.time = new Date(eventObj.time).toISOString();
    
    if(key)
        eventObj.partitionkey = key

    return new CloudEvent<T>(eventObj as CloudEventV1<T>, false);
  }
  
function parseContent(value: string, contentType?: string): Record<string, unknown>{
    const parser: Parser = contentType ? parserByContentType[contentType] : new JSONParser();

    if (!parser) 
        throw new ValidationError(`invalid content type ${contentType}`);

    return { ...(parser.parse(value) as Record<string, unknown>) };
}

const v1structuredParsersWithExtenstions = {
    ...v1structuredParsers,
    ...partitionKeyExtenstionParsers
}

function getParsersMap(version: Version): Record<string, MappedParser>{
    if(version == Version.V03) 
        return v03structuredParsers
    
    if(version == Version.V1)
        return v1structuredParsersWithExtenstions

    console.warn(`Only v0.3 and v1.0 specversion are supported, but received ${version}, will fallback to v1.0`);
    return v1structuredParsersWithExtenstions
}

export type EventObject = { [key: string]: unknown }

function parseFields(incoming: Record<string, unknown>, parserMap: Record<string, MappedParser> ): EventObject {
    incoming = {...incoming} // prevent object mutation
    const eventObj: EventObject = {};
  
    for (const key in parserMap) {
      const property = incoming[key];
      
      if (property) {
        const mappedParser: MappedParser = parserMap[key];
        eventObj[mappedParser.name] = mappedParser.parser.parse(property as string);
      }

      delete incoming[key];
    }
  
    // extensions are what we have left after processing all other properties
    for (const key in incoming) {
      eventObj[key] = incoming[key];
    }

    return eventObj
}

function fallbackDataForV03(eventObj: EventObject): EventObject {
    // data_base64 is a property that only exists on V1 events. For V03 events,
    // there will be a .datacontentencoding property, and the .data property
    // itself will be encoded as base64
    if (eventObj.data_base64 || eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
        eventObj = { ...eventObj }
        const data = eventObj.data_base64 || eventObj.data;
        eventObj.data = new Uint32Array(Buffer.from(data as string, "base64"));
        delete eventObj.data_base64;
        delete eventObj.datacontentencoding;
    }

    return eventObj
}