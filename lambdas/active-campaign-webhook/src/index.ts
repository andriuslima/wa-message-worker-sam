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

  const { id, phone, first_name: firstName, last_name: lastName, fields, email } = contact;
  const formattedPhones = [phoneFormatter.format(phone), fields?.telefone_checkout_hotmart];
  const phones = [...new Set(formattedPhones)];
  const name = (firstName || lastName || 'Abundante').split(' ')[0];
  const {
    link_do_boleto,
    data_de_nascimento,
    nome_completo_para_o_mapa,
    whatsapp,
    whatsapp_cod_ddi_pais,
    reprogramao_do_amorquizdata_de_nascimento,
    mapa_numerolgico_infantil_data_de_nascimento,
    mapa_numerolgico_infantil_nome_completo_para_o_mapa,
    mapa_numerolgico_infantil_whatsapp,
    mapa_numerolgico_infantil_whatsapp_cod_ddi_pais,
  } = fields;
  const params = {
    name,
    email,
    linkBoleto: link_do_boleto,
    dataNascimento: data_de_nascimento,
    nomeCompletoMapa: nome_completo_para_o_mapa,
    whatsapp,
    whatsappCodDdiPais: whatsapp_cod_ddi_pais,
    reproDoAmordataNascimento: reprogramao_do_amorquizdata_de_nascimento,
    mapaInfantilDataNascimento: mapa_numerolgico_infantil_data_de_nascimento,
    mapaInfantilNomeCompletoMapa: mapa_numerolgico_infantil_nome_completo_para_o_mapa,
    mapaInfantilWhatsapp: mapa_numerolgico_infantil_whatsapp,
    mapaInfantilWhatsappCodDdiPais: mapa_numerolgico_infantil_whatsapp_cod_ddi_pais,
  };

  if (phones.length == 0) {
    return {
      statusCode: 201,
      body: 'Could not extract any phone number from request body.',
    };
  }

  console.log(`Active campaign event received for contact: ${id}:${name}:${phones}`);
  console.log(`Message key received: ${key}`);
  console.log(`Routing with the following params: ${JSON.stringify(params)}`);

  const messages = phones.map((p) => JSON.stringify({ id, phone: p, key, params }));

  console.log('Routing requests to queue...');
  await queue.sendAll(messages);

  console.log('Routing done!');

  return {
    statusCode: 201,
    body: JSON.stringify(messages),
  };
};
