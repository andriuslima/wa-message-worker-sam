import { Handler, ScheduledEvent } from 'aws-lambda'
import { ReceiveMessageResult } from 'aws-sdk/clients/sqs'
import { AWSError, SQS } from 'aws-sdk'

const sqs = new SQS()
const dlq = process.env.DLQ || 'dlq-url'
const queue = process.env.QUEUE || 'dlq-url'
const batchSize = 10

export const handler: Handler = (event: ScheduledEvent) => {
  sqs.getQueueAttributes({ QueueUrl: dlq }, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when retrieving dlq attributes from DLQ ${dlq}`, data)
      throw new Error(err.message)
    }
    const size = (data.Attributes?.ApproximateNumberOfMessages || batchSize) as number
    return retrieveMessage(size)
  })
}

async function retrieveMessage (size: number): Promise<void> {
  if (size < 1) {
    return
  }

  sqs.receiveMessage({ QueueUrl: dlq, MaxNumberOfMessages: size }, (err: AWSError, data: ReceiveMessageResult) => {
    if (err) {
      console.log(`Somethings went wrong when receiving message from DLQ ${dlq}`, data)
      throw new Error(err.message)
    }
    data.Messages?.forEach(message => { processMessage(message) })
  })
}

async function processMessage (message: SQS.Message): Promise<void> {
  const { originalMessage, retryable } = JSON.parse(message.Body || '')
  if (retryable) {
    sqs.sendMessage({ QueueUrl: queue, MessageBody: JSON.stringify(originalMessage) }, (err, data) => {
      if (err) {
        console.log(`Somethings went wrong when routing message to queue ${queue}`, data)
        throw new Error(err.message)
      } else {
        console.log('message successfully routed to queue')
      }
    })
  }
}
