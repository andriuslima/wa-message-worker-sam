[![CodeQL](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/codeql-analysis.yml)
[![Deploy to Development](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/deploy-development.yml/badge.svg?branch=main)](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/deploy-development.yml)
[![Deploy to Production](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/deploy-production.yml/badge.svg?branch=main)](https://github.com/Andriuslima/wa-message-worker-sam/actions/workflows/deploy-production.yml)

# How to run locally
First make sure you have `sam` cli on your path and also Docker uo and running

Install and build our yarn project and then build with SAM:
1. `yarn install && yarn dev`

## Webhook

`sam local start-api --profile xxxxx`

`curl --location --request POST 'http://127.0.0.1:3000/message/fallback/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'contact[id]=12060' \
--data-urlencode 'contact[email]=name@domain.com' \
--data-urlencode 'contact[first_name]=Tobey' \
--data-urlencode 'contact[last_name]"=Maguire' \
--data-urlencode 'contact[phone]=55999999999' \
--data-urlencode 'contact[fields][link_do_boleto]=www.google.com'`

## Parser
`sam local invoke WaParser --event local/parser-sqs-event.json`

## Sender 
`sam local invoke WaSender --event local/sender-sqs-event.json  --parameter-overrides 'ParameterKey=UCHATTOKEN,ParameterValue=xxxxx`

Replace the `xxxxx` with the actual token
