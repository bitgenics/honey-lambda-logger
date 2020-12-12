# honey-lambda-logger

## The problem

Lambdas are amazing, but as soon as you have more than a handful of them logging & monitoring them becomes unwieldy. Creating alarms for every individual lambda isn't really an option and creating one for all lambdas is an exercise in frustration.

```
Cloudwatch: "Your threshold of 3 errors in 5 minutes is breached"
Me: That is bad! Which ones are giving errors?
Cloudwatch: "Your threshold of 3 errors in 5 minutes is breached"
Me: But where are the errors?!
CLoudwatch: "Your threshold of ... "
Me: Aaarrrrggghhhhh..
```

## The Solution

This library is designed to wrap all NodeJS invocations and automagically suck all metadata into honeycomb. 90% of your data needs can be met with a quick:

```javascript
const hll = require('@bitgenics/honey-lambda-logger')

const handler = async (event, context) => {
  .....//Your regular lambda
}

module.exports = hll(handler)
```

NOTE! Currently `honey-lambda-logger` only works on async handlers and ignores the `node6` callbacks or even early `context.done` type callbacks.

## Configuring

Configuring `hll` is done through two environment variables

* HONEYCOMB_WRITE_KEY: Your write key for Honeycomb.
* HLL_DATASET: And surprise surprise, the Dataset to log to.

## Customizing 

We do give you a lot of control of what exactly should go to Honeycomb. Here are the options you can pass to `hll(handler, options)`

* `meta`: An object that gets passed to honeycomb as-is. Use this for any static information about the Lambda, such as what module it is from.
* `transformEvent`: Function with signature `(event) => {}`. We automatically extract any AWS specified metadata supplied in the event and context objects. But this function allows you to extract data from the event payload.
* `transformResult`: Function with signature `(result) => {}`. We do not automatically log anything from the return value of the handler. If you do want to log something, this is your chance.
* `transformErr`: Function with signature `(err) => {}`. We already log everything on the `Error` object, but maybe you want it in a different format?
* `rethrowErr`: `Boolean`, default `true`. Whether or not to rethrow the error after logging it.
* `parseMetadata`: `Boolean`, default `true`. If you don't want to parse the metadata associated with the event, you can disable it here.

## Log Output

### Context
For more information on most of these settings, see: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html

| Name | Description |
| --- | --- |
| context.accountId | The AWS accountId running the Lambda. |
| context.awsRequestId | The identifier of the invocation request. |
| context.callbackWaitsForEmptyEventLoop | Send response immediately without waiting. |
| context.functionName | The name of the Lambda function.  |
| context.functionVersion | The version of the function. |
| context.invokedFunctionArn | The Amazon Resource Name (ARN) used to invoke the function. |
| context.invokeid | `context.awsRequestId`, but different? |
| context.logGroupName | The log group for the function. |
| context.logStreamName | The log stream for the function instance.|
| context.logUrl | A URL to the correct LogStream with a filter for this request. |
| context.memoryLimitInMB | The amount of memory configured on the function. |
| context.region | The region the Lambda ran in. |

### General

| Name | Description |
| --- | --- |
| cold_start | Is this a cold start of the function? |
| costInMicroDollar | The cost in microDollars. The $ price of a million requests|
| costUnits | 1 cost unit = lowest possible charge: 100ms of 128Mb Lambda |
| durationInMs | How long the execution took in milliseconds |
| err | The error object |
| likely_timeout | 250ms before the lambda times out we log an event with likely_timeout set |
| remainingMs | How many milliseconds are left |

### Events

If we can determine what type of event triggered the Lambda we will log as much as information as we can.
Currently we only parse DynamoDB and SNS Notifications. We are working on API Gateway and S3 events.

#### All (some?) events

| Name | Description |
| --- | --- |
| event_meta.accountId | The AWS accountId of the source of the event. |
| event_meta.awsRegion | Region of the source. |
| event_meta.eventSource | The system responsible for the trigger (ie `aws:sns`) |
| event_meta.eventSourceARN | ARN of the source of the event. |
| event_meta.eventVersion | Event version. |
| event_meta.records_length | The amount of records in this event. |

#### DynamoDB events

| Name | Description |
| --- | --- |
| event_meta.dynamodb.StreamViewType | The StreamViewType of the DynamoDB Stream. |
| event_meta.dynamodb.records | Array of Objects with all `Key`, `eventName` and `eventID` for every record |

#### SNS events

| Name | Description |
| --- | --- |
| event_meta.sns.MessageAttributes.<Attribute> | There is a column for every MessageAttribute and their value |
| event_meta.sns.MessageId | MessageId |
| event_meta.sns.TopicArn | Arn of the SNS Topic the notification is from. |
| event_meta.sns.Type | Type of message. |
