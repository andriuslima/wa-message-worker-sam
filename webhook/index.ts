import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import { AWSError, SSM, SQS } from 'aws-sdk'
import { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { PromiseResult } from 'aws-sdk/lib/request';

const ssm = new SSM()
const sqs = new SQS()
const queueUrl = process.env.QUEUE || "localhost"

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.key || "fallback"
    const body = JSON.parse(event.body || "");
    const phone =  body.phone
    let message;

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

    const queueMessage = JSON.stringify({message, phone})
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
