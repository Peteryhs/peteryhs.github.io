import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

const PULL_SCALE = 72
const RESISTANCE = 0.42
const RELEASE_DELAY = 70
const MAX_COAST = 180
const GESTURE_GAP = 160

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
    let maxScroll = 0
    let releaseTimer = 0
    let enabled = false
    let lastDrivenAt = 0
    let lastWheelAt = -Infinity
    let peakForce = 0
    let returning = false

    const release = () => {
      window.clearTimeout(releaseTimer)
      distance = 0
      returning = true
      pullTarget.set(0)
    }
    const updateAvailability = () => {
      enabled = pointer.matches && !motionPreference.matches
      root.classList.toggle('has-custom-overscroll', enabled)
      if (!enabled) {
        release()
        springPull.jump(0)
      }
    }
    const measure = () => {
      maxScroll = Math.max(0, root.scrollHeight - root.clientHeight)
      if (window.scrollY < maxScroll - 2) release()
    }
    const onScroll = () => {
      if (window.scrollY < maxScroll - 2 && distance > 0) release()
    }
    const onWheel = (event: WheelEvent) => {
      if (!enabled || event.defaultPrevented || event.ctrlKey) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1
      const delta = event.deltaY * unit
      if (!Number.isFinite(delta)) return
      if (delta <= 0) {
        release()
        lastWheelAt = -Infinity
        return
      }
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || window.scrollY < maxScroll - 2) return

      // Leave independently scrolling controls in charge of their own gestures.
      for (const target of event.composedPath()) {
        if (!(target instanceof HTMLElement) || target === document.body || target === root) continue
        if (target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) return
      }

      if (event.cancelable) event.preventDefault()
      const now = performance.now()
      if (now - lastWheelAt >= GESTURE_GAP) {
        returning = false
        peakForce = 0
      }
      lastWheelAt = now
      // Ignore decaying momentum once the return begins.
      if (returning) return
      if (delta < 1) return
      if (distance === 0) {
        lastDrivenAt = now
        const visiblePull = Math.max(0, springPull.get())
        distance = (PULL_SCALE / RESISTANCE) * Math.expm1(visiblePull / PULL_SCALE)
      }
      peakForce = Math.max(peakForce, delta)
      // Maintained or increasing force can pull indefinitely; fading force cannot
      // keep extending the return timer for the whole trackpad momentum tail.
      if (delta >= 4 && delta >= peakForce * 0.9) lastDrivenAt = now
      if (now - lastDrivenAt >= MAX_COAST) {
        release()
        return
      }
      distance += delta
      // Logarithmic resistance keeps growing with force, without a stretch ceiling.
      pullTarget.set(PULL_SCALE * Math.log1p(distance * RESISTANCE / PULL_SCALE))
      window.clearTimeout(releaseTimer)
      releaseTimer = window.setTimeout(release, Math.min(RELEASE_DELAY, MAX_COAST - (now - lastDrivenAt)))
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
