import { Handler, SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import axios from 'axios';
import { compareMsgs, IntegrationEvent, MessageValue } from './domain';
import { Queue } from './queue';
import { UChat } from './uchat';

const http = axios.create({ baseURL: process.env.UCHAT_URL || 'localhost:1234' });
const uChatToken = process.env.UCHAT_TOKEN || 'no-token';
const uchat = new UChat(http, uChatToken);
const dlq = process.env.DLQ || 'dlq-url';
const queue = new Queue(new SQS(), dlq);

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

  event.messages.sort(compareMsgs);

  for (const message of event.messages) {
    try {
      sendMessage(message, event.phone);
    } catch (err) {
      queue.sendToDLQ(JSON.stringify(event), JSON.stringify(err));
    }
  }
}

async function sendMessage(message: MessageValue, phone: string): Promise<void> {
  console.log(`Message received: ${JSON.stringify(message)}`);

  const response = await uchat.send(phone, message.value);

  console.log(`http request response status ${response.statusText}: ${JSON.stringify(response.data)}`);

  if (response.status !== 200 || response.data.status === 'offline') {
    throw new Error(`uCHAT Error sending message: ${JSON.stringify(response)}`);
  }

  console.log(`Message sent to ${phone}`);
}
