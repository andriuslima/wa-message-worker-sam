import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import { SQS } from 'aws-sqs'
import {AWSError, SSM } from 'aws-sdk'
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { PromiseResult } from 'aws-sdk/lib/request';

const ssm = new SSM()
const sqs = new SQS()
const queueUrl = process.env.QUEUE

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.key || "fallback"
    const body = JSON.parse(event.body);
    const phone =  body.phone
    let message;

    await ssm.getParameter({ Name: messageKey, WithDecryption: false })
        .promise()
        .then((data: PromiseResult<GetParameterResult, AWSError>) => {
            console.log("On ssm promise")
            message = data.Parameter?.Value
        });

    console.log(`Message: ${message}`)

    const queueMessage = JSON.stringify({message, phone})
    const params = {
        MessageBody: queueMessage,
        QueueUrl: queueUrl
    }

    sqs.sendMessage(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else     console.log(data);
    });

    let response =  {
        statusCode: 200,
        body: JSON.stringify(message)
    }

    return callback(null, response)
}
