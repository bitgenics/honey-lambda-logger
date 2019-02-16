const ARN_PARSER = /arn:aws:(\w*):([^:]*):(\d*):/

const filterNames = (obj, keys) => {
  const result = {}
  for (let key of keys) {
    if (obj[key]) {
      result[key] = obj[key]
    }
  }
  return result
}

const flattenSNSMessageAttributes = (attributes) => {
  const result = {}
  for (let attribute in attributes) {
    result[attribute] = attributes[attribute].Value
  }
  return result
}

const parseSNSMetadata = (event) => {
  const record = event.Records[0]
  const sns = filterNames(record.Sns, ['Timestamp', 'MessageId', 'Type', 'TopicArn', 'Subject'])
  sns.MessageAttributes = flattenSNSMessageAttributes(record.Sns.MessageAttributes)
  return { sns }
}

const flattenDynamoDBKeys = (obj) => {
  const result = {}
  for (key in obj) {
    const value_key = Object.keys(obj[key])[0]
    result[key] = obj[key][value_key]
  }
  return result
}

const parseDynamoDBRecords = (records) => {
  return records.map((record) => {
    const result = filterNames(record, ['eventID', 'eventName'])
    result.Keys = flattenDynamoDBKeys(record.dynamodb.Keys)
    return result
  })
}

const parseDynamoDBMetadata = (event) => {
  const record = event.Records[0]
  const dynamodb = { StreamViewType: record.dynamodb.StreamViewType }
  dynamodb.records = parseDynamoDBRecords(event.Records)
  return { dynamodb }
}

const parsers = {
  'aws:sns': parseSNSMetadata,
  'aws:dynamodb': parseDynamoDBMetadata,
}

const parseEventMetadata = (event) => {
  let metadata = {}
  if (event.Records) {
    const record = event.Records[0]
    let awsRegion = record.AwsRegion || record.awsRegion
    const eventSource = record.EventSource || record.eventSource
    const eventSourceARN = record.EventSourceARN || record.eventSourceARN
    const eventVersion = record.EventVersion || record.eventVersion
    const eventSubscriptionArn = record.EventSubscriptionArn || record.eventSubscriptionArn
    let accountId

    if (eventSourceARN || eventSubscriptionArn) {
      const arn = eventSourceARN || eventSubscriptionArn
      const match = arn.match(ARN_PARSER)
      awsRegion = awsRegion || match[2]
      accountId = match[3]
    }

    metadata = {
      accountId,
      awsRegion,
      eventSource,
      eventSourceARN,
      eventSubscriptionArn,
      eventVersion,
      records_length: event.Records.length,
    }

    const parser = eventSource && parsers[eventSource]
    if (parser) {
      Object.assign(metadata, parser(event))
    }
  }
  return metadata
}

module.exports = parseEventMetadata
