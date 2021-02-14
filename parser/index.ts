import { Handler, SQSEvent, SQSRecord } from 'aws-lambda'
import { GetParameterResult } from 'aws-sdk/clients/ssm'
import {MessageBodyAttributeMap, SendMessageRequest, SendMessageResult} from 'aws-sdk/clients/sqs'
import { SQS, SSM, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'

const sqs = new SQS()
const ssm = new SSM()

const dlq = process.env.DLQ || 'dlq-url'
const queue = process.env.SENDER_QUEUE || 'sender-queue-url'
const phPrefix = '{'
const phSuffix = '}'

export const handler: Handler = (event: SQSEvent) => {
  event.Records
    .map((record: SQSRecord) => record.body)
    .forEach(body => { parse(body) })
}

async function parse (body: any): Promise<void> {
  const { id, phone, key, params } = JSON.parse(body)

  console.log(`Message received for: ${id}:${phone}:${key}`)

  let message: string | undefined
  await ssm.getParameter({ Name: key! })
    .promise()
    .then((data: PromiseResult<GetParameterResult, AWSError>) => {
      message = data.Parameter?.Value
    })
    .catch((error: AWSError) => {
      console.log(`Somethings went wrong when retrieving message to SSM with ${key}`)
      console.log(error, error.stack)
      throw new Error(error.message)
    })

  console.log(`Message retrieved: ${message}`)

  const replacedMessage = replace(params, message)

  console.log(`Message replaced: ${replacedMessage}`)
  if (hasPlaceholders(replacedMessage) || !replacedMessage) {
    return sendToDLQ(body, 'params missing to complete message')
  }

  const sendMessageParams: SendMessageRequest = {
    MessageBody: JSON.stringify({ id, phone, message: replacedMessage }),
    QueueUrl: queue
  }

  await sqs.sendMessage(sendMessageParams)
    .promise()
    .then((data: PromiseResult<SendMessageResult, AWSError>) => {
      console.log(data)
    })
    .catch((error: AWSError) => {
      console.log(`Somethings went wrong when sending message to SQS ${queue}`)
      console.log(error, error.stack)
      throw new Error(error.message)
    })
}

function hasPlaceholders (message: string): boolean {
  const matches = message.match(new RegExp(phPrefix + '\\w+' + phSuffix, 'g'))
  return matches !== null && matches.length > 0
}

function replace (data: string[], str: string = ''): string {
  Object.keys(data).forEach((key) => {
    const regexp = new RegExp(phPrefix + key + phSuffix, 'g')
    const value = data[key] || 'N/A'
    str = str.replace(regexp, value)
  })

  return str
}

function sendToDLQ (message: string, error: string): void {
  console.log(error)
  const attributes: MessageBodyAttributeMap = {
    error: {
      StringValue: error,
      DataType: 'String'
    }
  }

  const params: SendMessageRequest = {
    MessageBody: message,
    MessageAttributes: attributes,
    QueueUrl: dlq
  }

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when sending error message to DLQ ${dlq}`, data)
      throw new Error(error)
    } else {
      console.log('message successfully routed to DLQ')
    }
  })
}
