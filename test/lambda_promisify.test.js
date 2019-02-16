const lambda_promisify = require('../src/lambda_promisify')

test('passes through the event and context objects', async () => {
  const event = { event: true }
  const context = {
    name: 'blah',
    func: () => {
      return 'foobar'
    },
  }
  let executed = false
  const fn = async (event, context) => {
    expect(event).toEqual(event)
    expect(context.name).toBe('blah')
    expect(context.func()).toBe('foobar')
    executed = true
  }
  await lambda_promisify(fn, event, context)
  expect(executed).toBeTruthy()
})

test('return result from async fn', async () => {
  const fn = async () => {
    return 'foo'
  }
  const result = await lambda_promisify(fn)
  expect(result).toBe('foo')
})

test('return err from async fn', async () => {
  const fn = async () => {
    throw new Error('Danger Will Robinson!')
  }
  await expect(lambda_promisify(fn)).rejects.toThrow('Danger Will Robinson!')
})

test('return result from callback', async () => {
  const fn = (event, context, callback) => {
    callback(undefined, 'Yeah!')
  }
  await expect(lambda_promisify(fn)).resolves.toBe('Yeah!')
})

test('test err from callback', async () => {
  const fn = (event, context, callback) => {
    callback('Oops!')
  }
  await expect(lambda_promisify(fn)).rejects.toBe('Oops!')
})

test('test result from context.done', async () => {
  const fn = (event, context) => {
    context.done(undefined, 'Yeah!')
  }
  await expect(lambda_promisify(fn)).resolves.toBe('Yeah!')
})

test('test err from context.done', async () => {
  const fn = (event, context) => {
    context.done('Oops!')
  }
  await expect(lambda_promisify(fn)).rejects.toBe('Oops!')
})

test('test result from context.succeed', async () => {
  const fn = (event, context) => {
    context.succeed('Yeah!')
  }
  await expect(lambda_promisify(fn)).resolves.toBe('Yeah!')
})

test('test err from context.fail', async () => {
  const fn = (event, context) => {
    context.fail('Oops!')
  }
  await expect(lambda_promisify(fn)).rejects.toBe('Oops!')
})
