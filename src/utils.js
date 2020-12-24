const NOOP = () => {
}

export function animate(draw, duration, timing = timeFraction => timeFraction) {
    let progress = 0, animateId, _reject

    const start = performance.now(),
        promise = new Promise((resolve, reject) => {
            _reject = reject

            if (duration <= 0) {
                draw(progress = 1)
                resolve(progress)
            }

            animateId = requestAnimationFrame(function animate(time) {
                let timeFraction = time > start ? (time - start) / duration : 0
                if (timeFraction > 1) timeFraction = 1

                progress = timing(timeFraction)

                draw(progress)

                if (timeFraction < 1) {
                    animateId = requestAnimationFrame(animate)
                } else {
                    animateId = 0

                    resolve(progress)
                }
            })
        })

    promise.stop = (silent = false) => {
        if (animateId) {
            cancelAnimationFrame(animateId)
            animateId = 0

            if (!silent) _reject(progress)
        }
    }

    return promise
}

export function range(a, b, fn) {
    return period => {
        //console.log(period)
        fn(a + period * (b - a))
    }
}

export function timeout(duration, complete) {
    let timerId, _reject

    const promise = duration ? new Promise((resolve, reject) => {
        _reject = reject

        timerId = setTimeout(resolve, duration)
    }) : Promise.resolve()

    promise.stop = (silent = false) => {
        if (timerId) {
            clearTimeout(timerId)
            timerId = 0

            if (!silent) _reject()
        }
    }

    if (complete)
        promise.then(complete, complete)

    return promise
}

export function CriticalSection() {
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

export function is_iOS() {
    return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}