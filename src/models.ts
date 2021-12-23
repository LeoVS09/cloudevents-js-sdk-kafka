import { CloudEvent, CloudEventV1 } from "cloudevents";

export interface Headers {
    [key: string]: string | Buffer | undefined
}

export interface SanitizedHeader {
    [key: string]: string | undefined
}

// TODO: add all kafka message fields

/** 
 * Base cloudevents message is transport agnostic, but this message is specially designed for kafka.
 * Usefful for bring support of Exactly-Once processing.
 * */
export interface CeKafkaMessage {
    /** @property string `key` - unique message identificator, constructored as `${event.source}/${event.id}` */
    key: string | Buffer | undefined;
    /** @property {@linkcode Headers} `headers` - the headers for the event Message */
    headers?: Headers
    /** @property string `value` - the body of the event Message */
    value: string | Buffer | null
    /** @property string `timestamp` - mapped from event time field if it exists */
    timestamp?: string
}

/** Used for attributes mapping and parsing */
export const PARTITIONKEY_EXTENSTION_KEY = 'partitionkey'

/** Based on <https://github.com/cloudevents/spec/blob/v1.0.1/extensions/partitioning.md> */
export interface PartitionKeyExtenstion {
    /**
     * [REQUIRED] A partition key for the event, 
     * typically for the purposes of defining a causal relationship/grouping between multiple events. 
     * In cases where the CloudEvent is delivered to an event consumer via multiple hops, 
     * it is possible that the value of this attribute might change, or even be removed, 
     * due to protocol semantics or business processing logic within each hop.
     * @required Non-empty string.
     * @example The ID of the entity that the event is associated with
     */
    partitionkey?: string
}

export interface KafkaCloudEventV1<T = undefined> extends CloudEventV1<T>, PartitionKeyExtenstion {}

/** cloudevents js sdk do not allow real extenstion of CloudEvent class */
export type CloudEventWithKafka<T = undefined> = CloudEvent<T> & PartitionKeyExtenstion;