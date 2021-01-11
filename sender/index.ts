import { Handler, SQSEvent, SQSRecord } from 'aws-lambda'
import { SendMessageRequest } from 'aws-sdk/clients/sqs'
import { SQS } from 'aws-sdk'
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import qs from 'qs'
import replace from './utils/message-replace'

const http = axios.create({ baseURL: process.env.UCHAT_URL || 'localhost:1234' })
const uChatToken = process.env.UCHAT_TOKEN || 'no-token'
const dlq = process.env.DLQ || 'dlq-url'
const phPrefix = '{'
const phSuffix = '}'

export const handler: Handler = (event: SQSEvent) => {
  event.Records
    .map((record: SQSRecord) => record.body)
    .forEach(body => { sendMessage(body).then(r => console.log(r)) })
}

const sendMessage = async (body: any) => {
  console.log(`SQS message body received: ${body}`)
  const { message, phone, params } = JSON.parse(body)

  const replacedMessage = replace(message, params, [phPrefix, phSuffix])

  if (hasPlaceholders(replacedMessage)) {
    return sendToDLQ(body, `params missing to complete message: ${replacedMessage}`)
  }

  const config: AxiosRequestConfig = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }

  const data = qs.stringify({
    token: uChatToken,
    cmd: 'chat',
    to: phone + '@c.us',
    msg: replacedMessage
  })

  console.log(`Sending message to ${phone} with content "${replacedMessage}"`)

  const response: AxiosResponse = await http.post(`/${uChatToken}`, data, config)

  console.log(`http request response status ${response.statusText}: ${JSON.stringify(response.data)}`)

  if (response.status !== 200) {
    return sendToDLQ(body, `uChat status response: ${response.statusText}`)
  }

  if (response.data.status === 'offline') {
    return sendToDLQ(body, `uChat data status response: ${response.data.status}`)
  }

  console.log(`Message sent to ${phone}`)
}

function sendToDLQ (message: string, error: string) {
  console.log(error)
  const sqs = new SQS()
  const errorMessage = {
    originalMessage: message,
    error: error
  }

  const params: SendMessageRequest = {
    MessageBody: JSON.stringify(errorMessage),
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

function hasPlaceholders (message: string) {
  const matches = message.match(new RegExp(phPrefix + '\\w+' + phSuffix, 'g'))
  return matches !== null && matches.length > 0
}
