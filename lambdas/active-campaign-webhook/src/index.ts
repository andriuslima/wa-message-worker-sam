import { APIGatewayEvent, Handler } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { SendMessageRequest } from 'aws-sdk/clients/sqs';
import parsePhoneNumber from 'libphonenumber-js';
import qs from 'qs';

const sqs = new SQS();
const queueUrl = process.env.QUEUE || 'localhost';

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (!event.pathParameters || !event.pathParameters.key) {
    throw new Error('Message key not present on request path parameters');
  }

  if (!event.body) {
    throw new Error('Body not present request');
  }

  const key = event.pathParameters.key;
  const { contact }: any = qs.parse(event.body);

  const { id, phone, first_name: firstName, last_name: lastName, fields } = contact;

  if (!phone) {
    return {
      statusCode: 201,
      body: 'Phone number not present on request body',
    };
  }

  const name = (firstName || lastName || 'Abundante').split(' ')[0];
  const linkBoleto = fields?.link_do_boleto;
  const formattedPhone = phone.length === 8 ? '9' + phone : phone;
  const phoneNumber = parsePhoneNumber(formattedPhone, 'BR')?.format('E.164').replace('+', '');

  console.log(`Active campaign event received for contact: ${id}:${name}:${phoneNumber}`);
  console.log(`Message key received: ${key}`);

  const messageBody = JSON.stringify({
    id,
    phone: phoneNumber,
    key,
    params: { name, linkBoleto },
  });
  const params: SendMessageRequest = {
    MessageBody: messageBody,
    QueueUrl: queueUrl,
  };

  console.log('Routing request to queue...');
  await sqs.sendMessage(params).promise();

  console.log('Routing done!');

  return {
    statusCode: 201,
    body: messageBody,
  };
};
