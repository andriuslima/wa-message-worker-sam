import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Parameter } from './parameter';

export class ZApi {
  constructor(private client: AxiosInstance, private parameter: Parameter) {}

  async send(phone: string, message: string, instance: string): Promise<AxiosResponse> {
    const body = {
      message,
      phone,
    };

    const token = await this.parameter.get(`/zap/${instance}`);

    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'application/json' },
    };

    console.log(`Sending Z-API request: ${JSON.stringify(body)}`);
    try {
      return await this.client.post(`/${instance}/token/${token}/send-text`, body, config);
    } catch (err) {
      console.error(`Error while sending Z-Api request: ${err}`);
      throw new Error(`Error while sending Z-Api request: ${err}`);
    }
  }
}
