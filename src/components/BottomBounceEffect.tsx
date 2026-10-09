import { useEffect, useRef, type ReactNode } from 'react'
import { WheelGestureTracker } from './wheelGesture'

/*
 * Bottom-of-page rubber band, modelled on the iOS edge scroll.
 *
 * Every bit of scroll input past the end of the page is added to a raw overscroll
 * distance. What the page actually moves is that distance run through Apple's
 * rubber-band curve, so each extra pixel of input moves the page a little less
 * than the one before: easy at first, increasingly heavy, never a hard stop.
 * A glow rises from the bottom edge as the page lifts.
 *
 * One requestAnimationFrame loop owns all motion. Input only changes the raw
 * distance; when input stops (fingers lifted, wheel idle, or the trackpad's
 * momentum coast detected) the page returns in a fixed time, however far it
 * was pulled.
 */

const RUBBER_COEFF = 0.55 // Apple's rubber-band constant
const RUBBER_LIMIT = 0.42 // the stretch approaches 42% of the viewport height
const WHEEL_GAIN = 1
const TOUCH_GAIN = 1.15
const IDLE_MS = 90 // no wheel input for this long means the user has let go
const RETURN_MS = 460 // fixed return time, independent of how far it was pulled
const SMOOTH_MS = 40 // display lag that smooths out mouse wheel notches
const GLOW_FULL_AT = 90 // px of lift at which the glow reaches full strength
const GLOW_MAX_OPACITY = 0.65
const GLOW_REACH = 1.25 // glow height gained per px of lift
// Touch: a fling that lands on the end gets a short kick and comes straight back.
const MOMENTUM_MIN_VELOCITY = 0.6 // px per ms
const MOMENTUM_KICK = 140 // raw px per px/ms of arrival speed

const rubber = (raw: number, limit: number) => limit * (1 - 1 / ((raw * RUBBER_COEFF) / limit + 1))
const unrubber = (offset: number, limit: number) => {
  const ratio = Math.min(offset / limit, 0.999)
  return (limit / RUBBER_COEFF) * (1 / (1 - ratio) - 1)
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

type Mode = 'idle' | 'input' | 'return'

export function BottomBounceEffect({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const glow = glowRef.current
    if (!wrapper || !glow) return

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    const wheel = new WheelGestureTracker()

    let enabled = false
    let mode: Mode = 'idle'
    let raw = 0 // overscroll input, before resistance
    let shown = 0 // px the page is currently lifted
    let lastInput = 0
    let holding = false // a finger is down and pulling
    let returnFrom = 0
    let returnStart = 0
    let frame = 0
    let lastFrame = 0
    // Measured once per gesture: on phones the toolbar collapsing mid-pull changes
    // the viewport height, and re-measuring every frame made the page jump.
    let gestureLimit = 0
    let glowBase = 200
    let gestureScrollY = 0

    const limit = () => gestureLimit || Math.max(160, root.clientHeight * RUBBER_LIMIT)
    const beginGesture = () => {
      gestureLimit = Math.max(160, root.clientHeight * RUBBER_LIMIT)
      glowBase = glow.offsetHeight || 200
      gestureScrollY = window.scrollY
    }

    const paint = () => {
      if (shown <= 0.1) {
        wrapper.style.transform = ''
        glow.style.opacity = '0'
        glow.style.transform = ''
        return
      }
      wrapper.style.transform = `translate3d(0, ${-shown}px, 0)`
      glow.style.opacity = String(Math.min(1, shown / GLOW_FULL_AT) * GLOW_MAX_OPACITY)
      glow.style.transform = `scaleY(${1 + (shown * GLOW_REACH) / glowBase})`
    }

    const tick = (now: number) => {
      frame = 0
      const dt = Math.min(64, now - lastFrame || 16)
      lastFrame = now

      if (mode === 'input' && !holding && now - lastInput > IDLE_MS) startReturn(now)

      if (mode === 'return') {
        const p = Math.min(1, (now - returnStart) / RETURN_MS)
        raw = returnFrom * (1 - easeOutCubic(p))
        shown = rubber(raw, limit())
        if (p >= 1) {
          raw = 0
          shown = 0
          mode = 'idle'
          gestureLimit = 0
        }
      } else if (mode === 'input') {
        const target = rubber(raw, limit())
        // A finger is tracked 1:1; wheel notches get a short smoothing lag.
        shown = holding ? target : shown + (target - shown) * (1 - Math.exp(-dt / SMOOTH_MS))
      }

      paint()
      if (mode !== 'idle') frame = requestAnimationFrame(tick)
    }
    const run = () => {
      if (!frame) {
        lastFrame = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    function startReturn(now = performance.now()) {
      if (mode === 'idle' || mode === 'return') return
      holding = false
      // Start from what is on screen so the return never jumps.
      returnFrom = unrubber(shown, limit())
      returnStart = now
      mode = 'return'
      run()
    }

    const addInput = (delta: number) => {
      if (mode === 'idle') beginGesture()
      if (mode !== 'input') raw = unrubber(shown, limit()) // pick up mid-return
      mode = 'input'
      raw = Math.max(0, raw + delta)
      lastInput = performance.now()
      run()
    }

    const reset = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      mode = 'idle'
      raw = 0
      shown = 0
      holding = false
      gestureLimit = 0
      wheel.reset()
      paint()
    }

    // Turn off the browser's own overscroll so it never bounces on top of ours.
    // On touch screens only do that in the lower half of the page, so iOS/Android
    // pull-to-refresh at the top keeps working.
    let customOverscroll = false
    const syncOverscroll = () => {
      const want = enabled && (finePointer.matches || window.scrollY > (root.scrollHeight - root.clientHeight) / 2)
      if (want !== customOverscroll) {
        customOverscroll = want
        root.classList.toggle('has-custom-overscroll', want)
      }
    }
    const updateAvailability = () => {
      enabled = !reducedMotion.matches
      syncOverscroll()
      if (!enabled) reset()
    }

    // innerHeight tracks the mobile toolbar collapsing, clientHeight does not.
    const isAtBottom = () =>
      window.scrollY + Math.max(window.innerHeight, root.clientHeight) >= root.scrollHeight - 2

    const isInsideScroller = (event: Event) => {
      for (const target of event.composedPath()) {
        if (!(target instanceof HTMLElement) || target === document.body || target === root) continue
        if (target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) return true
      }
      return false
    }

    // Wheel and trackpad.
    const onWheel = (event: WheelEvent) => {
      if (!enabled || event.defaultPrevented || event.ctrlKey) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1
      const delta = event.deltaY * unit
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

      if (delta < 0) {
        wheel.reset()
        if (mode === 'idle') return
        // Scrolling back up while lifted lowers the page first, then scrolls normally.
        if (event.cancelable) event.preventDefault()
        addInput(delta * WHEEL_GAIN * 2)
        if (raw === 0) reset()
        return
      }

      if (!isAtBottom()) {
        wheel.reset()
        return
      }
      if (isInsideScroller(event)) return
      if (event.cancelable) event.preventDefault()

      const action = wheel.feed(delta, event.timeStamp || performance.now())
      if (action === 'pull') addInput(delta * WHEEL_GAIN)
      else if (action === 'release') startReturn()
      // 'swallow': the trackpad is still coasting after the fingers lifted; ignore it.
    }

    // Touch.
    let touchY: number | null = null
    let touchIgnored = false
    const onTouchStart = (event: TouchEvent) => {
      if (!enabled || event.touches.length !== 1) {
        touchY = null
        return
      }
      touchY = event.touches[0].clientY
      touchIgnored = isInsideScroller(event)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!enabled || touchY === null || touchIgnored || event.touches.length !== 1) return
      const y = event.touches[0].clientY
      const delta = touchY - y // positive while the finger moves up
      touchY = y
      if (!holding) {
        if (!isAtBottom() || delta <= 0) return
        holding = true
      }
      if (event.cancelable) event.preventDefault()
      addInput(delta * TOUCH_GAIN)
      if (raw === 0) {
        holding = false
        reset()
      }
    }
    const onTouchEnd = () => {
      touchY = null
      if (holding) startReturn()
      holding = false
    }

    // Scroll: catch flings that land on the end, and drop the stretch if the page
    // gets scrolled some other way (keyboard, scrollbar, anchor link).
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
      syncOverscroll()
      const atBottom = isAtBottom()
      // Only a real scroll away from the end cancels the stretch; the mobile
      // toolbar showing or hiding nudges isAtBottom without the page moving.
      if (mode !== 'idle' && !holding && window.scrollY < gestureScrollY - 8) {
        reset()
        return
      }
      if (enabled && !finePointer.matches && touchY === null && mode === 'idle' &&
        atBottom && scrollVelocity > MOMENTUM_MIN_VELOCITY) {
        addInput(Math.min(scrollVelocity, 4) * MOMENTUM_KICK)
        scrollVelocity = 0
      }
    }

    const onResize = () => {
      syncOverscroll()
    }

    updateAvailability()
    finePointer.addEventListener('change', updateAvailability)
    reducedMotion.addEventListener('change', updateAvailability)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('blur', reset)

    return () => {
      reset()
      root.classList.remove('has-custom-overscroll')
      finePointer.removeEventListener('change', updateAvailability)
      reducedMotion.removeEventListener('change', updateAvailability)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return (
    <>
      <div ref={wrapperRef} className="bottom-bounce-wrapper">
        {children}
      </div>
      <div ref={glowRef} className="bottom-overscroll-gradient" aria-hidden="true" style={{ opacity: 0 }} />
    </>
  )
}
