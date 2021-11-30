export default function () {
  let point = Promise.resolve()

  this.enter = async () => {
    const _point = point
    let _resolve
    point = new Promise(resolve => {
      _resolve = resolve
    })

    await _point

    return _resolve
  }

  this.exec = async fn => {
    const leave = await this.enter()
    try {
      await fn()
    } finally {
      leave()
    }
  }
}
