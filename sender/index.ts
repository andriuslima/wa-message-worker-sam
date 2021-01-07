import { Handler, SQSEvent, SQSRecord } from 'aws-lambda';
import {SendMessageRequest} from "aws-sdk/clients/sqs";
import { SQS } from 'aws-sdk';
import axios, { AxiosResponse, AxiosRequestConfig} from 'axios';
import qs from 'qs';

const http = axios.create({baseURL: process.env.UCHAT_URL || 'localhost:1234'});
const uChatToken = process.env.UCHAT_TOKEN || 'no-token';
const dlq = process.env.DLQ || 'dlq-url';

export const handler: Handler = (event: SQSEvent) => {
    event.Records
        .map((record: SQSRecord) => record.body)
        .forEach(body => { sendMessage(body).then(r => console.log(r)) })
}

const sendMessage = async (body: any) => {
    console.log(`SQS message body received: ${body}`)
    const {message, phone} = JSON.parse(body)

    const config: AxiosRequestConfig = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }

    const data = qs.stringify({
            'token': uChatToken,
            'cmd': 'chat',
            'to': '55' + phone + '@c.us',
            'msg': message
    })

    console.log(`Sending message to ${phone} with content \"${message}\"`)

    const response: AxiosResponse = await http.post(`/${uChatToken}`, data, config)

    console.log(`http request response status ${response.statusText}: ${JSON.stringify(response.data)}`)

    if (response.status !== 200) {
        console.log(`uChat status response: ${response.statusText}`)
        sendToDLQ(message, response.statusText)
    }

    if (response.data.status === 'offline') {
        console.log(`uChat data status response: ${response.data.status}`)
        sendToDLQ(message, response.data.status)
    }

    console.log(`Message sent to ${phone}`)
}

function sendToDLQ(message: string, error: string) {
    const sqs = new SQS()
    const errorMessage = {
        originalMessage: message,
        error: error
    }
    const params: SendMessageRequest = {
        MessageBody: JSON.stringify(errorMessage),
        QueueUrl: dlq
    }

    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log(`Somethings went wrong when sending error message to DLQ ${dlq}`)
            throw new Error(error)
        } else {
            console.log('message successfully routed to DLQ');
        }
    });
}

