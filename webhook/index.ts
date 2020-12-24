import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import { SSM } from 'aws-sdk'

const ssm = new SSM()

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.messageKey || ""
    console.log(`Data: ${messageKey}`)

    let message;
    await ssm.getParameter({ Name: messageKey, WithDecryption: false }, ((err, data) => {
        if (err) console.log(err, err.stack);
        message =  data.Parameter?.Value
    }))

    let response =  {
        statusCode: 200,
        headers: {
            'x-custom-header' : `my custom header value`
        },
        body: JSON.stringify(message)
    }

    return callback(null, response)
}


