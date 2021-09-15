import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';

export class UChat {
  constructor(private client: AxiosInstance, private token: string) {}

  async send(phone: string, msg: string): Promise<AxiosResponse> {
    const data = qs.stringify({
      msg,
      token: this.token,
      cmd: 'chat',
      to: phone + '@c.us',
    });

    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    console.log(`Sending uChat command: ${JSON.stringify(data)}`);
    try {
      return await this.client.post(`/${this.token}`, data, config);
    } catch (err) {
      console.error(`Error while sending uChat command: ${err}`);
      throw new Error(`Error while sending uChat command: ${err}`);
    }
  }
}
