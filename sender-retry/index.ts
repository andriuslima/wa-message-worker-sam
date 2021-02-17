import { Handler, ScheduledEvent } from 'aws-lambda'
import { ReceiveMessageResult } from 'aws-sdk/clients/sqs'
import { AWSError, SQS } from 'aws-sdk'

const sqs = new SQS()
const dlq = process.env.DLQ || 'dlq-url'
const queue = process.env.QUEUE || 'dlq-url'
const batchSize = 10

export const handler: Handler = (_: ScheduledEvent) => {
  sqs.getQueueAttributes({ QueueUrl: dlq }, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when retrieving dlq attributes from DLQ ${dlq}`, data)
      throw new Error(err.message)
    }
    const numberOfMessage = (data.Attributes?.ApproximateNumberOfMessages || batchSize) as number

    if (numberOfMessage < 1) {
      console.log('DLQ is empty, returning...')
      return
    }

    let numberOfRetrieves = Math.floor(numberOfMessage / batchSize)
    if (numberOfMessage % batchSize > 0) {
      numberOfRetrieves += 1
    }

    console.log(`Retrieving ${numberOfRetrieves}x (batches of ${batchSize})`)

    for (let i = 0; i < numberOfRetrieves; i++) {
      retrieveMessages(batchSize)
    }
  })
}

async function retrieveMessages (size: number): Promise<void> {
  const ops = { QueueUrl: dlq, MaxNumberOfMessages: size, MessageAttributeNames: ['retryable'] }
  sqs.receiveMessage(ops, (err: AWSError, data: ReceiveMessageResult) => {
    if (err) {
      console.log(`Somethings went wrong when receiving message from DLQ ${dlq}`, data)
      throw new Error(err.message)
    }
    console.log(`retrying ${data.Messages?.length} messages`)
    data.Messages?.forEach(message => { processMessage(message) })
  })
}

async function processMessage (message: SQS.Message): Promise<void> {
  const retryable = message.MessageAttributes?.retryable.StringValue
  console.log(JSON.stringify(message))
  if (retryable === 'true') {
    await retryMessage(message)
  } else {
    console.log(`message ${message.MessageId} is not retryable`)
  }
}

async function retryMessage (message: SQS.Message): Promise<void> {
  if (!message.Body) {
    console.log(`message ${message.MessageId} with empty body`)
  }
  const body = message.Body!
  sqs.sendMessage({ QueueUrl: queue, MessageBody: body }, (err, data) => {
    if (err) {
      console.log(`Somethings went wrong when routing message to queue ${queue}`, data)
      throw new Error(err.message)
    } else {
      console.log(`message ${message.MessageId} successfully routed to queue`)
    }
  })

  sqs.deleteMessage({ QueueUrl: dlq, ReceiptHandle: message.ReceiptHandle || '' }, (err, _) => {
    if (err) {
      throw new Error(err.message)
    }
    console.log(`message ${message.MessageId} successfully deleted from DLQ`)
  })
}
