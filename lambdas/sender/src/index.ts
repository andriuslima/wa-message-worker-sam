import { Handler, SQSEvent } from 'aws-lambda';
import { SQS, SSM } from 'aws-sdk';
import axios from 'axios';
import { compareMsgs, IntegrationEvent, MessageValue } from './domain';
import { Queue } from './queue';
import { ZApi } from './z-api';
import { Parameter } from './parameter';

const zApiHost = process.env.ZAPI_HOST;
const zApiUrl = `${zApiHost}/instances/`;

const http = axios.create({ baseURL: zApiUrl || 'localhost:1234' });
const parameter = new Parameter(new SSM());
const zApi = new ZApi(http, parameter);
const dlq = process.env.DLQ || 'dlq-url';
const senderQueue = process.env.QUEUE || 'queue-url';
const queue = new Queue(new SQS(), senderQueue, dlq);

export const handler: Handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    await handleMessage(JSON.parse(record.body));
  }
};

async function handleMessage(event: IntegrationEvent): Promise<void> {
  console.log(`Handling event: ${JSON.stringify(event)}`);
  if (event.messages.length == 0) {
    console.log('No messages to send');
    return;
  }

  event.messages.sort(compareMsgs).reverse();
  const messageToSend = event.messages.pop();
  if (!messageToSend) {
    console.log('There is no message to be sent');
    return;
  }

  try {
    await sendMessage(messageToSend, event.phone, event.instance);
  } catch (err) {
    event.messages.push(messageToSend);
    await queue.sendToDLQ(JSON.stringify(event), JSON.stringify(err));
    return;
  }

  if (event.messages.length > 0) {
    const nextMessage = event.messages[event.messages.length - 1];
    await queue.enqueueEvent(event, nextMessage.delay | 0);
  } else {
    console.log('No more messages to handle');
  }
}

async function sendMessage(message: MessageValue, phone: string, instance: string): Promise<void> {
  console.log(`Message received: ${JSON.stringify(message)}`);

  const { data } = await zApi.send(phone, message.value, instance);

  console.log(`Message sent to ${phone}, response: ${JSON.stringify(data)}`);
}
