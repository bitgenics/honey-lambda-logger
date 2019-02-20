const encodeURL = require('encodeurl')
const honeycomb = require('./honeycomb')
const parseEventMetadata = require('./parseEvent')

const ARN_PARSER = /arn:aws:(\w*):([^:]*):(\d*):/
let cold_start = true

const sendEvent = async (trace, context, start_time) => {
  const duration = process.hrtime(start_time)
  trace.durationInMs = (duration[0] * 1000 + duration[1] / 1e6).toFixed(1)
  if (context && context.getRemainingTimeInMillis()) {
    trace.remainingMs = context.getRemainingTimeInMillis()
  }
  await honeycomb.sendEvent(trace)
}

const defaultTransformErr = (err) => {
  const { message, stack, ...rest } = err
  return { message, stack, ...rest }
}

const lambda_log_wrapper = (
  func,
  {
    meta = {},
    transformEvent,
    transformResult,
    transformErr,
    rethrowErr = true,
    parseMetadata = true,
  } = {}
) => {
  return async (event, context) => {
    let trace
    let timeout_id
    const start_time = process.hrtime()
    try {
      trace = { context, meta, cold_start }
      if (context && context.getRemainingTimeInMillis()) {
        console.log(`context.awsRequestId = ${context.awsRequestId}`)
        console.log(`context.invokeid = ${context.invokeid}`)
        const timeout_duration = context.getRemainingTimeInMillis()
        trace.timeoutInSec = Math.ceil(timeout_duration / 1000)
        timeout_id = setTimeout(async () => {
          trace.likely_timeout = true
          await sendEvent(trace, context, start_time)
        }, timeout_duration - 250)
        const match = context.invokedFunctionArn.match(ARN_PARSER)
        trace.region = match && match.length >= 3 ? match[2] : null
        trace.accountId = match && match.length >= 4 ? match[3] : null
        // prettier-ignore
        trace.logUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${trace.awsRegion}#logEventViewer:group=${context.logGroupName};stream=${encodeURL(context.logStreamName)};filter=${context.invokeid}`
      }

      trace.event_meta = parseMetadata ? parseEventMetadata(event) : null

      if (transformEvent) {
        trace.event = transformEvent(event)
      }
      const result = await func.apply(null, [event, context])
      if (transformResult) {
        trace.result = transformResult(result)
      }
      return result
    } catch (err) {
      trace.err = transformErr ? transformErr(err) : defaultTransformErr(err)
      if (rethrowErr) {
        throw err
      }
    } finally {
      clearTimeout(timeout_id)
      await sendEvent(trace, context, start_time)
      cold_start = false
    }
  }
}

module.exports = lambda_log_wrapper
