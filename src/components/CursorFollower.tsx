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
  title: string
  shortTitle?: string
  eyebrow?: string
  preview?: string
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

    // Variants for seamless continuous shape morphing (Dot -> Line -> Box)
    // Box spawns centered with the cursor's vertical midpoint (y: -10) rather than at the bottom (y: 14)
    const morphVariants: Variants = {
      default: {
        width: 14,
        height: 14,
        borderRadius: '999px',
        x: -7,
        y: -7,
        borderWidth: 0,
        backgroundColor: 'var(--ink)',
        boxShadow: '0 0 0 1.5px var(--paper), 0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      text: {
        width: 2.5,
        height: 28,
        borderRadius: '2px',
        x: -1.25,
        y: -14,
        borderWidth: 0,
        backgroundColor: 'var(--ink)',
        boxShadow: '0 0 0 1px var(--paper), 0 2px 8px rgba(0, 0, 0, 0.16)',
      },
      interactive: {
        width: 'auto',
        height: 'auto',
        borderRadius: '14px',
        x: 14,
        y: -10, // Vertically center-aligned with the cursor/caret line midpoint
        borderWidth: 1,
        backgroundColor: 'var(--cursor-bg)',
        boxShadow: 'var(--cursor-shadow)',
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
            {/* Single continuous morphing container */}
            <motion.div
              layout
              className={`cursor-morph-box cursor-state-${cursorState}`}
              animate={cursorState}
              variants={morphVariants}
              transition={{
                // 25% softer, calmer spring physics for gentle shrinking & morphing
                layout: { type: 'spring', damping: 30, stiffness: 330, mass: 0.28 },
                duration: shouldReduceMotion ? 0 : 0.26,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                rotate:
                  !shouldReduceMotion && cursorState === 'interactive' ? cardTilt : 0,
              }}
            >
              <AnimatePresence mode="wait">
                {cursorState === 'interactive' && displayedInfo && (
                  <motion.div
                    key={displayedInfo.title}
                    className="cursor-card-content"
                    initial={{
                      opacity: 0,
                      filter: shouldReduceMotion ? 'none' : 'blur(6px)',
                    }}
                    animate={{
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                    exit={{
                      opacity: 0,
                      filter: shouldReduceMotion ? 'none' : 'blur(4px)',
                      transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] }, // 25% gentler exit fade
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.22,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="cursor-card-header">
                      <span className="cursor-accent-pill">
                        {displayedInfo.accent || '✦'}
                      </span>
                      <span className="cursor-title">{displayedInfo.title}</span>
                      {displayedInfo.badge && (
                        <span className="cursor-badge">{displayedInfo.badge}</span>
                      )}
                    </div>

                    {displayedInfo.preview && (
                      <p className="cursor-preview">{displayedInfo.preview}</p>
                    )}

                    <div className="cursor-footer">
                      <span className="cursor-action">
                        Click to toggle chapter <span>↓</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </div>
    )
  },
)
