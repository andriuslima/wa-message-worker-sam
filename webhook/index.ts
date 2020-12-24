import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';
import { SSM } from 'aws-sdk'

const ssm = new SSM()

export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const messageKey = event.pathParameters?.messageKey || ""

    const message = ssm.getParameter({ Name: messageKey }, ((err, data) => {
        console.log(`Data: ${data.Parameter?.Value}`)
        return data.Parameter?.Value
    }))

    let response =  {
        statusCode: 200,
        headers: {
            'x-custom-header' : `my custom header value`
        },
        body: message
    }

    return callback(null, response)
}


