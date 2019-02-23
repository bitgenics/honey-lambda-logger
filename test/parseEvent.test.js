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
  const metadata = parseEvent({ Records: [{ foo: 'bar' }] })
  console.log({ metadata })
})
