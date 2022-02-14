import { CloudEvent, Version } from 'cloudevents'
import {Consumer, EachMessagePayload, Kafka, Producer} from 'kafkajs'
import * as CeKafka from "../src"
import { CloudEventStrictV1 } from '../src'
const {CloudEventStrict} = CeKafka


describe('Kafka', () => {

    let kafka: Kafka
    let producer: Producer
    let consumer: Consumer
    let messageHandler: (payload: EachMessagePayload) => Promise<void> = async ({ topic, partition, message }) => {
        console.log({
            topic,
            partition,
            value: message.value?.toString(),
        })
    }
    let resolveMessageReceived: () => void
    let messageReceived: Promise<void>

    beforeAll(async () => {
        kafka = new Kafka({
            clientId: 'test-app',
            brokers: ['kafka:9092']
        })

        producer = kafka.producer()

        await producer.connect()
        await producer.send({
            topic: 'test-topic',
            messages: [
                { value: 'Tests is starting!' },
            ],
        })

        consumer = kafka.consumer({ groupId: 'test-group' })

        await consumer.connect()
        await consumer.subscribe({ topic: 'test-topic', fromBeginning: false })

        messageReceived = new Promise<void>(resolve => {
            resolveMessageReceived = resolve
        })

        const eachMessage = async (payload: EachMessagePayload) => {
            // wrapper allow change messageHandler dynamically
            try{
            await messageHandler(payload)
            } catch (err) {
                console.error(err)
            }
            resolveMessageReceived()
        }

        await consumer.run({
            eachMessage 
        })
        await messageReceived
    })

    beforeEach(() => {
        messageReceived = new Promise<void>(resolve => {
            resolveMessageReceived = resolve
        })
    })

    afterAll(async () => {
        await producer.disconnect()
        await consumer.disconnect()
    })

    it('send and receive message', async () => {
        const ce = new CloudEventStrict({
            specversion: Version.V1,
            source: 'sourse',
            id: 'id',
            type: 'message.send',
            partitionkey: 'some-partitionkey',
        })
        const messsage = CeKafka.structured(ce)
        
        let receivedCe: CloudEvent
        messageHandler = async ({message}) => {
            receivedCe = CeKafka.deserialize(message) as CloudEvent
        }

        await producer.send({
            topic: 'test-topic',
            messages: [
                messsage
            ],
        })
        await messageReceived

        expect(receivedCe!).toBeDefined()
        expect(receivedCe!.specversion).toBe(Version.V1)
        expect(receivedCe!.source).toBe('sourse')
        expect(receivedCe!.id).toBe('id')
        expect(receivedCe!.type).toBe('message.send')
        expect(receivedCe!.partitionkey).toBe('some-partitionkey')
    })

    it('should correctly serialize timestamp', () => {
        const time = new Date().toString()
        const ce = new CloudEventStrict({
            specversion: Version.V1,
            source: 'sourse',
            id: 'id',
            type: 'message.send',
            partitionkey: 'message-with-timestamp',
            time 
        })

        const serialised = CeKafka.structured(ce)
        expect(new Date(+serialised.timestamp!).toString()).toBe(new Date(time).toString())

        const deserialised = CeKafka.deserialize(serialised) as CloudEvent
        expect(deserialised!.time).toBe(new Date(time).toISOString())
    })

    it('send and receive message with same time', async () => {
        const time = new Date().toString()
        const ce = new CloudEventStrict({
            specversion: Version.V1,
            source: 'sourse',
            id: 'id',
            type: 'message.send',
            partitionkey: 'message-with-timestamp',
            time 
        })
        const messsage = CeKafka.structured(ce)
        
        let receivedCe: CloudEvent
        messageHandler = async ({message}) => {
            receivedCe = CeKafka.deserialize(message) as CloudEvent
        }

        await producer.send({
            topic: 'test-topic',
            messages: [
                messsage
            ],
        })
        await messageReceived

        expect(receivedCe!).toBeDefined()
        expect(receivedCe!.specversion).toBe(Version.V1)
        expect(receivedCe!.source).toBe('sourse')
        expect(receivedCe!.id).toBe('id')
        expect(receivedCe!.type).toBe('message.send')
        expect(receivedCe!.partitionkey).toBe('message-with-timestamp')
        expect(receivedCe!.time).toBe(new Date(time).toISOString())
    })

    it('send same data', async () => {
        type TestData = { test: string}
        const ce = new CloudEventStrictV1({
            source: 'sourse',
            id: 'id',
            type: 'message.send',
            dataschema: 'https://github.com/LeoVS09/cloudevents-js-sdk-kafka/dataschema.json',
            data: {
                test: 'test-data'
            }
        })
        const messsage = CeKafka.structured(ce)
        
        let receivedCe: CloudEvent<TestData>
        messageHandler = async ({message}) => {
            receivedCe = CeKafka.deserialize(message) as CloudEvent<TestData>
        }

        await producer.send({
            topic: 'test-topic',
            messages: [
                messsage
            ],
        })
        await messageReceived

        expect(receivedCe!).toBeDefined()
        expect(receivedCe!.dataschema).toBe('https://github.com/LeoVS09/cloudevents-js-sdk-kafka/dataschema.json')
        expect(receivedCe!.data?.test).toBe('test-data')
        expect(receivedCe!.partitionkey).toBeUndefined()
    })
})