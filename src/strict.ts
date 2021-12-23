import { CloudEvent, Version } from "cloudevents";
import {KafkaCloudEventV1} from './models'

/** 
 * Contructor typings not working for base CloudEvent,
 * this class enable strict type checks for constructor
 * */
export class CloudEventStrict<T = undefined> extends CloudEvent<T> {
    constructor(event: KafkaCloudEventV1<T>) {
        super(event, true)
    }
}

// By some reason Omit<CloudEventV1<T>, 'specversion'> not working for that case
// @ts-ignore
export interface DefinedVersionEvent<T = undefined> extends KafkaCloudEventV1<T> {
    /**
     * The version of the CloudEvents specification which the event
     * uses. This enables the interpretation of the context. Compliant event
     * producers MUST use a value of `1.0` when referring to this version of the
     * specification.
     * Will be `1.0` by default.
     */
    specversion?: string
}

export class CloudEventStrictV1<T = undefined> extends CloudEventStrict<T> {
    constructor(event: DefinedVersionEvent<T>) {
        super({
            specversion: Version.V1,
            ...event
        } as KafkaCloudEventV1<T>)
    }
}