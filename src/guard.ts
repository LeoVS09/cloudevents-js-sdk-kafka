import { deserialize } from "./deserialize";
import { CeKafkaMessage } from "./models";

/**
 * Determine if a KafkaMessage is a CloudEvent
 * @implements {Detector}
 *
 * @param {Message} message an incoming Message object
 * @returns {boolean} true if this Message is a CloudEvent
 */
export function isEvent(message: any): message is CeKafkaMessage {
    try {
        deserialize(message);
        return true;
    } catch (err) {
        return false;
    }
}