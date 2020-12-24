import {Handler, APIGatewayEvent} from 'aws-lambda';

export const handler: Handler = (event: APIGatewayEvent) => {
    console.log(`Path: ${event.path}`)
    console.log(`Path Param: ${event.pathParameters}`)
    console.log(`Path Body: ${event.body}`)

    return {
        statusCode: 200,
        headers: {
            'x-custom-header' : `my custom header value`
        },
        body: JSON.stringify(`Hello World!`)
    };
}


