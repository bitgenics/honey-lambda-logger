const encodeURL = require('encodeurl')
const honeycomb = require('./honeycomb')
const parseEventMetadata = require('./parseEvent')
const parseResult = require('./parseResult')

const ARN_PARSER = /arn:aws:(\w*):([^:]*):(\d*):/
let cold_start = true

const sendEvent = async (trace, context, start_time) => {
  const duration = process.hrtime(start_time)
  trace.durationInMs = Math.ceil(duration[0] * 1000 + duration[1] / 1e6)
  if (context && context.getRemainingTimeInMillis()) {
    trace.remainingMs = context.getRemainingTimeInMillis()
    trace.costUnits = Math.ceil(trace.durationInMs / 100) * (context.memoryLimitInMB / 128)
    trace.costInMicroDollar = trace.costUnits * 0.2 + 0.2
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
    transformErr = defaultTransformErr,
    ignoreErr = false,
    rethrowErr = true,
    parseMetadata = true,
  } = {}
) => {
  return async (event, context) => {
    let trace
    let timeout_id
    global.hll_handle_log = {}
    const start_time = process.hrtime()
    try {
      trace = { context, meta, cold_start }
      if (context && context.getRemainingTimeInMillis()) {
        const timeout_duration = context.getRemainingTimeInMillis()
        trace.timeoutInSec = Math.ceil(timeout_duration / 1000)
        timeout_id = setTimeout(async () => {
          trace.likely_timeout = true
          await sendEvent(trace, context, start_time)
        }, timeout_duration - 250)
        const match = context.invokedFunctionArn.match(ARN_PARSER)
        trace.context.region = match && match.length >= 3 ? match[2] : null
        trace.context.accountId = match && match.length >= 4 ? match[3] : null
        // prettier-ignore
        trace.context.logUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${trace.context.region}#logEventViewer:group=${context.logGroupName};stream=${encodeURL(context.logStreamName)};filter="${context.invokeid}"`
      }

      trace.event_meta = parseMetadata ? parseEventMetadata(event) : null

      if (transformEvent) {
        trace.event = transformEvent(event)
      }
      const result = await func.apply(null, [event, context])
      if (transformResult) {
        trace.result = transformResult(result)
      } else {
        trace.result = parseResult(result)
      }
      return result
    } catch (err) {
      if (!ignoreErr) {
        trace.err = transformErr(err)
      }
      if (rethrowErr) {
        throw err
      }
    } finally {
      clearTimeout(timeout_id)
      trace.handle = global.hll_handle_log
      await sendEvent(trace, context, start_time)
      cold_start = false
    }
  }
}

module.exports = lambda_log_wrapper
