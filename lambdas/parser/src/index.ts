import { Handler, SQSEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { DB } from './db';
import { Message } from './domain';
import { Formatter } from './formatter';
import { Queue } from './queue';

const dlq = process.env.DLQ || 'dlq-url';
const senderQueue = process.env.SENDER_QUEUE || 'sender-queue-url';
const table = process.env.TABLENAME || 'table-name';
const queue = new Queue(new SQS(), senderQueue, dlq);
const db = new DB(table);
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

  const message = await db.get(key);

  console.log(`${message.msgs.length} message retrieved`);

  const replacedMessages = replace(message, params);
  const formattedPhone = formatter.phone(phone);

  await queue.sendBatch(
    replacedMessages.msgs.map((msg) => JSON.stringify({ id, phone: formattedPhone, message: msg.value }))
  );
}

function replace(message: Message, params: string[]): Message {
  for (const entry of message.msgs) {
    entry.value = formatter.replace(params, entry.value);
    console.log(`Message replaced: ${entry.value}`);
    if (formatter.hasPlaceholders(entry.value) || !entry.value) {
      console.log(`params missing to complete message: ${entry.value}`);
    }
  }
  return message;
}
