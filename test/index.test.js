const hll = require('../src/index')
const honeycomb = require('../src/honeycomb')

jest.mock('../src/honeycomb')

const newContext = () => {
  return {
    getRemainingTimeInMillis: () => 3000,
    awsRequestId: 'fe549ea7-670c-402f-a3c8-26e3815d813c',
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'some-test-lambda',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:some-test-lambda',
    invokeid: 'fe549ea7-670c-402f-a3c8-26e3815d813c',
    logGroupName: '/aws/lambda/some-test-lambda',
    logStreamName: '2019/02/15/[$LATEST]fff41893f3da45fc9b6d45ec4fa07a92',
    memoryLimitInMB: 128,
  }
}

test('simple event', async () => {
  const event = { testing: true }
  const context = newContext()
  const fn = hll(async () => {})
  await fn(event, context)
  expect(honeycomb.sendEvent).toBeCalledTimes(1)
  let trace = honeycomb.sendEvent.mock.calls[0][0]
  trace = JSON.parse(JSON.stringify(trace))
  expect(trace.context).toEqual({
    accountId: null,
    awsRequestId: 'fe549ea7-670c-402f-a3c8-26e3815d813c',
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'some-test-lambda',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:some-test-lambda',
    invokeid: 'fe549ea7-670c-402f-a3c8-26e3815d813c',
    logGroupName: '/aws/lambda/some-test-lambda',
    logStreamName: '2019/02/15/[$LATEST]fff41893f3da45fc9b6d45ec4fa07a92',
    memoryLimitInMB: 128,
    region: 'us-east-1',
  })
  expect(trace.timeoutInSec).toEqual(3)
})
