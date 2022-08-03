import { APIGatewayEvent, Handler } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Queue } from './queue';
import qs from 'qs';
import { PhoneFormatter } from './phoneFormatter';

const queueUrl = process.env.QUEUE || 'localhost';
const queue = new Queue(new SQS(), queueUrl);
const phoneFormatter = new PhoneFormatter();

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (!event.pathParameters || !event.pathParameters.key) {
    throw new Error('Message key not present on request path parameters');
  }

  if (!event.body) {
    throw new Error('Body not present request');
  }

  const body = qs.parse(event.body);
  const key = event.pathParameters.key;
  const { contact }: any = body;

  console.log(`Request body: ${JSON.stringify(body)}`);

  console.log(`Contact info received: ${JSON.stringify(contact)}`);

  const { id, phone, first_name: firstName, last_name: lastName, fields } = contact;
  const formattedPhones = [phone, fields?.telefone_checkout_hotmart].map((p) => phoneFormatter.format(p));
  const phones = [...new Set(formattedPhones)];
  const name = (firstName || lastName || 'Abundante').split(' ')[0];
  const linkBoleto = fields?.link_do_boleto;

  if (phones.length == 0) {
    return {
      statusCode: 201,
      body: 'Could not extract any phone number from request body.',
    };
  }

  console.log(`Active campaign event received for contact: ${id}:${name}:${phones}`);
  console.log(`Message key received: ${key}`);

  const messages = phones.map((p) => JSON.stringify({ id, phone: p, key, params: { name, linkBoleto } }));

  console.log('Routing requests to queue...');
  await queue.sendAll(messages);

  console.log('Routing done!');

  return {
    statusCode: 201,
    body: JSON.stringify(messages),
  };
};
