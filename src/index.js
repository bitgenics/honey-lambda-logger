const honeycomb = require('./honeycomb')
const parseEventMetadata = require('./parseEvent')

const ARN_PARSER = /arn:aws:(\w*):([^:]*):(\d*):/
let cold_start = true

const sendEvent = async (trace, context, start_time) => {
  const duration = process.hrtime(start_time)
  trace.durationInMs = (duration[0] * 1000 + duration[1] / 1e6).toFixed(1)
  trace.remainingMs = context.getRemainingTimeInMillis()
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
      const timeout_duration = context.getRemainingTimeInMillis()
      const timeoutInSec = Math.ceil(timeout_duration / 1000)
      const event_meta = parseMetadata ? parseEventMetadata(event) : null
      const match = context.invokedFunctionArn.match(ARN_PARSER)
      context.region = match.length > 3 ? match[2] : null
      context.accountId = match.length > 4 ? match[3] : null
      trace = { context, meta, event_meta, timeoutInSec, cold_start }
      timeout_id = setTimeout(async () => {
        trace.likely_timeout = true
        await sendEvent(trace, context, start_time)
      }, timeout_duration - 250)

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
