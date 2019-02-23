const parseEvent = require('../src/parseEvent')

test('parse a DynamoDB stream event', () => {
  const event = require('./dynamo_insert_event.json')
  const metadata = parseEvent(event)
  const expected = {
    accountId: '123456789012',
    awsRegion: 'us-east-1',
    eventSource: 'aws:dynamodb',
    eventSourceARN:
      'arn:aws:dynamodb:us-east-1:123456789012:table/Example/stream/2018-10-27T13:00:02.180',
    eventSubscriptionArn: undefined,
    eventVersion: '1.1',
    records_length: 1,
    dynamodb: {
      StreamViewType: 'NEW_AND_OLD_IMAGES',
      records: [
        {
          Keys: { partition_key: 'Partition', sort_key: 'Sorting' },
          eventID: '2e9f9c4b9ad4f493fdcb79765cb29ffa',
          eventName: 'INSERT',
        },
      ],
    },
  }

  expect(metadata).toEqual(expected)
})

test('parse a SNS Notification event', () => {
  const event = require('./sns_notification-event.json')
  const metadata = parseEvent(event)
  const expected = {
    accountId: '123456789012',
    awsRegion: 'us-east-1',
    eventSource: 'aws:sns',
    eventSourceARN:
      'arn:aws:sns:us-east-1:123456789012:SomeTopicName:0ed6d91c-b94c-476a-a3d5-0696ce6c0793',
    eventVersion: '1.0',
    records_length: 1,
    sns: {
      Timestamp: '2018-07-24T03:45:49.750Z',
      MessageId: '8227900a-9b93-55b4-9b60-c3da39bed461',
      Type: 'Notification',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:SomeTopicName',
      Subject: 'something',
      MessageAttributes: { Test: 'TestString' },
    },
  }
  expect(metadata).toEqual(expected)
})

test('Do not fail on a random event with Records field', () => {
  parseEvent({ Records: {} })
  parseEvent({ Records: [] })
  parseEvent({ Records: [{ foo: 'bar' }] })
})

test('Parse a API Gateway Proxy event', () => {
  const event = require('./api-gw-proxy.json')
  const metadata = parseEvent(event)
  const expected = {
    resource: '/{proxy+}',
    path: '/path/to/resource',
    httpMethod: 'POST',
    queryStringParameters: {
      foo: 'bar',
    },
    pathParameters: {
      proxy: '/path/to/resource',
    },
    stageVariables: {
      baz: 'qux',
    },
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'X-Forwarded-Port': '443',
      'X-Forwarded-Proto': 'https',
    },
    requestContext: {
      accountId: '123456789012',
      resourceId: '123456',
      stage: 'prod',
      requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      apiId: '1234567890',
      protocol: 'HTTP/1.1',
    },
  }
  expect(metadata).toEqual(expected)
})
