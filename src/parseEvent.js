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

const parseSNSMetadata = (records) => {
  const record = records[0]
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

const parseDynamoDBMetadata = (records) => {
  const record = records[0]
  const dynamodb = { StreamViewType: record.dynamodb.StreamViewType }
  dynamodb.records = parseDynamoDBRecords(records)
  return { dynamodb }
}

const parsers = {
  'aws:sns': parseSNSMetadata,
  'aws:dynamodb': parseDynamoDBMetadata,
}

const parseRecords = (records) => {
  const record = records[0]
  const eventSource = record.EventSource || record.eventSource
  if (!eventSource) {
    return {}
  }

  let awsRegion = record.AwsRegion || record.awsRegion
  const eventSourceARN =
    record.EventSourceARN ||
    record.eventSourceARN ||
    record.EventSubscriptionArn ||
    record.eventSubscriptionArn
  const eventVersion = record.EventVersion || record.eventVersion
  let accountId

  if (eventSourceARN) {
    const match = eventSourceARN.match(ARN_PARSER)
    awsRegion = awsRegion || match[2]
    accountId = match[3]
  }

  const metadata = {
    accountId,
    awsRegion,
    eventSource,
    eventSourceARN,
    eventVersion,
    records_length: records.length,
  }

  const parser = eventSource && parsers[eventSource]
  if (parser) {
    Object.assign(metadata, parser(records))
  }
  return metadata
}

const parseEventMetadata = (event) => {
  let metadata = {}
  if (event.Records && Array.isArray(event.Records) && event.Records.length > 0) {
    metadata = parseRecords(event.Records)
  }

  return metadata
}

module.exports = parseEventMetadata
