test('not configured honeycomb does not send anything', async () => {
  jest.resetModules()
  const r2 = require('r2')
  jest.mock('r2')
  const honeycomb = require('../src/honeycomb')
  await honeycomb.sendEvent({ test: true })
  expect(r2.post).not.toBeCalled()
})

test('honeycomb to send the event if configured', async () => {
  jest.resetModules()
  const r2 = require('r2')
  jest.mock('r2')
  process.env.HONEYCOMB_WRITE_KEY = 'abcd12345'
  process.env.HLL_DATASET = 'lambdas & wéird chars'
  const honeycomb = require('../src/honeycomb')
  r2.post.mockResolvedValue({})

  await honeycomb.sendEvent({ test: true })

  expect(r2.post).toHaveBeenCalledTimes(1)
  const args = r2.post.mock.calls[0]
  expect(args[0]).toBe('https://api.honeycomb.io/1/events/lambdas%20&%20w%C3%A9ird%20chars')
  expect(args[1].json).toEqual({ test: true })
  const headers = args[1].headers
  expect(headers['X-Honeycomb-Team']).toEqual('abcd12345')
  const time = headers['X-Honeycomb-Event-Time']
  expect(time).toBeLessThan(Date.now())
  expect(time).toBeGreaterThan(Date.now() - 60 * 1000)
})
