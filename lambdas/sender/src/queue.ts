import SQS, { MessageBodyAttributeMap, SendMessageRequest } from 'aws-sdk/clients/sqs';
import { IntegrationEvent } from './domain';

export class Queue {
  constructor(private client: SQS, private queue: string, private dlq: string) {}

  async enqueueEvent(event: IntegrationEvent, delay: number): Promise<void> {
    const sendMessageParams: SendMessageRequest = {
      MessageBody: JSON.stringify(event),
      QueueUrl: this.queue,
      DelaySeconds: delay,
    };

    await this.client.sendMessage(sendMessageParams).promise();
  }

  async sendToDLQ(message: string, error: string): Promise<void> {
    console.log(error);
    const attributes: MessageBodyAttributeMap = {
      error: {
        StringValue: error,
        DataType: 'String',
      },
      retryable: {
        StringValue: 'true',
        DataType: 'String',
      },
    };

    const params: SendMessageRequest = {
      MessageBody: message,
      QueueUrl: this.dlq,
      MessageAttributes: attributes,
    };

    await this.client.sendMessage(params).promise();
  }
}
