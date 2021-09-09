import { Handler, SQSEvent } from 'aws-lambda';
import AWS, { SQS } from 'aws-sdk';
import { SSM } from './ssm';
import { Queue } from './queue';
import { Formatter } from './formatter';

const dlq = process.env.DLQ || 'dlq-url';
const senderQueue = process.env.SENDER_QUEUE || 'sender-queue-url';
const queue = new Queue(new SQS(), senderQueue, dlq);
const ssm = new SSM(new AWS.SSM());
const formatter = new Formatter();

export const handler: Handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    await parse(record.body);
  }
};

async function parse(body: string): Promise<void> {
  const { id, phone, key, params } = JSON.parse(body);

  if (!key) {
    throw new Error('Key is not present');
  }

  console.log(`Message received for: ${id}:${phone}:${key}`);

  const message = await ssm.get(key);

  console.log(`Message retrieved: ${message.substring(0, 10)}`);

  const replacedMessage = formatter.replace(params, message);

  console.log(`Message replaced: ${replacedMessage}`);

  if (formatter.hasPlaceholders(replacedMessage) || !replacedMessage) {
    return queue.sendToDLQ(body, 'params missing to complete message');
  }

  const formattedPhone = formatter.phone(phone);

  await queue.send(JSON.stringify({ id, phone: formattedPhone, message: replacedMessage }));
}
