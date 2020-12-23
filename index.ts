import {Handler, SQSEvent, SQSRecord} from 'aws-lambda';
import { WpMessage } from "./models";
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';

const http = axios.create({baseURL: process.env.UCHAT_URL || 'https:localhost:1234'});
const uChatToken: String = process.env.UCHAT_TOKEN || 'no-token';
const msg: String = process.env.MSG || 'Test Message';


export const handler: Handler = (event: SQSEvent) => {
    event.Records
        .map((message: SQSRecord) => WpMessage.from(message.body))
        .forEach((wpMessage: WpMessage) => { sendMessage(wpMessage) })
}

const sendMessage = async (message: WpMessage) => {
    let config = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        params: {
            'token': uChatToken,
            'cmd': 'chat',
            'to': message.phone,
            'msg': msg
        }
    }

    http.post("/", null, config).then((response: AxiosResponse) => {
        if (response.status !== 200) {
            throw Error(response.statusText)
        }
    })
}


