const encodeURL = require('encodeurl')
const r2 = require('r2')

const configured = process.env.HONEYCOMB_WRITE_KEY && process.env.HLL_DATASET

const sendEvent = async (event) => {
  if (configured) {
    const headers = {
      'X-Honeycomb-Team': process.env.HONEYCOMB_WRITE_KEY,
      'X-Honeycomb-Event-Time': Date.now(),
    }
    const url = `https://api.honeycomb.io/1/events/${encodeURL(process.env.HLL_DATASET)}`
    await r2.post(url, { json: event, headers }).response
  }
}

module.exports = { sendEvent }
