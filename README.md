# How to run locally
First make sure you have `sam` cli on your path and also Docker uo and running

Install and build our yarn project and then build with SAM:
1. `yarn install && yarn build`

## Sender 
`sam local invoke WaSender --event local/sqs-event.json  --parameter-overrides 'ParameterKey=UCHAT_TOKEN,ParameterValue=xxxxx`

Replace the `xxxxx` with the actual token

### Webhook

`sam local start-api --profile xxxxx`

`curl --location --request POST 'http://127.0.0.1:3000/message/fallback/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'contact[id]=12060' \
--data-urlencode 'contact[email]=name@domain.com' \
--data-urlencode 'contact[first_name]=Tobey' \
--data-urlencode 'contact[last_name]"=Maguire' \
--data-urlencode 'contact[phone]=55999999999' \
--data-urlencode 'contact[fields][link_do_boleto]=www.google.com'`