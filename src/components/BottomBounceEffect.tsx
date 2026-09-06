import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

interface BottomBounceEffectProps {
  children: ReactNode
}

const RETRACT_DELAY_MS = 500 // 0.5s sweet spot

export function BottomBounceEffect({ children }: BottomBounceEffectProps) {
  const pullTarget = useMotionValue(0)
  const springPull = useSpring(pullTarget, {
    stiffness: 280,
    damping: 24,
    mass: 0.65,
  })

  // Dynamic transforms
  const translateY = useTransform(springPull, (v) => -v)
  const gradientOpacity = useTransform(springPull, [0, 4, 65], [0, 0.4, 1])
  const gradientScaleY = useTransform(springPull, [0, 80], [0.75, 1.25])

  const wheelTimeoutRef = useRef<number | null>(null)
  const currentAccumulatedPull = useRef(0)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const isAtBottom = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      return scrollTop + clientHeight >= scrollHeight - 8
    }

    const handleWheel = (e: WheelEvent) => {
      // User scrolling down past the bottom of the page
      if (e.deltaY > 0 && isAtBottom()) {
        e.preventDefault()

        const maxPull = 95
        const current = currentAccumulatedPull.current
        const resistance = Math.max(0.08, (1 - current / maxPull) * 0.28)
        currentAccumulatedPull.current = Math.min(maxPull, current + e.deltaY * resistance)
        pullTarget.set(currentAccumulatedPull.current)

        if (wheelTimeoutRef.current) {
          window.clearTimeout(wheelTimeoutRef.current)
        }
        wheelTimeoutRef.current = window.setTimeout(() => {
          currentAccumulatedPull.current = 0
          pullTarget.set(0)
        }, RETRACT_DELAY_MS)
      } else if (e.deltaY < -20 && currentAccumulatedPull.current > 0) {
        // Strong intentional upward scroll: retract immediately
        if (wheelTimeoutRef.current) {
          window.clearTimeout(wheelTimeoutRef.current)
        }
        currentAccumulatedPull.current = 0
        pullTarget.set(0)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current)
      }
      if (isAtBottom() && e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY
      } else {
        touchStartY.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current !== null && isAtBottom() && e.touches.length === 1) {
        const delta = touchStartY.current - e.touches[0].clientY
        if (delta > 0) {
          const maxPull = 100
          const resistance = Math.pow(delta, 0.8) * 0.65
          const pull = Math.min(maxPull, resistance)
          currentAccumulatedPull.current = pull
          pullTarget.set(pull)
        }
      }
    }

    const handleTouchEnd = () => {
      touchStartY.current = null
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current)
      }
      wheelTimeoutRef.current = window.setTimeout(() => {
        currentAccumulatedPull.current = 0
        pullTarget.set(0)
      }, RETRACT_DELAY_MS)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current)
      }
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [pullTarget])

  return (
    <>
      <motion.div
        className="bottom-bounce-wrapper"
        style={{
          y: translateY,
          willChange: 'transform',
        }}
      >
        {children}
      </motion.div>

      {/* Radiating gradient pinned to the bottom of the viewport */}
      <motion.div
        className="bottom-overscroll-gradient"
        aria-hidden="true"
        style={{
          opacity: gradientOpacity,
          scaleY: gradientScaleY,
        }}
      />
    </>
  )
}
