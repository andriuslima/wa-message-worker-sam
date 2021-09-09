import SQS, { MessageBodyAttributeMap, SendMessageRequest } from 'aws-sdk/clients/sqs';

export class Queue {
  constructor(private client: SQS, private dlq: string) {}

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
