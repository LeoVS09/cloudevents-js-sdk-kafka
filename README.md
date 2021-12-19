# CloudEvents JS SDK Kafka

Kafka transport extension for CloudEvents JS SDK

## Description

Allow serialise and deserialise [CloudEvents](https://github.com/cloudevents/spec) for kafka protocol.

* Based on [Kafka Protocol Binding for CloudEvents - Version 1.0.1](https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md)
* Tested with [KafkaJS](https://github.com/tulios/kafkajs), but probably will work with any other client.
* Currently support only [structured mode](https://github.com/cloudevents/spec/blob/v1.0.1/kafka-protocol-binding.md#33-structured-content-mode)
* Supports CloudEvent versions 0.3, 1.0
* Correctly works with official [CloudEvents JavaScript SDK](https://github.com/cloudevents/sdk-javascript) starting from v5.
* Have zero dependencies.
* Strict typescript usage

## Installation

```bash
npm install cloudevents cloudevents-kafka kafkajs
# or
yarn add cloudevents cloudevents-kafka kafkajs
```

**Note:** For examples will be used `kafkajs`, but you can use any other client library.

## Usage

### Strict CloudEvent

Default `CloudEvent` constructor do not strictly check input object,
for enable strict mode this library have two classes.

```ts
import { Version, CloudEvent } from 'cloudevents'
import {CloudEventStrict, CloudEventStrictV1} from "cloudevents-kafka"

// Will throw runtime exceptions about missing `id` field
const ce = new CloudEvent({
    specversion: Version.V1,
    source: 'some-source',
    // id: 'some-id',
    type: 'message.send'
})

// Will show typescript error during compilation about missing `id` field
const ces = new CloudEventStrict({
    specversion: Version.V1,
    source: 'some-source',
    // id: 'some-id',
    type: 'message.send'
})

// Will show typescript error during compilation about missing `id` field
const cev1 = new CloudEventStrictV1({
    source: 'some-source',
    // id: 'some-id',
    type: 'message.send'
})
```

### Receiving Events

If received valid `KafkaMessage` it will be dedeserialized as `CloudEvent`

```ts
kafka = new Kafka({
    clientId: 'test-app',
    brokers: ['kafka:9092']
})


consumer = kafka.consumer({ groupId: 'test-group' })

await consumer.connect()
await consumer.subscribe({ topic: 'test-topic', fromBeginning: true })

await consumer.run({
    eachMessage: async ({message}: EachMessagePayload) => {
        const receivedEvent = CeKafka.deserialize(message)
        console.log(receivedEvent); // will be valid CloudEvent
    }
})
```

### Emitting Events

`CloudEvent` will be serialised as `KafkaMessage` object, which will contain `key`, `value`, `header` and `timestamp` fields, which yhou can send using any client.

```ts
import { Version } from 'cloudevents'
import {Consumer, EachMessagePayload, Kafka, Producer} from 'kafkajs'
import * as CeKafka from "cloudevents-kafka"
const {CloudEventStrict} = CeKafka


kafka = new Kafka({
    clientId: 'test-app',
    brokers: ['kafka:9092']
})

producer = kafka.producer()

await producer.connect()

const ce = new CloudEventStrict({
    specversion: Version.V1,
    source: 'some-source',
    id: 'some-id',
    type: 'message.send'
})
const messsage = CeKafka.structured(ce)

await producer.send({
    topic: 'test-topic',
    messages: [
        messsage,
    ],
})

```

## Development

Firstly save alias in `/etc/hosts`

```/etc/hosts
127.0.0.1       localhost kafka
```

Start kafka

```bash
docker-compose up kafka
```

Install dependencies

```bash
yarn
```

Run tests

```bash
yarn test
```
