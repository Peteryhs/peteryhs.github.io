import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

const MAX_PULL = 72
const RESISTANCE = 0.42
const RELEASE_DELAY = 100

export function BottomBounceEffect({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pullTarget = useMotionValue(0)
  const springPull = useSpring(pullTarget, { stiffness: 420, damping: 38, mass: 0.8 })
  const translateY = useTransform(springPull, (pull) => -pull)
  const gradientOpacity = useTransform(springPull, [0, 8, MAX_PULL], [0, 0.08, 0.55])
  const gradientScaleY = useTransform(springPull, [0, MAX_PULL], [0.8, 1])

  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let distance = 0
    let maxScroll = 0
    let releaseTimer = 0
    let enabled = false

    const release = () => {
      window.clearTimeout(releaseTimer)
      distance = 0
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
      if (delta <= 0) {
        release()
        return
      }
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || window.scrollY < maxScroll - 2) return

      // Leave independently scrolling controls in charge of their own gestures.
      for (const target of event.composedPath()) {
        if (!(target instanceof HTMLElement) || target === document.body || target === root) continue
        if (target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) return
      }

      if (event.cancelable) event.preventDefault()
      // Tiny trackpad momentum tails must not keep the page suspended at the edge.
      if (delta < 1) return
      if (distance === 0) {
        const visiblePull = Math.min(MAX_PULL - 1, Math.max(0, springPull.get()))
        distance = (MAX_PULL * visiblePull) / (RESISTANCE * (MAX_PULL - visiblePull))
      }
      distance = Math.min(1600, distance + Math.min(delta, 180))
      pullTarget.set((MAX_PULL * distance * RESISTANCE) / (MAX_PULL + distance * RESISTANCE))
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
