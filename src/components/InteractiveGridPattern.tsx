import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'

interface InteractiveGridPatternProps {
  sectionRef: RefObject<HTMLElement | null>
  width?: number
  height?: number
  className?: string
  squaresClassName?: string
}

export function InteractiveGridPattern({
  sectionRef,
  width = 40,
  height = 40,
  className = '',
  squaresClassName = '',
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 32,
    rows: 18,
  })
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)
  const leaveTimerRef = useRef<number | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [0, 1, 1, 0])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width || window.innerWidth)
      const h = Math.floor(rect.height || 600)
      const cols = Math.max(8, Math.floor(w / width))
      const rows = Math.max(6, Math.floor(h / height))
      setDimensions((prev) => {
        if (prev.cols === cols && prev.rows === rows) return prev
        return { cols, rows }
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)

    return () => {
      window.removeEventListener('resize', updateSize)
      ro.disconnect()
    }
  }, [width, height])

  const handleMouseEnterSquare = useCallback((key: string) => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    setHoveredSquare(key)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const col = Math.floor((e.clientX - rect.left) / width)
      const row = Math.floor((e.clientY - rect.top) / height)
      if (col >= 0 && col < dimensions.cols && row >= 0 && row < dimensions.rows) {
        handleMouseEnterSquare(`${col}-${row}`)
      }
    },
    [width, height, dimensions.cols, dimensions.rows, handleMouseEnterSquare]
  )

  return (
    <motion.div
      ref={containerRef}
      className={`interactive-grid-container ${className}`}
      style={{ opacity: shouldReduceMotion ? 1 : opacity }}
      aria-hidden="true"
    >
      <svg
        className="interactive-grid-svg"
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSquare(null)}
      >
        <defs>
          <pattern
            id="interactive-grid-base"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke="currentColor"
              className="interactive-grid-line"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#interactive-grid-base)" />

        {Array.from({ length: dimensions.rows }).map((_, r) =>
          Array.from({ length: dimensions.cols }).map((_, c) => {
            const key = `${c}-${r}`
            const isHovered = hoveredSquare === key
            return (
              <rect
                key={key}
                x={c * width}
                y={r * height}
                width={width}
                height={height}
                className={`interactive-grid-square ${isHovered ? 'is-active' : ''} ${squaresClassName}`}
                onMouseEnter={() => handleMouseEnterSquare(key)}
              />
            )
          })
        )}
      </svg>
    </motion.div>
  )
}
