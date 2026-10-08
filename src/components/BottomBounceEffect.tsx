import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

const PULL_SCALE = 72
const RESISTANCE = 0.42
const RELEASE_DELAY = 140
// Touch tuning: a finger drag past the end pulls harder than a wheel tick, and a
// fast flick that lands on the end gets a small momentum stretch on its own.
const TOUCH_PULL_GAIN = 2.4
const MOMENTUM_MIN_VELOCITY = 0.6 // px per ms
const MOMENTUM_KICK = 16 // px of stretch per px/ms of arrival speed
const MOMENTUM_HOLD = 160

export function BottomBounceEffect({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pullTarget = useMotionValue(0)
  const springPull = useSpring(pullTarget, { stiffness: 420, damping: 32, mass: 0.8, restDelta: 0.2, restSpeed: 4 })
  const translateY = useTransform(springPull, (pull) => -pull)
  const gradientOpacity = useTransform(springPull, [0, 8, PULL_SCALE], [0, 0.08, 0.55])
  const gradientScaleY = useTransform(springPull, [0, PULL_SCALE], [0.8, 1])

  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let distance = 0
    let releaseTimer = 0
    let enabled = false

    const release = () => {
      window.clearTimeout(releaseTimer)
      distance = 0
      pullTarget.set(0)
    }
    const updateAvailability = () => {
      // Wheel/trackpad pull on desktop, finger drag on touch screens.
      enabled = !motionPreference.matches
      // Keep native overscroll on touch so pull-to-refresh at the top still works.
      root.classList.toggle('has-custom-overscroll', enabled && pointer.matches)
      if (!enabled) {
        release()
        springPull.jump(0)
      }
    }
    // innerHeight tracks the mobile toolbar collapsing, clientHeight does not.
    const isAtBottom = () =>
      window.scrollY + Math.max(window.innerHeight, root.clientHeight) >= root.scrollHeight - 2
    const measure = () => {
      if (!isAtBottom()) release()
    }
    // Momentum: a hard flick usually reaches the end after the finger lifts, so no
    // touchmove is left to pull with. Turn the arrival speed into a short kick.
    let lastScrollY = window.scrollY
    let lastScrollT = performance.now()
    let scrollVelocity = 0
    const onScroll = () => {
      const now = performance.now()
      const dt = Math.max(1, now - lastScrollT)
      const instant = (window.scrollY - lastScrollY) / dt
      scrollVelocity = dt > 120 ? instant : scrollVelocity * 0.4 + instant * 0.6
      lastScrollY = window.scrollY
      lastScrollT = now
      if (distance > 0 && !isAtBottom()) {
        release()
        return
      }
      if (enabled && !pointer.matches && touchY === null && distance === 0 &&
        isAtBottom() && scrollVelocity > MOMENTUM_MIN_VELOCITY) {
        const kick = Math.min(PULL_SCALE * 0.85, scrollVelocity * MOMENTUM_KICK)
        pullTarget.set(kick)
        window.clearTimeout(releaseTimer)
        releaseTimer = window.setTimeout(release, MOMENTUM_HOLD)
        scrollVelocity = 0
      }
    }
    const isInsideScroller = (event: Event) => {
      for (const target of event.composedPath()) {
        if (!(target instanceof HTMLElement) || target === document.body || target === root) continue
        if (target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) return true
      }
      return false
    }
    const applyPull = (delta: number) => {
      if (distance === 0) {
        const visiblePull = Math.max(0, springPull.get())
        distance = (PULL_SCALE / RESISTANCE) * Math.expm1(visiblePull / PULL_SCALE)
      }
      distance = Math.max(0, distance + delta)
      pullTarget.set(PULL_SCALE * Math.log1p(distance * RESISTANCE / PULL_SCALE))
    }

    // Touch: swiping up past the end of the page stretches it and lights the glow,
    // and lifting the finger lets it spring back.
    let touchY: number | null = null
    let touchPulling = false
    let touchIgnored = false
    const onTouchStart = (event: TouchEvent) => {
      if (!enabled || event.touches.length !== 1) {
        touchY = null
        return
      }
      touchY = event.touches[0].clientY
      touchPulling = false
      touchIgnored = isInsideScroller(event)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!enabled || touchY === null || touchIgnored || event.touches.length !== 1) return
      const y = event.touches[0].clientY
      const delta = touchY - y // positive while the finger moves up (scrolling down)
      touchY = y
      const atBottom = isAtBottom()
      if (!touchPulling) {
        if (!atBottom || delta <= 0) return
        touchPulling = true
      }
      if (event.cancelable) event.preventDefault()
      applyPull(delta * TOUCH_PULL_GAIN)
      if (distance <= 0) touchPulling = false
    }
    const onTouchEnd = () => {
      touchY = null
      if (touchPulling || distance > 0) release()
      touchPulling = false
    }

    const onWheel = (event: WheelEvent) => {
      if (!enabled || !pointer.matches || event.defaultPrevented || event.ctrlKey) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1
      const delta = event.deltaY * unit
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (delta < 0) {
        release()
        return
      }
      if (!isAtBottom()) return

      // Leave independently scrolling controls in charge of their own gestures.
      if (isInsideScroller(event)) return

      if (event.cancelable) event.preventDefault()
      // Logarithmic resistance keeps growing with force, without a stretch ceiling.
      applyPull(delta)
      window.clearTimeout(releaseTimer)
      // Scroll speed does not signal release. Wait for an actual pause in input.
      releaseTimer = window.setTimeout(release, RELEASE_DELAY)
    }

    updateAvailability()
    measure()
    const observer = new ResizeObserver(measure)
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    pointer.addEventListener('change', updateAvailability)
    motionPreference.addEventListener('change', updateAvailability)
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('blur', release)

    return () => {
      release()
      observer.disconnect()
      root.classList.remove('has-custom-overscroll')
      pointer.removeEventListener('change', updateAvailability)
      motionPreference.removeEventListener('change', updateAvailability)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('blur', release)
    }
  }, [pullTarget, springPull])

  return (
    <>
      <motion.div ref={wrapperRef} className="bottom-bounce-wrapper" style={{ y: translateY }}>
        {children}
      </motion.div>
      <motion.div
        className="bottom-overscroll-gradient"
        aria-hidden="true"
        style={{ opacity: gradientOpacity, scaleY: gradientScaleY }}
      />
    </>
  )
}
