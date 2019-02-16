const execAsync = (func, event, context = {}) => {
  const promise = new Promise((resolve, reject) => {
    const callback = (err, cb_result) => {
      if (err) {
        reject(err)
      } else {
        resolve(cb_result)
      }
    }
    context.done = callback
    context.fail = callback
    context.succeed = (result) => {
      callback(null, result)
    }
    const result = func.apply(null, [event, context, callback])
    if (result) {
      resolve(result)
    }
  })
  return promise
}

module.exports = execAsync
