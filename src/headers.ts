import {CloudEvent, CONSTANTS, Mode, ValidationError, Version} from 'cloudevents'
import {Headers, SanitizedHeader} from './models'

const {HEADER_CONTENT_TYPE, DEFAULT_CE_CONTENT_TYPE} = CONSTANTS

export const STRUCTURED_HEADERS: Headers = { [HEADER_CONTENT_TYPE]: DEFAULT_CE_CONTENT_TYPE };

export enum KAFKA_CE_HEADERS {
    TYPE = "ce_type",
    SPEC_VERSION = "ce_specversion",
    SOURCE = "ce_source",
    ID = "ce_id",
    TIME = "ce_time",
    SUBJECT = "ce_subject"
};

/**
 * Sanitizes incoming headers by lowercasing them and potentially removing
 * encoding from the content-type header.
 * @param {Headers} headers HTTP headers as key/value pairs
 * @returns {Headers} the sanitized headers
 */
export function sanitize(headers: Headers): SanitizedHeader {
    const sanitized: SanitizedHeader = {};
  
    Array.from(Object.keys(headers))
      .filter((header) => Object.hasOwnProperty.call(headers, header))
      .forEach((header) => {
          let value = headers[header]
          if(Buffer.isBuffer(value)) {
            value = value.toString();
          }
          sanitized[header.toLowerCase()] = value
        });
  
    return sanitized;
}

/**
 * Determines the Kafka transport mode (binary or structured) based
 * on the incoming Kafka headers.
 * @param {Headers} headers the incoming Kafka headers
 * @returns {Mode} the transport mode
 */
export function getMode(headers: SanitizedHeader): Mode {
    let contentType = headers[HEADER_CONTENT_TYPE];
    
    if (!contentType && !headers[KAFKA_CE_HEADERS.ID]) 
        throw new ValidationError("Do not have a valid cloudevent header");

    if (!contentType) {
        console.warn('Not Have content type header will fallback to binary')
        return Mode.BINARY
    }

    if(Buffer.isBuffer(contentType)) 
        contentType = contentType.toString();

    if (typeof contentType !== "string") {
        console.warn('Content type must be string, but got', typeof contentType, 'will fallback to binary')
        return Mode.BINARY
    }
        
    if (contentType.startsWith(CONSTANTS.MIME_CE_BATCH)) 
        return Mode.BATCH;
    
    if (contentType.startsWith(CONSTANTS.MIME_CE)) 
        return Mode.STRUCTURED;

    return Mode.BINARY
}

/**
 * Determines the version of an incoming CloudEvent based on the
 * Kafka headers or Kafka body, depending on transport mode.
 * @param {Mode} mode the Kafka transport mode
 * @param {Headers} headers the incoming Kafka headers
 * @param {Record<string, unknown>} value the Kafka message value
 * @returns {Version} the CloudEvent specification version
 */
export function getVersion(mode: Mode, headers: SanitizedHeader, value: string | Record<string, string> | unknown): Version {
    if (mode === Mode.BINARY) {
        return getVersionInBinaryMode(headers);
    } 

    // structured mode - the version is in the body
    return getVersionInStructuredMode(value)
}

function getVersionInBinaryMode(headers: Headers): Version{
    // Check the headers for the version
    const versionHeader = headers[KAFKA_CE_HEADERS.SPEC_VERSION];
    if (!versionHeader) {
        console.warn("In Binary mode message do not have ce_specversion header, will fallback to 1.0")
        return Version.V1;
    }

    return versionHeader as Version
}

function getVersionInStructuredMode(value: string | Record<string, string> | unknown): Version{
    if (typeof value === "string") {
        value = JSON.parse(value);
    } 

    const {specversion} = value as CloudEvent
    
    if(!specversion) {
        console.warn("In Structured mode message do not have specversion field, will fallback to 1.0")
        return Version.V1;
    }

    return specversion
}