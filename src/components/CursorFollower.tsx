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
        // 90ms grace buffer so adjacent keyword moves transition directly without collapsing
        leaveTimerRef.current = window.setTimeout(() => {
          setDisplayedInfo(null)
        }, 90)
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

    // Ultra-responsive, critically-damped spring tracking (high stiffness, low mass, zero overshoot)
    const springConfig = { damping: 38, stiffness: 950, mass: 0.1 }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)

    // Subtle card velocity tilt
    const xVelocity = useMotionValue(0)
    const smoothVx = useSpring(xVelocity, { damping: 28, stiffness: 450 })
    const cardTilt = useTransform(smoothVx, [-800, 800], [-2.5, 2.5])

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

    // Synchronous initial theme detection with reactive updates for seamless frame-by-frame RGBA interpolation
    const [isDark, setIsDark] = useState(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }, [])

    // Explicit RGBA color definitions for mathematical frame-by-frame blending
    const inkColor = isDark ? 'rgba(242, 238, 232, 1)' : 'rgba(34, 34, 34, 1)'
    const cardBg = isDark ? 'rgba(22, 22, 24, 0.96)' : 'rgba(251, 250, 247, 0.98)'
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(34, 34, 34, 0.12)'
    const transparentBorder = isDark ? 'rgba(242, 238, 232, 0)' : 'rgba(34, 34, 34, 0)'

    const cardShadow = isDark
      ? '0 18px 40px -6px rgba(0, 0, 0, 0.5), 0 8px 20px -2px rgba(0, 0, 0, 0.35)'
      : '0 16px 36px -6px rgba(0, 0, 0, 0.12), 0 6px 16px -2px rgba(0, 0, 0, 0.06)'
    const dotShadow = isDark
      ? '0 0 0 1.5px rgba(22, 22, 24, 1), 0 2px 8px rgba(0, 0, 0, 0.4)'
      : '0 0 0 1.5px rgba(251, 250, 247, 1), 0 2px 8px rgba(0, 0, 0, 0.2)'
    const lineShadow = isDark
      ? '0 0 0 1px rgba(22, 22, 24, 1), 0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 0 0 1px rgba(251, 250, 247, 1), 0 2px 8px rgba(0, 0, 0, 0.16)'

    // Active cursor state
    const cursorState = displayedInfo
      ? 'interactive'
      : isTextHover
        ? 'text'
        : 'default'

    // Retain active content during exit animation so the actual tooltip card morphs back
    const currentText = displayedInfo?.text || displayedInfo?.preview || displayedInfo?.title || ''
    const [savedContent, setSavedContent] = useState(currentText)

    useEffect(() => {
      if (currentText) {
        setSavedContent(currentText)
      }
    }, [currentText])

    const textToDisplay = currentText || savedContent

    // Variants for seamless continuous shape morphing (Dot -> Line -> Box)
    // Vertically aligned with y: -14 across both text caret and card for zero vertical jumping
    const morphVariants: Variants = {
      default: {
        width: 14,
        height: 14,
        borderRadius: 999,
        x: -7,
        y: -7,
        borderWidth: 0,
        borderColor: transparentBorder,
        backgroundColor: inkColor,
        boxShadow: dotShadow,
      },
      text: {
        width: 2.5,
        height: 28,
        borderRadius: 2,
        x: -1.25,
        y: -14,
        borderWidth: 0,
        borderColor: transparentBorder,
        backgroundColor: inkColor,
        boxShadow: lineShadow,
      },
      interactive: {
        width: 'auto',
        height: 'auto',
        borderRadius: 13,
        x: 16,
        y: -18,
        borderWidth: 1,
        borderColor: cardBorder,
        backgroundColor: cardBg,
        boxShadow: cardShadow,
      },
    }

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
            {/* Direct continuous morphing container */}
            <motion.div
              className={`cursor-morph-box cursor-state-${cursorState}`}
              animate={cursorState}
              variants={morphVariants}
              transition={{
                // 25% slower morphing duration for luxurious, silky smooth expansion & contraction
                duration: shouldReduceMotion ? 0 : cursorState === 'interactive' ? 0.28 : 0.23,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                rotate:
                  !shouldReduceMotion && cursorState === 'interactive' ? cardTilt : 0,
              }}
            >
              <div
                className="cursor-card-content"
                style={{
                  opacity: cursorState === 'interactive' ? 1 : 0,
                  transition: `opacity ${shouldReduceMotion ? 0 : cursorState === 'interactive' ? 0.22 : 0.12}s ease-out`,
                }}
              >
                <p className="cursor-text">{textToDisplay}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    )
  },
)
