# How to run locally
First make sure you have `sam` cli on your path and also Docker uo and running

Install and build our yarn project and then build with SAM:
1. `chmod +x .github/utils/build.sh`
2. `.github/utils/build.sh`

## Sender 
`sam local invoke wpSender --event local/sqs-event.json  --parameter-overrides 'ParameterKey=UCHAT_TOKEN,ParameterValue=xxxxx`

Replace the `xxxxx` with the actual token

### Webhook

`sam local start-api --profile xxxxx`

`curl -d '{"phone":"99999999999"}' -H "Content-Type: application/json" -X POST http://127.0.0.1:3000/message/fallback/`