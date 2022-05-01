import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ZApi {
  constructor(private client: AxiosInstance) {}

  async send(phone: string, message: string): Promise<AxiosResponse> {
    const body = {
      message,
      phone,
    };

    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'application/json' },
    };

    console.log(`Sending Z-API request: ${JSON.stringify(body)}`);
    try {
      return await this.client.post('/send-text', body, config);
    } catch (err) {
      console.error(`Error while sending Z-Api request: ${err}`);
      throw new Error(`Error while sending Z-Api request: ${err}`);
    }
  }
}
