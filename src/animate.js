export default function (draw, duration, timing = timeFraction => timeFraction) {
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
