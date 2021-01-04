import { Handler, SQSEvent, SQSRecord } from 'aws-lambda';
import axios, { AxiosResponse, AxiosRequestConfig} from 'axios';
import qs from 'qs';

const http = axios.create({baseURL: process.env.UCHAT_URL || 'localhost:1234'});
const uChatToken: String = process.env.UCHAT_TOKEN || 'no-token';

export const handler: Handler = (event: SQSEvent) => {
    event.Records
        .map((message: SQSRecord) => message.body)
        .forEach(message => { sendMessage(message).then(r => console.log(r)) })
}

const sendMessage = async (message: any) => {
    console.log(`SQS Message received: ${message}`)
    message = JSON.parse(message)
    const msg = message.message
    const phone = "55" + message.phone + '@c.us'

    const config: AxiosRequestConfig = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }

    const data = qs.stringify({
            'token': uChatToken,
            'cmd': 'chat',
            'to': phone,
            'msg': msg
    })

    console.log(`Sending message to ${phone} with content \"${msg}\"`)

    const response: AxiosResponse = await http.post(`/${uChatToken}`, data, config)

    console.log(`http request response status ${response.statusText}: ${JSON.stringify(response.data)}`)

    if (response.status !== 200) {
        throw Error(`uChat status response: ${response.statusText}`)
    }

    if (response.data.status === 'offline') {
        throw Error(`uChat data status response: ${response.data.status}`)
    }

    console.log(`Message sent to ${phone}`)
}


