import { CloudEvent, CloudEventV1 } from "cloudevents";

/** 
 * Contructor typings not working for base CloudEvent,
 * this class enable strict type checks for constructor
 * */
export class CloudEventStrict<T = undefined> extends CloudEvent<T> {
    constructor(event: CloudEventV1<T>) {
        super(event, true)
    }
}