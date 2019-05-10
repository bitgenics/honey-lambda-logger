const lowercaseHeaders = (headers) => {
  return Object.keys(headers).reduce((acc, key) => {
    acc[key.toLowerCase()] = headers[key]
    return acc
  }, {})
}

const parseResponse = (response) => {
  let { statusCode, headers } = response
  headers = lowercaseHeaders(headers)
  return { statusCode, headers }
}

const parseResult = (result) => {
  if (result.statusCode) {
    return parseResponse(result)
  }
}

module.exports = parseResult
