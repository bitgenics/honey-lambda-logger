const assert = require('assert')

try {
  assert(false)
} catch (err) {
  const { message, stack, ...rest } = err
  // console.log(code)
  // console.log('==================')
  // console.log(message)
  // console.log('==================')
  // console.log(stack)
  // console.log('==================')
  console.log({ message, stack, ...rest })
  console.log('==================')
}
