import {animate, range, timeout} from './utils'

function Instance(vm) {
    const placeholder = document.createElement('div'),
        dock = document.createElement('div'),
        dockStyle = dock.style,
        bar = vm.$el,
        barStyle = vm.$el.style,
        extend = vm.$refs.extend,
        barHeight = bar.offsetHeight

    dockStyle.position = 'fixed'
    dockStyle.zIndex = 1
    dockStyle.left = 0
    dockStyle.right = 0
    vm.dock === 'bottom' ? dockStyle.bottom = 0 : dockStyle.top = 0
    document.body.prepend(dock)

    placeholder.style.height = barHeight + 'px'
    bar.after(placeholder)
    dock.append(bar)

    let extendStyle, extendInnerStyle,
        extendHeight, minHeight, exHeight,

        scrollTimeout,

        prevScrollTop,
        currRatio = 1,
        targetRatio = 1,
        anim,

        scrolls = [], scrollUp = 0, scrollDown = 0,
        scrollStart = false

    const updateHeaderHeight = ratio => {
            currRatio = ratio

            const height = minHeight + currRatio * extendHeight,
                translateY = height - barHeight
            barStyle.height = height + 'px'
            extendInnerStyle.transform = 'translate(0, ' + translateY + 'px)'
            extendStyle.opacity = ratio
            extendStyle.display = ratio > 0 ? '' : 'none'
            extendStyle.overflow = ratio < 1 ? 'hidden' : ''
        },

        onScroll = ev => {
            const scrollTop = vm.scrollTop(),
                scrollDelta = scrollTop - prevScrollTop

            //console.log(scrollTop, scrollDelta)
            if (!scrollDelta) return
            //console.log(scrollTop, scrollDelta)

            prevScrollTop = scrollTop

            if (scrollTimeout) scrollTimeout.stop(true)

            if (scrollDelta > 0) scrollDown++
            else if (scrollDelta < 0) scrollUp++

            scrolls.push(scrollDelta)
            if (scrolls.length > 10) {
                if (scrolls[0] > 0) scrollDown--
                else if (scrolls[0] < 0) scrollUp--

                scrolls.splice(0, 1)
            }

            if (scrolls.length > 3 || scrollTop < barHeight) {
                let ratio = Math.min(1, (barHeight - minHeight - scrollTop) / (barHeight - minHeight))

                if (ratio >= 0) {
                    if (scrollUp < scrollDown || targetRatio !== 1) {
                        if (anim) anim.stop(true)
                        updateHeaderHeight(targetRatio = ratio)

                        //console.log('targetRatio ==', targetRatio, scrollTop)
                    }
                } else {
                    if (scrollStart && scrollUp > scrollDown) ratio = 1
                    else if (scrollUp < scrollDown) ratio = 0
                    else ratio = targetRatio

                    if (targetRatio !== ratio) {
                        if (anim) anim.stop(true)

                        anim = animate(range(currRatio, targetRatio = ratio, updateHeaderHeight),
                            Math.abs(currRatio - targetRatio) * 500)

                        //console.log('targetRatio ->', targetRatio, scrollTop)
                    }
                }
            }

            scrollTimeout = timeout(300)
            scrollTimeout.then(() => {
                if (targetRatio < 1 && targetRatio > 0) {
                    if (scrollUp < scrollDown) {
                        //console.log('scrollUp', {scrollUp, scrollDown, targetRatio})
                        vm.scrollTo(extendHeight)

                        if (anim) anim.stop(true)
                        updateHeaderHeight(targetRatio = 0)
                    } else {
                        //console.log('scrollDown', {scrollUp, scrollDown, targetRatio})
                        vm.scrollTo(0)

                        if (anim) anim.stop(true)
                        updateHeaderHeight(targetRatio = 1)
                    }
                } else {
                    //console.log('scrollEnd', {scrollUp, scrollDown, targetRatio}, scrolls)

                    scrollUp = 0
                    scrollDown = 0
                    scrolls.length = 0
                }
            })
        },
        onScrollStart = () => {
            scrollStart = true
            addEventListener('touchend', onScrollEnd)
        }, onScrollEnd = () => {
            scrollStart = false
            removeEventListener('touchend', onScrollEnd)
        },
        onResize = () => {
            //console.log('onResize', {innerHeight})

            if (exHeight != extendHeight + innerHeight) {
                exHeight = extendHeight + innerHeight
                document.documentElement.style.minHeight = exHeight + 'px'
            }
        }, onMouseOver = () => {
            if (!targetRatio) {
                if (anim) anim.stop(true)

                anim = animate(range(currRatio, targetRatio = 1, updateHeaderHeight),
                    Math.abs(currRatio - targetRatio) * 500)
            }
        }

    if (extend) {
        extendStyle = extend.style
        extendInnerStyle = extend.children[0].style

        extendHeight = extend.offsetHeight
        minHeight = barHeight - extendHeight

        prevScrollTop = vm.scrollTop()
        addEventListener('scroll', onScroll)
        addEventListener('resize', onResize, true)

        bar.addEventListener('touchstart', onScrollStart)
        bar.addEventListener('mouseover', onMouseOver)

        exHeight = extendHeight + innerHeight
        document.documentElement.style.minHeight = exHeight + 'px'

        dispatchEvent(new Event('resize'))
    }

    vm.gap = () => targetRatio == 0 ? extendHeight : 0
    vm.height = () => targetRatio == 0 ? minHeight : barHeight

    this.destroy = () => {
        placeholder.before(bar)

        placeholder.remove()
        dock.remove()

        if (extend) {
            removeEventListener('scroll', onScroll)
            removeEventListener('resize', onResize, true)

            bar.removeEventListener('touchstart', onScrollStart)
            bar.removeEventListener('mouseover', onMouseOver)
            removeEventListener('touchend', onScrollEnd)

            if (scrollTimeout) scrollTimeout.stop(true)
            if (anim) anim.stop(true)
        }
    }

    return this
}

export default {
    name: 'FixedBar',

    data() {
        return {}
    },

    props: {
        dock: {
            type: String
        },

        scrollTop: {
            type: Function,
            default: () => scrollY
        },

        scrollTo: {
            type: Function,
            default: top => scrollTo(scrollX, top)
        }
    },

    render(h) {
        const list = this.$slots.default.slice()

        if (this.$slots.extend)
            list.push(h('div', {
                attrs: {}, ref: 'extend'
            }, [h('div', {}, this.$slots.extend)]))

        return h('div', {}, list)
    },

    mounted() {
        this._instance = new Instance(this)
    },

    beforeDestroy() {
        this._instance.destroy()
    }
}