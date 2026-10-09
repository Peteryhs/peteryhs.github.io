import { useEffect, useRef, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

const PULL_SCALE = 72
const RESISTANCE = 0.42
const RELEASE_DELAY = 120
// Wheel/trackpad: the snap-back must not depend on how hard the page was flung.
// A hard flick keeps streaming momentum wheel events long after the fingers lift,
// so we cap how long one gesture can hold the stretch, end it as soon as the
// deltas start decaying (momentum), and swallow the rest of that momentum tail.
const WHEEL_MAX_HOLD = 220 // ms from the first pull of a gesture
const WHEEL_GESTURE_GAP = 140 // ms of silence that ends a wheel gesture
const MOMENTUM_DECAY_RATIO = 0.6
const MOMENTUM_DECAY_EVENTS = 3
// Fixed-duration return so a big stretch comes back in the same time as a small one.
const RETURN_DURATION = 0.42
const RETURN_EASE = [0.22, 1, 0.36, 1] as const
const PULL_SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8, restDelta: 0.2, restSpeed: 4 } as const
// Touch tuning: a finger drag past the end pulls harder than a wheel tick, and a
// fast flick that lands on the end gets a small momentum stretch on its own.
const TOUCH_PULL_GAIN = 2.4
const MOMENTUM_MIN_VELOCITY = 0.6 // px per ms
const MOMENTUM_KICK = 16 // px of stretch per px/ms of arrival speed
const MOMENTUM_HOLD = 160
// How many extra glow heights the halo can gain on a very long pull.
const GLOW_MAX_GROWTH = 2.1

export function BottomBounceEffect({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const springPull = useMotionValue(0)
  const translateY = useTransform(springPull, (pull) => -pull)
  const gradientOpacity = useTransform(springPull, [0, 8, PULL_SCALE], [0, 0.08, 0.55])
  // The glow keeps reaching further up the screen the harder the page is pulled,
  // tracking the stretch instead of topping out (soft cap so it never fills the view).
  const gradientScaleY = useTransform(springPull, (pull) => {
    const t = Math.max(0, pull) / PULL_SCALE
    return 0.7 + GLOW_MAX_GROWTH * (1 - Math.exp(-t * 0.9))
  })

  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let distance = 0
    let releaseTimer = 0
    let enabled = false
    let pullAnimation: { stop: () => void } | null = null
    let target = 0
    const pullTarget = {
      set(value: number) {
        if (value === target && pullAnimation) return
        target = value
        pullAnimation?.stop()
        pullAnimation = value === 0
          ? (springPull.get() === 0 ? null : animate(springPull, 0, { duration: RETURN_DURATION, ease: RETURN_EASE }))
          : animate(springPull, value, PULL_SPRING)
      },
    }

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
        pullAnimation?.stop()
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

    // Wheel gesture bookkeeping.
    let wheelLastT = -Infinity
    let wheelGestureStart = 0
    let wheelPeak = 0
    let wheelLastDelta = 0
    let wheelDecayCount = 0
    let wheelSwallowing = false
    const endWheelGesture = () => {
      wheelSwallowing = true
      release()
    }

    const onWheel = (event: WheelEvent) => {
      if (!enabled || !pointer.matches || event.defaultPrevented || event.ctrlKey) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1
      const delta = event.deltaY * unit
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const now = event.timeStamp || performance.now()
      const gap = now - wheelLastT
      wheelLastT = now
      if (delta < 0) {
        wheelSwallowing = false
        release()
        return
      }
      if (!isAtBottom()) return

      // Leave independently scrolling controls in charge of their own gestures.
      if (isInsideScroller(event)) return

      if (event.cancelable) event.preventDefault()

      if (gap > WHEEL_GESTURE_GAP) {
        // A fresh gesture after a real pause.
        wheelSwallowing = false
        wheelGestureStart = now
        wheelPeak = 0
        wheelDecayCount = 0
        wheelLastDelta = 0
      } else if (wheelSwallowing) {
        // Still the momentum tail of a gesture that already bounced back. Only a
        // clear new push (a sharp jump in delta) starts another stretch.
        const newPush = delta > wheelLastDelta * 2.5 && delta > 20
        wheelLastDelta = delta
        if (!newPush) return
        wheelSwallowing = false
        wheelGestureStart = now
        wheelPeak = 0
        wheelDecayCount = 0
      }

      // Momentum detection: deltas shrinking steadily below the peak means the
      // fingers have lifted and the OS is coasting.
      wheelDecayCount = delta < wheelLastDelta && delta < wheelPeak * MOMENTUM_DECAY_RATIO ? wheelDecayCount + 1 : 0
      wheelPeak = Math.max(wheelPeak, delta)
      wheelLastDelta = delta
      if (wheelDecayCount >= MOMENTUM_DECAY_EVENTS || now - wheelGestureStart > WHEEL_MAX_HOLD) {
        endWheelGesture()
        return
      }

      // Logarithmic resistance keeps growing with force, without a stretch ceiling.
      applyPull(delta)
      window.clearTimeout(releaseTimer)
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
      pullAnimation?.stop()
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
  }, [springPull])

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
