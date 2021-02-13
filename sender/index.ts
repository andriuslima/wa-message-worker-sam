import { Handler, SQSEvent, SQSRecord } from 'aws-lambda'
import { SendMessageRequest } from 'aws-sdk/clients/sqs'
import { SQS } from 'aws-sdk'
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import qs from 'qs'

const http = axios.create({ baseURL: process.env.UCHAT_URL || 'localhost:1234' })
const uChatToken = process.env.UCHAT_TOKEN || 'no-token'
const dlq = process.env.DLQ || 'dlq-url'

export const handler: Handler = (event: SQSEvent) => {
  event.Records
    .map((record: SQSRecord) => record.body)
    .forEach(body => { sendMessage(body) })
}

async function sendMessage (body: any): Promise<void> {
  console.log(`SQS message body received: ${body}`)
  const { message, phone } = JSON.parse(body)

  const config: AxiosRequestConfig = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }

  const data = qs.stringify({
    token: uChatToken,
    cmd: 'chat',
    to: phone + '@c.us',
    msg: message
  })

  console.log(`Sending message to ${phone} with content "${message.substring(0, 10)}..."`)

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
    error: error,
    retryable: true
  }

  const params: SendMessageRequest = {
    MessageBody: JSON.stringify(errorMessage),
    QueueUrl: dlq
  }

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when sending error message to DLQ ${dlq}`, data)
      throw new Error(err.message)
    } else {
      console.log('message successfully routed to DLQ')
    }
  })
}
