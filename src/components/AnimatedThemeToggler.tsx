import { useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

export function AnimatedThemeToggler({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('peter_theme_preference')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const buttonRef = useRef<HTMLButtonElement>(null)

  // Sync initial class on mount
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }, [isDark])

  const toggleTheme = useCallback(async () => {
    const nextIsDark = !isDark
    const nextTheme = nextIsDark ? 'dark' : 'light'

    // If View Transitions are not supported or reduced motion is requested
    const startViewTransition = (document as unknown as { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition

    if (
      !startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsDark(nextIsDark)
      localStorage.setItem('peter_theme_preference', nextTheme)
      const root = document.documentElement
      root.classList.toggle('dark', nextIsDark)
      root.classList.toggle('light', !nextIsDark)
      return
    }

    const btn = buttonRef.current
    let x = window.innerWidth - 30
    let y = 30
    if (btn) {
      const rect = btn.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
    ) + 30

    const transition = startViewTransition.call(document, () => {
      flushSync(() => {
        setIsDark(nextIsDark)
        localStorage.setItem('peter_theme_preference', nextTheme)
        const root = document.documentElement
        root.classList.toggle('dark', nextIsDark)
        root.classList.toggle('light', !nextIsDark)
      })
    })

    try {
      await transition.ready
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: 'ease-in-out',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)',
        }
      )
      await anim.finished
    } catch {
      // Ignore transition animation errors if aborted
    }
  }, [isDark])

  return (
    <div className={`theme-toggle-floating-wrap ${className}`}>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.svg
              key="moon-icon"
              className="theme-toggle-svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun-icon"
              className="theme-toggle-svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: 45, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -45, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
