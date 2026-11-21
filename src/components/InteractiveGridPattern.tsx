import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useState, useRef, useEffect, useCallback, useId, type RefObject } from 'react'
import {
  advanceAmbientFlight,
  birdXForLane,
  createAmbientFlight,
  flapAmbient,
  FLIGHT_STAMPS,
  PIPE_GAP,
  PIPE_WIDTH,
  type AmbientFlight,
} from './flappyBirdEngine'

interface InteractiveGridPatternProps {
  sectionRef: RefObject<HTMLElement | null>
  width?: number
  height?: number
  className?: string
  squaresClassName?: string
}

interface RightLane {
  left: number
  top: number
  width: number
  height: number
}

interface FloatingStamp {
  id: number
  text: string
  x: number
  y: number
}

type FlightMode = 'auto' | 'manual' | 'crashed'

const BEST_KEY = 'peter-flappy-milestones-best'

function readBest(): number {
  try {
    const val = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : 0
  } catch {
    return 0
  }
}

export function InteractiveGridPattern({
  sectionRef,
  width = 40,
  height = 40,
  className = '',
  squaresClassName = '',
}: InteractiveGridPatternProps) {
  const uid = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 32,
    rows: 18,
  })
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)
  const [laneHovered, setLaneHovered] = useState(false)
  const [lane, setLane] = useState<RightLane | null>(null)
  const laneRef = useRef<RightLane | null>(null)

  const [mode, setMode] = useState<FlightMode>('auto')
  const modeRef = useRef<FlightMode>('auto')
  const [flight, setFlight] = useState<AmbientFlight | null>(null)
  const flightRef = useRef<AmbientFlight | null>(null)
  const [best, setBest] = useState<number>(readBest)
  const bestRef = useRef<number>(best)
  const [floatingStamps, setFloatingStamps] = useState<FloatingStamp[]>([])
  const [inView, setInView] = useState(true)
  const crashTimerRef = useRef<number | null>(null)
  const stampIdRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [0, 1, 1, 0])

  const syncMode = useCallback((nextMode: FlightMode) => {
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  // Measure both the grid dimensions and the open right-side desktop space next to About cards
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateLayout = () => {
      const containerRect = el.getBoundingClientRect()
      const w = Math.floor(containerRect.width || window.innerWidth)
      const h = Math.floor(containerRect.height || 600)
      const cols = Math.max(8, Math.floor(w / width))
      const rows = Math.max(6, Math.floor(h / height))
      setDimensions((prev) =>
        prev.cols === cols && prev.rows === rows ? prev : { cols, rows }
      )

      const aboutSection = sectionRef.current?.querySelector('.about-longform-section')
      if (!aboutSection) {
        laneRef.current = null
        setLane(null)
        return
      }

      const contentRect = aboutSection.getBoundingClientRect()
      const rightStart = Math.ceil((contentRect.right - containerRect.left + 28) / width) * width
      const rightEnd = w - 20
      const availWidth = rightEnd - rightStart

      // Only show on desktop viewports that have real open space on the right
      if (availWidth < 210 || h < 340) {
        laneRef.current = null
        setLane(null)
        return
      }

      const laneHeight = Math.min(440, Math.max(300, Math.floor((h - 140) / height) * height))
      const laneTop = Math.round(((h - laneHeight) / 2) / height) * height

      const nextLane: RightLane = {
        left: rightStart,
        top: Math.max(height * 2, laneTop),
        width: availWidth,
        height: laneHeight,
      }

      const prev = laneRef.current
      if (
        !prev ||
        Math.abs(prev.left - nextLane.left) > 2 ||
        Math.abs(prev.top - nextLane.top) > 2 ||
        Math.abs(prev.width - nextLane.width) > 2 ||
        Math.abs(prev.height - nextLane.height) > 2
      ) {
        laneRef.current = nextLane
        setLane(nextLane)
        const fresh = createAmbientFlight(nextLane.width, nextLane.height)
        flightRef.current = fresh
        setFlight(fresh)
        syncMode('auto')
      }
    }

    updateLayout()
    window.addEventListener('resize', updateLayout, { passive: true })
    const ro = new ResizeObserver(updateLayout)
    ro.observe(el)

    return () => {
      window.removeEventListener('resize', updateLayout)
      ro.disconnect()
    }
  }, [sectionRef, width, height, syncMode])

  // Pause animation when About section scrolls off-screen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Main requestAnimationFrame loop for ambient + playable flight
  useEffect(() => {
    if (!lane || shouldReduceMotion || !inView) return
    if (mode === 'crashed') return

    let frame = 0
    let prevTime = 0

    const tick = (now: number) => {
      const dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 0
      prevTime = now

      const currentLane = laneRef.current
      const currentFlight = flightRef.current
      if (currentLane && currentFlight) {
        const isAuto = modeRef.current === 'auto'
        const next = advanceAmbientFlight(
          currentFlight,
          dt,
          currentLane.width,
          currentLane.height,
          isAuto
        )
        flightRef.current = next
        setFlight(next)

        if (next.lastEvent) {
          const id = ++stampIdRef.current
          const ev = next.lastEvent
          setFloatingStamps((prev) => [
            ...prev.slice(-3),
            {
              id,
              text: ev.stamp,
              x: currentLane.left + ev.x,
              y: currentLane.top + ev.y,
            },
          ])
          window.setTimeout(() => {
            setFloatingStamps((prev) => prev.filter((item) => item.id !== id))
          }, 2300)

          if (!isAuto && next.score > bestRef.current) {
            bestRef.current = next.score
            setBest(next.score)
            try {
              localStorage.setItem(BEST_KEY, String(next.score))
            } catch {
              /* ignore storage errors */
            }
          }
        }

        if (!isAuto && next.result === 'crashed') {
          syncMode('crashed')
          if (crashTimerRef.current !== null) window.clearTimeout(crashTimerRef.current)
          crashTimerRef.current = window.setTimeout(() => {
            const activeLane = laneRef.current
            if (activeLane && modeRef.current === 'crashed') {
              const fresh = createAmbientFlight(activeLane.width, activeLane.height)
              flightRef.current = fresh
              setFlight(fresh)
              syncMode('auto')
            }
          }, 3800)
          return
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lane, mode, shouldReduceMotion, inView, syncMode])

  useEffect(() => {
    return () => {
      if (crashTimerRef.current !== null) window.clearTimeout(crashTimerRef.current)
    }
  }, [])

  const takeControlAndFlap = useCallback(() => {
    const activeLane = laneRef.current
    if (!activeLane) return
    if (crashTimerRef.current !== null) {
      window.clearTimeout(crashTimerRef.current)
      crashTimerRef.current = null
    }

    if (modeRef.current === 'crashed') {
      const fresh = flapAmbient(createAmbientFlight(activeLane.width, activeLane.height))
      flightRef.current = fresh
      setFlight(fresh)
      syncMode('manual')
      return
    }

    if (modeRef.current === 'auto') {
      const current = flightRef.current ?? createAmbientFlight(activeLane.width, activeLane.height)
      // Seamless handoff from autopilot: reset flight score to 0 and give an immediate flap
      const handoff = flapAmbient({ ...current, score: 0, result: 'flying' })
      flightRef.current = handoff
      setFlight(handoff)
      syncMode('manual')
      return
    }

    if (flightRef.current) {
      const flapped = flapAmbient(flightRef.current)
      flightRef.current = flapped
      setFlight(flapped)
    }
  }, [syncMode])

  const returnToAuto = useCallback(() => {
    if (crashTimerRef.current !== null) {
      window.clearTimeout(crashTimerRef.current)
      crashTimerRef.current = null
    }
    const activeLane = laneRef.current
    if (!activeLane) return
    if (modeRef.current === 'crashed') {
      const fresh = createAmbientFlight(activeLane.width, activeLane.height)
      flightRef.current = fresh
      setFlight(fresh)
    }
    syncMode('auto')
  }, [syncMode])

  // Keyboard flap when player has taken control (Space / ArrowUp) and Escape to return to auto
  useEffect(() => {
    if (mode === 'auto') return
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) {
        return
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!e.repeat) takeControlAndFlap()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        returnToAuto()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, takeControlAndFlap, returnToAuto])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / width)
      const row = Math.floor(y / height)
      if (col >= 0 && col < dimensions.cols && row >= 0 && row < dimensions.rows) {
        setHoveredSquare(`${col}-${row}`)
      }
      const activeLane = laneRef.current
      if (
        activeLane &&
        x >= activeLane.left &&
        x <= activeLane.left + activeLane.width &&
        y >= activeLane.top - 24 &&
        y <= activeLane.top + activeLane.height + 24
      ) {
        setLaneHovered(true)
      } else {
        setLaneHovered(false)
      }
    },
    [width, height, dimensions.cols, dimensions.rows]
  )

  const bx = lane ? birdXForLane(lane.width) : 0
  const tilt =
    flight && mode !== 'crashed'
      ? Math.max(-22, Math.min(48, flight.velocity / 8))
      : mode === 'crashed'
        ? 55
        : 0

  return (
    <motion.div
      ref={containerRef}
      className={`interactive-grid-container ${className}`}
      style={{ opacity: shouldReduceMotion ? 1 : opacity }}
    >
      <svg
        className="interactive-grid-svg"
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredSquare(null)
          setLaneHovered(false)
        }}
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
          {lane && (
            <>
              <linearGradient id={`${uid}-lane-fade`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="black" />
                <stop offset="12%" stopColor="white" />
                <stop offset="88%" stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </linearGradient>
              <mask id={`${uid}-lane-mask`}>
                <rect
                  x={lane.left}
                  y={lane.top}
                  width={lane.width}
                  height={lane.height}
                  fill={`url(#${uid}-lane-fade)`}
                />
              </mask>
            </>
          )}
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
              />
            )
          })
        )}

        {/* Subtle Right-Side Flappy Milestones Layer (desktop open space only) */}
        {lane && flight && (
          <g className={`ambient-flappy-layer ${mode !== 'auto' ? 'is-manual' : ''}`}>
            {/* Subtle top/bottom horizon hairlines echoing the graph paper */}
            <line
              x1={lane.left + 16}
              y1={lane.top}
              x2={lane.left + lane.width - 16}
              y2={lane.top}
              className="ambient-flappy-horizon"
            />
            <line
              x1={lane.left + 16}
              y1={lane.top + lane.height}
              x2={lane.left + lane.width - 16}
              y2={lane.top + lane.height}
              className="ambient-flappy-horizon"
            />

            {/* Softly masked pipes & bird */}
            <g mask={`url(#${uid}-lane-mask)`}>
              {flight.gates.map((gate) => {
                const gx = lane.left + gate.x
                const topH = Math.max(0, gate.center - PIPE_GAP / 2)
                const bottomY = lane.top + gate.center + PIPE_GAP / 2
                const bottomH = Math.max(0, lane.height - (gate.center + PIPE_GAP / 2))
                return (
                  <g
                    key={gate.id}
                    className={`ambient-flappy-gate ${gate.passed ? 'is-passed' : ''}`}
                  >
                    {topH > 0 && (
                      <>
                        <rect
                          x={gx}
                          y={lane.top}
                          width={PIPE_WIDTH}
                          height={topH}
                          className="ambient-flappy-pipe"
                        />
                        <rect
                          x={gx - 3}
                          y={lane.top + topH - 8}
                          width={PIPE_WIDTH + 6}
                          height={8}
                          rx={1.5}
                          className="ambient-flappy-pipe-cap"
                        />
                      </>
                    )}
                    {bottomH > 0 && (
                      <>
                        <rect
                          x={gx}
                          y={bottomY}
                          width={PIPE_WIDTH}
                          height={bottomH}
                          className="ambient-flappy-pipe"
                        />
                        <rect
                          x={gx - 3}
                          y={bottomY}
                          width={PIPE_WIDTH + 6}
                          height={8}
                          rx={1.5}
                          className="ambient-flappy-pipe-cap"
                        />
                      </>
                    )}
                    {!gate.passed && (
                      <rect
                        x={gx + PIPE_WIDTH / 2 - 4}
                        y={lane.top + gate.center - 4}
                        width={8}
                        height={8}
                        rx={1.5}
                        transform={`rotate(45 ${gx + PIPE_WIDTH / 2} ${lane.top + gate.center})`}
                        className="ambient-flappy-token"
                      />
                    )}
                  </g>
                )
              })}

              {/* Minimal geometric bird matching the original snake's ochre palette */}
              <g
                transform={`translate(${lane.left + bx} ${lane.top + flight.y}) rotate(${tilt})`}
                className={`ambient-flappy-bird ${mode === 'crashed' ? 'is-flashing' : ''}`}
              >
                {/* Tail */}
                <polygon points="-13,1 -18,-3 -18,4" className="ambient-flappy-bird-wing" />
                {/* Body */}
                <rect x="-12" y="-8" width="21" height="16" rx="6" className="ambient-flappy-bird-body" />
                {/* Wing */}
                <rect x="-7" y="-1" width="10" height="6" rx="3" className="ambient-flappy-bird-wing" />
                {/* Beak */}
                <polygon points="9,-2 15,1 9,4" className="ambient-flappy-bird-beak" />
                {/* Eye */}
                <circle cx="4" cy="-3" r="1.7" className="ambient-flappy-bird-eye" />
              </g>
            </g>

            {/* Transparent click target over the right-side lane to take over & flap */}
            <rect
              x={lane.left}
              y={lane.top}
              width={lane.width}
              height={lane.height}
              fill="transparent"
              className="ambient-flappy-hitbox"
              onClick={(e) => {
                e.stopPropagation()
                takeControlAndFlap()
              }}
            />
          </g>
        )}

        {/* Floating 8-Bit Achievement Milestone Text Layer (same aesthetic as original snake) */}
        {floatingStamps.map((msg) => (
          <text
            key={msg.id}
            x={msg.x}
            y={msg.y}
            textAnchor="middle"
            className="flappy-milestone-text"
          >
            {msg.text}
          </text>
        ))}
      </svg>

      {/* Whisper-quiet inline micro-status anchored in the right-side lane (no cards, no borders) */}
      {lane && (
        <div
          className={`ambient-flappy-hud ${laneHovered || mode !== 'auto' ? 'is-visible' : ''}`}
          style={{
            left: `${lane.left + 16}px`,
            top: `${lane.top + lane.height + 10}px`,
            width: `${lane.width - 32}px`,
          }}
        >
          {mode === 'auto' ? (
            <button
              type="button"
              className="ambient-flappy-hud-btn"
              onClick={takeControlAndFlap}
              aria-label="Play Flappy milestones in the background"
            >
              click to fly · {FLIGHT_STAMPS.length} milestones
            </button>
          ) : mode === 'crashed' ? (
            <>
              <button
                type="button"
                className="ambient-flappy-hud-btn"
                onClick={takeControlAndFlap}
              >
                {flight?.score ?? 0}/{FLIGHT_STAMPS.length} · click to retry
              </button>
              <button
                type="button"
                className="ambient-flappy-hud-btn is-muted"
                onClick={returnToAuto}
              >
                auto
              </button>
            </>
          ) : (
            <>
              <span className="ambient-flappy-hud-score">
                {String(flight?.score ?? 0).padStart(2, '0')} · best {String(best).padStart(2, '0')}
              </span>
              <button
                type="button"
                className="ambient-flappy-hud-btn is-muted"
                onClick={returnToAuto}
              >
                auto (esc)
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
