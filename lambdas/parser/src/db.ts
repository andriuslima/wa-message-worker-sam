import { ClientConfiguration, DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Message } from './domain';

export class DB {
  private client: DocumentClient;
  constructor(private table: string) {
    const local = process.env.LOCAL_DB;
    const options: ClientConfiguration = { apiVersion: '2012-08-10' };
    if (local === 'true') {
      console.log('Connecting to local dynamoDB');
      options.endpoint = 'http://dynamo:8000';
    }
    this.client = new DocumentClient(options);
  }

  async get(key: string): Promise<Message> {
    const { Item: item } = await this.client
      .get({
        TableName: this.table,
        Key: { key },
      })
      .promise();

    if (!item) {
      throw Error(`DynamoDB item ${key} not found`);
    }

    return item as Message;
  }
}
