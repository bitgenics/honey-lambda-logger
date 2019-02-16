const parseEvent = require('../src/parseEvent')

test('parse a DynamoDB stream event', () => {
  const event = require('./dynamo_insert_event.json')
  console.log(event)
})
