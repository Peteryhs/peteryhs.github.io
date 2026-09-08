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

function checkIsDark(): boolean {
  if (typeof document === 'undefined') return false
  if (document.documentElement.classList.contains('dark')) return true
  if (document.documentElement.classList.contains('light')) return false
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('peter_theme_preference') : null
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
    : false
}

export const CursorFollower = forwardRef<CursorFollowerRef, CursorFollowerProps>(
  function CursorFollower({ activeInfo }, ref) {
    const shouldReduceMotion = useReducedMotion()
    const [isTouch, setIsTouch] = useState<boolean>(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
    })
    const [hasPosition, setHasPosition] = useState(false)
    const [isTextHover, setIsTextHover] = useState(false)

    // Debounced active info for seamless transitions between adjacent Level 2 keywords
    const [displayedInfo, setDisplayedInfo] = useState<CursorInfo | null>(activeInfo)
    const leaveTimerRef = useRef<number | null>(null)

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

    // Reactive theme detection synced with theme toggler and class mutations
    const [isDark, setIsDark] = useState<boolean>(checkIsDark)

    // Retain active content during exit animation so the actual tooltip card morphs back
    const currentText = displayedInfo?.text || displayedInfo?.preview || displayedInfo?.title || ''
    const [savedContent, setSavedContent] = useState(currentText)

    // Instant position sync handler
    useImperativeHandle(ref, () => ({
      syncPosition: (x: number, y: number) => {
        if (isTouch) return
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

    useEffect(() => {
      if (currentText) {
        setSavedContent(currentText)
      }
    }, [currentText])

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

    // Synchronize isDark state immediately on theme class mutations or system change
    useEffect(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return

      const updateDarkState = () => {
        setIsDark(checkIsDark())
      }

      updateDarkState()

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            updateDarkState()
          }
        }
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })

      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      const handler = () => updateDarkState()
      if (mql?.addEventListener) {
        mql.addEventListener('change', handler)
      } else if ((mql as any)?.addListener) {
        (mql as any).addListener(handler)
      }

      return () => {
        observer.disconnect()
        if (mql?.removeEventListener) {
          mql.removeEventListener('change', handler)
        } else if ((mql as any)?.removeListener) {
          (mql as any).removeListener(handler)
        }
      }
    }, [])

    if (isTouch) {
      return null
    }

    // Explicit RGBA color definitions for mathematical frame-by-frame blending
    const inkColor = isDark ? 'rgba(242, 238, 232, 1)' : 'rgba(34, 34, 34, 1)'
    const cardBg = isDark ? 'rgba(22, 22, 24, 0.96)' : 'rgba(251, 250, 247, 0.98)'
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(34, 34, 34, 0.12)'
    const transparentBorder = isDark ? 'rgba(242, 238, 232, 0)' : 'rgba(34, 34, 34, 0)'

    const cardShadow = isDark
      ? '0 18px 40px -6px rgba(0, 0, 0, 0.6), 0 8px 20px -2px rgba(0, 0, 0, 0.45)'
      : '0 16px 36px -6px rgba(0, 0, 0, 0.12), 0 6px 16px -2px rgba(0, 0, 0, 0.06)'

    // Active cursor state
    const cursorState = displayedInfo
      ? 'interactive'
      : isTextHover
        ? 'text'
        : 'default'

    const textToDisplay = currentText || savedContent

    // Variants for seamless continuous shape morphing (Dot -> Line -> Box)
    const morphVariants: Variants = {
      default: {
        width: 12,
        height: 12,
        borderRadius: 999,
        x: -6,
        y: -6,
        borderWidth: 0,
        borderColor: transparentBorder,
        backgroundColor: inkColor,
        boxShadow: isDark
          ? '0 1px 4px rgba(0, 0, 0, 0.6)'
          : '0 1px 3px rgba(0, 0, 0, 0.25)',
      },
      text: {
        width: 2.5,
        height: 26,
        borderRadius: 2,
        x: -1.25,
        y: -13,
        borderWidth: 0,
        borderColor: transparentBorder,
        backgroundColor: inkColor,
        boxShadow: isDark
          ? '0 1px 3px rgba(0, 0, 0, 0.5)'
          : '0 1px 2px rgba(0, 0, 0, 0.15)',
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
