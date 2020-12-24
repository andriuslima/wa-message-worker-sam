import {Handler, APIGatewayEvent, Context, Callback} from 'aws-lambda';

export const handler: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    console.log(`Path: ${event.path}`)
    console.log(`Path Param: ${event.pathParameters}`)
    console.log(`Path Body: ${event.body}`)


    let response =  {
        statusCode: 200,
        headers: {
            'x-custom-header' : `my custom header value`
        },
        body: JSON.stringify(`Hello World!`)
    }

    return callback(null, response)
}


