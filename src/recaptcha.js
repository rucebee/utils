import loadJs from './loadJs'

const scriptId = 'grecaptcha-script'
const elId = 'grecaptcha'

let siteKey = null
let loadJsPromise
let promised = null

function promiseRelease () {
  clearTimeout(promised.timerId)
  removeEventListener('click', onClick, true)
  promised = null
}

function promiseResolve (token) {
  if (promised) {
    promised.resolve(token)
    promiseRelease()
  }
}

function promiseReject (reason = { error: 'UserCancel' }) {
  if (promised) {
    promised.reject({ error: 'UserCancel' })
    promiseRelease()
  }
}

async function destroy () {
  promiseReject()

  try {
    await loadJsPromise
  } catch (err) {
    console.log('recaptcha prev', err)
  }

  siteKey = null

  const el = document.getElementById(elId)
  if (el) {
    grecaptcha.reset()
    el.remove()
  }

  const scriptEl = document.getElementById(scriptId)
  if (scriptEl) scriptEl.remove()

  delete window.grecaptcha

  console.log('recaptcha destroyed')
}

const onClick = (ev) => {
  promiseReject()
}

export default async (key) => {
  if (key === 'destroy') {
    await destroy()

    return
  } else if (key) {
    if (siteKey && siteKey !== key)
      await destroy()

    siteKey = key
  }

  if (!siteKey) return

  try {
    await loadJsPromise
  } catch (err) {
    console.log('recaptcha prev', err)
  }

  let el, promise
  try {
    if (typeof grecaptcha === 'undefined') {
      loadJsPromise = loadJs(`https://www.google.com/recaptcha/api.js?onload=grecaptchaLoaded&render=explicit&hl=${process.env.LOCALE}`, 'grecaptchaLoaded', scriptId)
      await loadJsPromise
    }

    promiseReject()

    el = document.getElementById(elId)
    if (el)
      grecaptcha.reset()
    else {
      el = document.createElement('div')
      el.id = elId
      el.style.position = 'absolute'

      document.body.appendChild(el)

      grecaptcha.render(el, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token) => {
          console.log('recaptcha', { token })

          // while (recaptchaEl.lastChild)
          //   recaptchaEl.removeChild(recaptchaEl.lastChild)

          promiseResolve(token)
        },
        'error-callback': () => {
          console.error('recaptcha')

          // while (recaptchaEl.lastChild)
          //   recaptchaEl.removeChild(recaptchaEl.lastChild)

          promiseResolve()
        },
      })

      console.log('recaptcha rendered')
    }

    if (key) return

    promise = new Promise((resolve, reject) => {
      promised = {
        resolve,
        reject,
        timerId: setInterval(() => {
          let frEl = document.querySelector('iframe[src^="https://www.google.com/recaptcha/api2/bframe"]')
          if (!frEl) promiseResolve()
          else while (frEl !== document.body) {
            if (frEl.style.visibility === 'hidden' || frEl.style.display === 'none') {
              promiseResolve()
              break
            }

            frEl = frEl.parentElement
          }
        }, 5000),
      }
    })

    addEventListener('click', onClick, true)

    await grecaptcha.execute()
  } catch (err) {
    console.error('recaptcha', err)

    if (promised) promiseRelease()
    if (el) document.body.removeChild(el)

    return
  }

  return await promise
}
