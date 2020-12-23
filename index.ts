import {Handler, SQSEvent, SQSRecord} from 'aws-lambda';
import axios, {AxiosResponse} from 'axios';
import qs from 'qs';

const http = axios.create({baseURL: process.env.UCHAT_URL || 'https:localhost:1234'});
const uChatToken: String = process.env.UCHAT_TOKEN || 'no-token';
const msg: String = process.env.MSG || 'Test Message';


export const handler: Handler = (event: SQSEvent) => {
    event.Records
        .map((message: SQSRecord) => message.body)
        .forEach(message => { sendMessage(message) })
}

const sendMessage = async (message: any) => {
    console.log(`SQS Message received: ${message}`)
    message = JSON.parse(message)

    const config = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }

    const data = qs.stringify({
            'token': uChatToken,
            'cmd': 'chat',
            'to': message.phone + '@c.us',
            'msg': msg
        })

    console.log(`Sending message to ${message.phone} with content \"${msg}\"`)

    http.post(`/${uChatToken}`, data, config).then((response: AxiosResponse) => {
        if (response.status !== 200) {
            throw Error(response.statusText)
        }
        console.log(`http request response status ${response.statusText}: ${response.data}`)
    })

    console.log(`Message sent to ${message.phone}`)
}


