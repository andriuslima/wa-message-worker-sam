import { Handler, APIGatewayEvent, Context, Callback } from 'aws-lambda'
import { AWSError, SQS } from 'aws-sdk'
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs'
import { PromiseResult } from 'aws-sdk/lib/request'
import qs from 'qs'
import parsePhoneNumber from 'libphonenumber-js'

const sqs = new SQS()
const queueUrl = process.env.QUEUE || 'localhost'

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  validateRequest(event)

  const key = event.pathParameters!.key
  const { contact } : any = qs.parse(event.body!)

  const { id, phone, first_name: firstName, last_name: lastName, fields } = contact

  if (!phone) {
    return callback(null, {
      statusCode: 201,
      body: 'Phone number not present on request body'
    })
  }

  const name = (firstName || lastName || 'Abundante').split(' ')[0]
  const linkBoleto = fields?.link_do_boleto
  const formatedPhone = phone.length === 8 ? '9' + phone : phone
  const phoneNumber = parsePhoneNumber(formatedPhone, 'BR')?.format('E.164').replace('+', '')

  console.log(`Active campaign event received for contact: ${id}:${name}:${phoneNumber}`)
  console.log(`Message key received: ${key}`)

  const queueMessage = JSON.stringify({ id, phone: phoneNumber, key, params: { name, linkBoleto } })
  const params: SendMessageRequest = {
    MessageBody: queueMessage,
    QueueUrl: queueUrl
  }

  console.log('Routing request to queue...')
  await sqs.sendMessage(params)
    .promise()
    .then((data: PromiseResult<SendMessageResult, AWSError>) => {
      console.log(data)
    })
    .catch((error: AWSError) => {
      console.log(`Somethings went wrong when sending message to SQS ${queueUrl}`)
      console.log(error, error.stack)
      throw new Error(error.message)
    })

  console.log('Routing done!')
  return callback(null, {
    statusCode: 201,
    body: queueMessage
  })
}

function validateRequest (event: APIGatewayEvent) {
  if (!event.pathParameters || !event.pathParameters.key) {
    throw new Error('Message key not present on request path parameters')
  }

  if (!event.body) {
    throw new Error('Body not present request')
  }
}
