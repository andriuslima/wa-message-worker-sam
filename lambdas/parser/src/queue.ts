import SQS, { MessageBodyAttributeMap, SendMessageRequest } from 'aws-sdk/clients/sqs';

export class Queue {
  constructor(private client: SQS, private queue: string, private dlq: string) {}

  async sendBatch(msg: string[]): Promise<void> {
    for (const entry of msg) {
      await this.send(entry);
    }
  }

  async send(body: string): Promise<void> {
    const sendMessageParams: SendMessageRequest = {
      MessageBody: body,
      QueueUrl: this.queue,
    };

    await this.client.sendMessage(sendMessageParams).promise();
  }
  async sendToDLQ(message: string, error: string): Promise<void> {
    console.log('Sending error do DLQ');
    console.log(error);

    const attributes: MessageBodyAttributeMap = {
      error: {
        StringValue: error,
        DataType: 'String',
      },
    };

    const params: SendMessageRequest = {
      MessageBody: message,
      MessageAttributes: attributes,
      QueueUrl: this.dlq,
    };

    await this.client.sendMessage(params).promise();
  }
}
