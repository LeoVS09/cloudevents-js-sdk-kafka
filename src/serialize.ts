import { STRUCTURED_HEADERS } from "./headers";
import { CeKafkaMessage, CloudEventWithKafka } from "./models";

/**
 * Serialize a CloudEvent for KAFKA transport in structured mode
 * @implements {Serializer}
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/http-protocol-binding.md#32-structured-content-mode
 *
 * @param {CloudEvent} event the CloudEvent to be serialized
 * @returns {Message} a Message object with headers and body
 */
export function structured<T = undefined>(event: CloudEventWithKafka<T>): CeKafkaMessage {
    if (event.data_base64) {
        // The event's data is binary - delete it
        event = event.cloneWith({ data: undefined });
    }

    return {
        key: generateKey(event),
        headers: STRUCTURED_HEADERS,
        value: event.toString(),
        timestamp: serializeTimestamp(event.time)
    };
}

function generateKey<T = undefined>({partitionkey}: CloudEventWithKafka<T>){
    if (partitionkey)
        return partitionkey;
}


function serializeTimestamp(time?: string): string | undefined {
    if(!time)
        return

    return `${Date.parse(time)}`
}