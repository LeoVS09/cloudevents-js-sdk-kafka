import { CloudEvent, Version } from 'cloudevents'
import {Consumer, EachMessagePayload, Kafka, Producer} from 'kafkajs'
import * as CeKafka from "../src"
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
            type: 'message.send'
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
        expect(receivedCe!.specversion).toBe(ce.specversion)
        expect(receivedCe!.source).toBe(ce.source)
        expect(receivedCe!.id).toBe(ce.id)
        expect(receivedCe!.type).toBe(ce.type)
    })

    it('send same data', async () => {
        type TestData = { test: string}
        const ce = new CloudEventStrict({
            specversion: '1.0',
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
    })
})