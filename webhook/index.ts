import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import { AWSError, SSM, SQS } from 'aws-sdk'
import { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { PromiseResult } from 'aws-sdk/lib/request';
import qs from 'qs';


const ssm = new SSM()
const sqs = new SQS()
const queueUrl = process.env.QUEUE || "localhost"

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.key || "fallback"
    const { contact }: any = qs.parse(event.body || "")
    const { id, phone, first_name, last_name, fields } = contact
    const boleto = fields.link_do_boleto
    const name = first_name + " " + last_name
    let message;

    console.log(`active campaign event received for contact: ${id}:${name}:${phone}`)
    console.log(`Message key received: ${messageKey}`)

    await ssm.getParameter({ Name: messageKey, WithDecryption: false })
        .promise()
        .then((data: PromiseResult<GetParameterResult, AWSError>) => {
            message = data.Parameter?.Value
        })
        .catch((error: AWSError) => {
            console.log(`Somethings went wrong when retrieving message to SSM ${messageKey}`)
            console.log(error, error.stack)
            throw new Error(error.message)
        });

    console.log(`Message retrieved: ${message}`)

    const queueMessage = JSON.stringify({id, phone, name, boleto, message})
    const params: SendMessageRequest = {
        MessageBody: queueMessage,
        QueueUrl: queueUrl
    }

    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log(`Somethings went wrong when sending message to SQS ${queueUrl}`)
            console.log(err, err.stack);
            throw new Error(err.message)
        } else {
            console.log(data);
        }
    });

    return callback(null, {
        statusCode: 200,
        body: JSON.stringify(message)
    })
}
