import AWS from 'aws-sdk';
import { DocumentClient, GetItemOutput } from 'aws-sdk/clients/dynamodb';
import { Message } from './domain';

export class DB {
  constructor(private client: DocumentClient, private table: string) {}

  async get(key: string): Promise<Message> {
    const params = {
      TableName: this.table,
      Key: { key },
    };

    const { Item: item }: GetItemOutput = await this.client.get(params).promise();

    if (!item) {
      throw Error(`DynamoDB item ${key} not found`);
    }

    return AWS.DynamoDB.Converter.unmarshall(item) as Message;
  }
}
