
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
    key: string | Buffer
    /** @property {@linkcode Headers} `headers` - the headers for the event Message */
    headers?: Headers
    /** @property string `value` - the body of the event Message */
    value: string | Buffer | null
    /** @property string `timestamp` - mapped from event time field if it exists */
    timestamp?: string
}
