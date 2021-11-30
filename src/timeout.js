export default function (duration, complete) {
  let timerId, _reject

  const promise = duration ? new Promise((resolve, reject) => {
    _reject = reject

    timerId = setTimeout(resolve, duration)
  }) : Promise.resolve()

  promise.stop = (silent = false) => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = 0

      if (!silent) {
        _reject()
      }
    }
  }

  if (complete) {
    promise.then(complete, complete)
  }

  return promise
}
