import { CloudEvent, CloudEventV1, Version } from "cloudevents";

/** 
 * Contructor typings not working for base CloudEvent,
 * this class enable strict type checks for constructor
 * */
export class CloudEventStrict<T = undefined> extends CloudEvent<T> {
    constructor(event: CloudEventV1<T>) {
        super(event, true)
    }
}

export class CloudEventStrictV1<T = undefined> extends CloudEventStrict<T> {
    constructor(event: Omit<CloudEventV1<T>, 'specversion'>) {
        super({
            specversion: Version.V1,
            ...event
        } as CloudEventV1<T>)
    }
}