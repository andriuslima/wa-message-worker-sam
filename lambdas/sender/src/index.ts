import { Handler, SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import axios from 'axios';
import { Queue } from './queue';
import { UChat } from './uchat';

const http = axios.create({ baseURL: process.env.UCHAT_URL || 'localhost:1234' });
const uChatToken = process.env.UCHAT_TOKEN || 'no-token';
const uchat = new UChat(http, uChatToken);
const dlq = process.env.DLQ || 'dlq-url';
const queue = new Queue(new SQS(), dlq);

export const handler: Handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    await sendMessage(record.body);
  }
};

async function sendMessage(body: string): Promise<void> {
  console.log(`SQS message body received: ${body}`);
  const { message, phone } = JSON.parse(body);

  const data = JSON.stringify({
    token: uChatToken,
    cmd: 'chat',
    to: phone + '@c.us',
    msg: message,
  });

  console.log(`Sending message to ${phone} with content "${message.substring(0, 10)}..."`);

  const response = await uchat.send(data);

  console.log(`http request response status ${response.statusText}: ${JSON.stringify(response.data)}`);

  if (response.status !== 200) {
    return queue.sendToDLQ(body, `uChat status response: ${response.statusText}`);
  }

  if (response.data.status === 'offline') {
    return queue.sendToDLQ(body, `uChat data status response: ${response.data.status}`);
  }

  console.log(`Message sent to ${phone}`);
}
