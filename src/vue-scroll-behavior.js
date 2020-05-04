const behavior = {}, history = {}

behavior.install = function (Vue, options) {
    // Global method
    Vue.vueScrollBehavior = function (router) {
        if (typeof router === 'object' && typeof router.beforeEach === 'function') {
            // Router beforeEach
            router.beforeEach((to, from, next) => {
                console.log('beforeEach', from.fullPath, history[from.fullPath])

                history[from.fullPath] = scrollY

                next()
            })

            // Router afterEach
            router.afterEach(route => {
                Vue.nextTick(() => {
                    console.log('afterEach', route.fullPath, history[route.fullPath])

                    const position = history[route.fullPath]
                    if (position) scrollTo(scrollX, position)
                })
            })
        } else {
            console.warn('Vue-scroll-behavior dependent on vue-router! ' +
                'Please create the router instance.')
        }
    }

    Vue.vueScrollBehavior(options.router)
}

if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(behavior)
}

export default behavior