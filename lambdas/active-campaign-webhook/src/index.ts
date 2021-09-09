import { APIGatewayEvent, Handler } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Queue } from './queue';

const queueUrl = process.env.QUEUE || 'localhost';
const queue = new Queue(new SQS(), queueUrl);

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (!event.pathParameters || !event.pathParameters.key) {
    throw new Error('Message key not present on request path parameters');
  }

  if (!event.body) {
    throw new Error('Body not present request');
  }

  const key = event.pathParameters.key;
  const { contact }: any = JSON.parse(event.body);

  const { id, phone, first_name: firstName, last_name: lastName, fields } = contact;

  if (!phone) {
    return {
      statusCode: 201,
      body: 'Phone number not present on request body',
    };
  }

  const name = (firstName || lastName || 'Abundante').split(' ')[0];
  const linkBoleto = fields?.link_do_boleto;

  console.log(`Active campaign event received for contact: ${id}:${name}:${phone}`);
  console.log(`Message key received: ${key}`);

  const messageBody = JSON.stringify({ id, phone, key, params: { name, linkBoleto } });

  console.log('Routing request to queue...');
  await queue.send(messageBody);

  console.log('Routing done!');

  return {
    statusCode: 201,
    body: messageBody,
  };
};
