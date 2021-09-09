import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class UChat {
  constructor(private client: AxiosInstance, private token: string) {}

  async send(body: string): Promise<AxiosResponse> {
    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    return await this.client.post(`/${this.token}`, body, config);
  }
}
