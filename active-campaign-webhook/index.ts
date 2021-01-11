import { Handler, APIGatewayEvent, Context, Callback } from 'aws-lambda'
import { AWSError, SSM, SQS } from 'aws-sdk'
import { SendMessageRequest } from 'aws-sdk/clients/sqs'
import { GetParameterResult } from 'aws-sdk/clients/ssm'
import { PromiseResult } from 'aws-sdk/lib/request'
import qs from 'qs'
import parsePhoneNumber from 'libphonenumber-js'

const ssm = new SSM()
const sqs = new SQS()
const queueUrl = process.env.QUEUE || 'localhost'

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const messageKey = event.pathParameters?.key || 'fallback'
  const { contact } : any = qs.parse(event.body || '')
  const { id, phone, first_name: firstName, last_name: lastName, fields } = contact
  const name = firstName || lastName || 'Abundante'
  const linkBoleto = fields.link_do_boleto
  let message: string | undefined

  const formatedPhone = phone.length === 8 ? '9' + phone : phone
  const phoneNumber = parsePhoneNumber(formatedPhone, 'BR')?.format('E.164').replace('+', '')

  console.log(`Formated Phone: ${formatedPhone}`)
  console.log(`Phone Format E164: ${phoneNumber}`)
  console.log(`Active campaign event received for contact: ${id}:${name}:${phoneNumber}`)
  console.log(`Message key received: ${messageKey}`)

  await ssm.getParameter({ Name: messageKey, WithDecryption: false })
    .promise()
    .then((data: PromiseResult<GetParameterResult, AWSError>) => {
      message = data.Parameter?.Value
    })
    .catch((error: AWSError) => {
      console.log(`Somethings went wrong when retrieving message to SSM ${messageKey}`)
      console.log(error, error.stack)
      throw new Error(error.message)
    })

  console.log(`Message retrieved: ${message}`)

  const queueMessage = JSON.stringify({ id, phone: phoneNumber, message, params: { name, linkBoleto } })
  const params: SendMessageRequest = {
    MessageBody: queueMessage,
    QueueUrl: queueUrl
  }

  if (message === undefined) {
    throw new Error(`Message to sent is undefined: ${messageKey}`)
  }

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when sending message to SQS ${queueUrl}`)
      console.log(err, err.stack)
      throw new Error(err.message)
    } else {
      console.log(data)
    }
  })

  return callback(null, {
    statusCode: 200,
    body: queueMessage
  })
}
