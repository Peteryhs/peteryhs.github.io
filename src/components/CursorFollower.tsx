import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react'

export interface CursorInfo {
  text?: string
  preview?: string
  title?: string
  shortTitle?: string
  eyebrow?: string
  accent?: string
  badge?: string
}

export interface CursorFollowerRef {
  syncPosition: (x: number, y: number) => void
}

interface CursorFollowerProps {
  activeInfo: CursorInfo | null
}

export const CursorFollower = forwardRef<CursorFollowerRef, CursorFollowerProps>(
  function CursorFollower({ activeInfo }, ref) {
    const shouldReduceMotion = useReducedMotion()
    const [isTouch, setIsTouch] = useState(false)
    const [hasPosition, setHasPosition] = useState(false)
    const [isTextHover, setIsTextHover] = useState(false)

    // Debounced active info for seamless transitions between adjacent Level 2 keywords
    const [displayedInfo, setDisplayedInfo] = useState<CursorInfo | null>(activeInfo)
    const leaveTimerRef = useRef<number | null>(null)

    useEffect(() => {
      if (activeInfo) {
        if (leaveTimerRef.current) {
          window.clearTimeout(leaveTimerRef.current)
          leaveTimerRef.current = null
        }
        setDisplayedInfo(activeInfo)
      } else {
        // 140ms grace buffer so adjacent keyword moves transition directly without collapsing
        leaveTimerRef.current = window.setTimeout(() => {
          setDisplayedInfo(null)
        }, 140)
      }

      return () => {
        if (leaveTimerRef.current) {
          window.clearTimeout(leaveTimerRef.current)
        }
      }
    }, [activeInfo])

    // Raw mouse coordinates
    const mouseX = useMotionValue(-100)
    const mouseY = useMotionValue(-100)

    // Lightweight, responsive spring tracking
    const springConfig = { damping: 34, stiffness: 850, mass: 0.12 }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)

    // Subtle card velocity tilt
    const xVelocity = useMotionValue(0)
    const smoothVx = useSpring(xVelocity, { damping: 24, stiffness: 400 })
    const cardTilt = useTransform(smoothVx, [-800, 800], [-3, 3])

    // Instant position sync handler
    useImperativeHandle(ref, () => ({
      syncPosition: (x: number, y: number) => {
        if (!hasPosition) {
          mouseX.jump ? mouseX.jump(x) : mouseX.set(x)
          mouseY.jump ? mouseY.jump(y) : mouseY.set(y)
          smoothX.jump ? smoothX.jump(x) : smoothX.set(x)
          smoothY.jump ? smoothY.jump(y) : smoothY.set(y)
          setHasPosition(true)
        } else {
          mouseX.set(x)
          mouseY.set(y)
        }
      },
    }))

    useEffect(() => {
      // Touch/mobile device check
      if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
        setIsTouch(true)
        return
      }

      let lastX = 0
      let lastTime = performance.now()
      let initialized = false

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now()
        const dt = Math.max(1, now - lastTime)
        const dx = e.clientX - lastX

        if (!initialized) {
          mouseX.jump ? mouseX.jump(e.clientX) : mouseX.set(e.clientX)
          mouseY.jump ? mouseY.jump(e.clientY) : mouseY.set(e.clientY)
          smoothX.jump ? smoothX.jump(e.clientX) : smoothX.set(e.clientX)
          smoothY.jump ? smoothY.jump(e.clientY) : smoothY.set(e.clientY)
          initialized = true
          setHasPosition(true)
        } else {
          mouseX.set(e.clientX)
          mouseY.set(e.clientY)
          xVelocity.set((dx / dt) * 1000)
        }

        lastX = e.clientX
        lastTime = now
      }

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (!target) return

        const isInteractive = Boolean(
          target.closest('button') ||
            target.closest('a') ||
            target.closest('.topic-word') ||
            target.closest('.expanded-close-btn') ||
            target.closest('[role="button"]') ||
            target.closest('input'),
        )

        if (isInteractive) {
          setIsTextHover(false)
          return
        }

        const isTextElement = Boolean(
          target.closest('p') ||
            target.closest('h1') ||
            target.closest('h2') ||
            target.closest('h3') ||
            target.closest('h4') ||
            target.closest('article') ||
            target.closest('.intro p') ||
            target.closest('.longform-section p'),
        )

        setIsTextHover(isTextElement)
      }

      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseover', handleMouseOver, { passive: true })

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseover', handleMouseOver)
      }
    }, [mouseX, mouseY, smoothX, smoothY, xVelocity])

    if (isTouch) return null

    // Determine current cursor state (using debounced displayedInfo)
    const cursorState = displayedInfo
      ? 'interactive'
      : isTextHover
        ? 'text'
        : 'default'

    // Variants for dedicated cursor element (Dot -> Text Line -> Target Dot)
    const cursorVariants: Variants = {
      default: {
        width: 14,
        height: 14,
        borderRadius: '999px',
        x: -7,
        y: -7,
        opacity: 1,
        backgroundColor: 'var(--ink)',
        boxShadow: '0 0 0 1.5px var(--paper), 0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      text: {
        width: 2.5,
        height: 26,
        borderRadius: '2px',
        x: -1.25,
        y: -13,
        opacity: 1,
        backgroundColor: 'var(--ink)',
        boxShadow: '0 0 0 1px var(--paper), 0 2px 8px rgba(0, 0, 0, 0.16)',
      },
      interactive: {
        width: 8,
        height: 8,
        borderRadius: '999px',
        x: -4,
        y: -4,
        opacity: 0.85,
        backgroundColor: 'var(--ink)',
        boxShadow: '0 0 0 1.5px var(--paper), 0 0 0 3px rgba(0, 0, 0, 0.08)',
      },
    }

    const contentText = displayedInfo?.text || displayedInfo?.preview || displayedInfo?.title || ''

    return (
      <div className="cursor-follower-layer" aria-hidden="true">
        {hasPosition && (
          <motion.div
            className="cursor-follower-wrapper"
            style={{
              x: smoothX,
              y: smoothY,
            }}
          >
            {/* Dedicated cursor element: morphs cleanly between dot and text caret */}
            <motion.div
              layout
              className={`cursor-pointer-dot cursor-state-${cursorState}`}
              animate={cursorState}
              variants={cursorVariants}
              transition={{
                layout: { type: 'spring', damping: 28, stiffness: 380, mass: 0.2 },
                duration: shouldReduceMotion ? 0 : 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
            />

            {/* Floating tooltip card: cleanly fades & scales in/out beside cursor without squishing */}
            <AnimatePresence>
              {displayedInfo && contentText && (
                <motion.div
                  key={contentText}
                  className="cursor-tooltip-card"
                  initial={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 0.94,
                    x: 14,
                    y: -12,
                    filter: shouldReduceMotion ? 'none' : 'blur(4px)',
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 14,
                    y: -12,
                    filter: 'blur(0px)',
                  }}
                  exit={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 0.94,
                    x: 14,
                    y: -10,
                    filter: shouldReduceMotion ? 'none' : 'blur(3px)',
                    transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    rotate: !shouldReduceMotion ? cardTilt : 0,
                  }}
                >
                  <p className="cursor-text">{contentText}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    )
  },
)
