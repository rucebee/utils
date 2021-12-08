export default function (src, cbName, id) {
  return new Promise((resolve, reject) => {
    let shouldAppend = false
    let el = document.querySelector('script[src="' + src + '"]')

    if (!el) {
      el = document.createElement('script')
      el.type = 'text/javascript'
      el.async = true
      el.src = src

      if (id) {
        const unique = document.getElementById(id)
        if (unique) unique.remove()

        el.id = id
      }

      if (cbName) {
        window[cbName] = function (...args) {
          delete window[cbName]

          const ev = new Event('callback')
          if (args.length > 1 || args.length === 1 && args[0] !== undefined) {
            ev.dataArray = args
          }

          el.dispatchEvent(ev)
        }
      }

      shouldAppend = true
    } else if (el.hasAttribute('data-resolved')) {
      el.dataArray ? resolve(...el.dataArray) : resolve()

      return
    }

    function _reject (ev) {
      clear()
      reject(ev)
    }

    function _resolve (ev) {
      clear()
      el.setAttribute('data-resolved', '')
      if (ev.dataArray) {
        el.dataArray = ev.dataArray
        resolve(...ev.dataArray)
      } else {
        delete el.dataArray
        resolve()
      }
    }

    function clear () {
      el.removeEventListener('error', _reject)
      el.removeEventListener('abort', _reject)
      el.removeEventListener('load', _resolve)
      el.removeEventListener('callback', _resolve)
    }

    el.addEventListener('error', _reject)
    el.addEventListener('abort', _reject)
    el.addEventListener(cbName ? 'callback' : 'load', _resolve)

    if (shouldAppend) {
      document.head.appendChild(el)
    }
  })
}
