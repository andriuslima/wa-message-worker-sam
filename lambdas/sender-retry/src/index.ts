import { Handler } from 'aws-lambda';
import { SQS } from 'aws-sdk';

const sqs = new SQS();
const dlq = process.env.DLQ || 'dlq-url';
const queue = process.env.QUEUE || 'dlq-url';
const batchSize = 10;

export const handler: Handler = async () => {
  const attributes = await sqs.getQueueAttributes({ QueueUrl: dlq }).promise();

  const numberOfMessage = (attributes.Attributes?.ApproximateNumberOfMessages || batchSize) as number;

  if (numberOfMessage < 1) {
    console.log('DLQ is empty, returning...');
    return;
  }

  let numberOfRetrieves = Math.floor(numberOfMessage / batchSize);
  if (numberOfMessage % batchSize > 0) {
    numberOfRetrieves += 1;
  }

  console.log(`Retrieving ${numberOfRetrieves}x (batches of ${batchSize})`);

  for (let i = 0; i < numberOfRetrieves; i++) {
    retrieveMessages(batchSize);
  }
};

async function retrieveMessages(size: number): Promise<void> {
  const ops = { QueueUrl: dlq, MaxNumberOfMessages: size, MessageAttributeNames: ['retryable'] };
  const messages = await sqs.receiveMessage(ops).promise();

  if (!messages.Messages) {
    console.log('0 messages retrived, returning...');
    return;
  }

  for (const message of messages.Messages) {
    await processMessage(message);
  }
}

async function processMessage(message: SQS.Message): Promise<void> {
  if (!message.Body) {
    console.log(`message ${message.MessageId} with empty body`);
    return;
  }
  const body = message.Body;
  await sqs.sendMessage({ QueueUrl: queue, MessageBody: body }).promise();
  await sqs.deleteMessage({ QueueUrl: dlq, ReceiptHandle: message.ReceiptHandle || '' }).promise();
}
