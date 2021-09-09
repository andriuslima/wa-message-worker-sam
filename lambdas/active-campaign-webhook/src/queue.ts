import SQS, { SendMessageRequest } from 'aws-sdk/clients/sqs';

export class Queue {
  constructor(private client: SQS, private queue: string) {}

  async send(body: string): Promise<void> {
    const sendMessageParams: SendMessageRequest = {
      MessageBody: body,
      QueueUrl: this.queue,
    };

    await this.client.sendMessage(sendMessageParams).promise();
  }
}
