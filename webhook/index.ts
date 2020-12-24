import {Handler, APIGatewayEvent} from 'aws-lambda';

export const handler: Handler = (event: APIGatewayEvent) => {
    console.log(`Path: ${event.path}`)
    console.log(`Path Param: ${event.pathParameters}`)
    console.log(`Path Body: ${event.body}`)
}


