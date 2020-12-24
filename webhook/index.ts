import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import {AWSError, SSM } from 'aws-sdk'
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { PromiseResult } from 'aws-sdk/lib/request';

const ssm = new SSM()

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.key || "fallback"
    console.log(`Data: ${messageKey}`)

    let message;
    await ssm.getParameter({ Name: messageKey, WithDecryption: false })
        .promise()
        .then((data: PromiseResult<GetParameterResult, AWSError>) => {
            console.log("On ssm promise")
            console.log(`Data: ${data}`)
            console.log(`Parameter: ${data.Parameter}`)

            message = data.Parameter?.Value
        });

    console.log(`Message: ${message}`)

    console.log("Returning")

    let response =  {
        statusCode: 200,
        body: JSON.stringify(message)
    }

    return callback(null, response)
}
