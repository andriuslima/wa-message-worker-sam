import { GetParameterRequest } from 'aws-sdk/clients/ssm';

export class Parameter {
  constructor(private client: AWS.SSM) {}

  async get(parameter: string): Promise<string> {
    console.info(`Reading parameter from SSM: ${parameter}`);

    const request: GetParameterRequest = {
      Name: parameter,
      WithDecryption: true,
    };

    const response = await this.client.getParameter(request).promise();
    if (response.Parameter?.Value) {
      return response.Parameter.Value;
    }
    throw new Error('Parameter value undefined');
  }
}
