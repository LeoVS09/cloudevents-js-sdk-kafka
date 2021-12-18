import { sum } from "../src/index"
import { CloudEvent, HTTP } from 'cloudevents'
import {Kafka, Producer} from 'kafkajs'
import { CloudEventStrict } from "../src"

describe('Kafka', () => {

    let kafka: Kafka
    let producer: Producer

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
    })

    afterAll(async () => {
        await producer.disconnect()
    })

   

    it('send message', async () => {
        const ce = new CloudEventStrict({
            specversion: '1.0',
            source: 'sourse',
            id: 'id',
            type: 'message.send'
        })
        const messsage = HTTP.structured(ce)
        await producer.send({
            topic: 'test-topic',
            messages: [
                { 
                    headers: {
                        'content-type': 'application/cloudevents+json; charset=UTF-8'
                    },
                    value: JSON.stringify(messsage) 
                },
            ],
        })
        expect(sum(1,2)).toBe(3)
    })
})