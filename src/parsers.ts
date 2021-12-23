import { PassThroughParser, MappedParser } from "cloudevents/dist/parsers";
import { PARTITIONKEY_EXTENSTION_KEY } from "./models";

export const partitionKeyExtenstionParsers = {
    PARTITIONKEY_EXTENSTION_KEY: { name: PARTITIONKEY_EXTENSTION_KEY, parser: new PassThroughParser() } 
}