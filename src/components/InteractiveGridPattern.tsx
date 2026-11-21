import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import {
  advanceAmbientFlight,
  createAmbientFlight,
  flapAmbient,
  FLIGHT_STAMPS,
  type AmbientFlight,
} from './flappyBirdEngine'
import {
  advanceLifeBoard,
  buildMorphParticles,
  createLifeBoard,
  getThemePalette,
  MORPH_DURATION_MS,
  renderFlappyCourse,
  renderLifeState,
  renderMorphState,
  seedLifeAtPixel,
  seedLifeFromFlight,
  type LifeBoard,
  type MorphParticle,
  type StageMode,
} from './lifeFlappyEngine'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 32,
    rows: 18,
  })
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)
  const [laneHovered, setLaneHovered] = useState(false)
  const [lane, setLane] = useState<RightLane | null>(null)
  const laneRef = useRef<RightLane | null>(null)

  const [mode, setMode] = useState<StageMode>('life')
  const modeRef = useRef<StageMode>('life')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(readBest)
  const bestRef = useRef<number>(best)
  const [floatingStamps, setFloatingStamps] = useState<FloatingStamp[]>([])
  const [inView, setInView] = useState(true)

  const boardRef = useRef<LifeBoard | null>(null)
  const flightRef = useRef<AmbientFlight | null>(null)
  const morphRef = useRef<{ particles: MorphParticle[]; startTime: number } | null>(null)
  const crashTimerRef = useRef<number | null>(null)
  const stampIdRef = useRef(0)
  const lastSeedRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [0, 1, 1, 0])

  const syncMode = useCallback((nextMode: StageMode) => {
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  const clearCrashTimer = useCallback(() => {
    if (crashTimerRef.current !== null) {
      window.clearTimeout(crashTimerRef.current)
      crashTimerRef.current = null
    }
  }, [])

  // Measure both the 40px graph grid and the open right-side desktop space next to About cards
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

      // Desktop open-space only; hide cleanly on narrow/mobile viewports
      if (availWidth < 210 || h < 340) {
        laneRef.current = null
        setLane(null)
        return
      }

      const laneHeight = Math.min(460, Math.max(300, Math.floor((h - 120) / height) * height))
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
        clearCrashTimer()
        laneRef.current = nextLane
        setLane(nextLane)
        boardRef.current = createLifeBoard(nextLane.width, nextLane.height)
        flightRef.current = createAmbientFlight(nextLane.width, nextLane.height)
        morphRef.current = null
        setScore(0)
        syncMode('life')
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
  }, [sectionRef, width, height, syncMode, clearCrashTimer])

  // Pause simulation when About section scrolls off-screen
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

  useEffect(() => clearCrashTimer, [clearCrashTimer])

  const dissolveBackToLife = useCallback(() => {
    clearCrashTimer()
    const currentLane = laneRef.current
    const board = boardRef.current
    const flight = flightRef.current
    if (currentLane && board && flight) {
      seedLifeFromFlight(board, flight, currentLane.width, currentLane.height)
    }
    morphRef.current = null
    setScore(0)
    syncMode('life')
  }, [clearCrashTimer, syncMode])

  const startMorphOrFlap = useCallback(() => {
    const currentLane = laneRef.current
    const board = boardRef.current
    if (!currentLane || !board) return

    clearCrashTimer()
    const cur = modeRef.current

    if (cur === 'life') {
      const freshFlight = createAmbientFlight(currentLane.width, currentLane.height)
      flightRef.current = freshFlight
      setScore(0)
      if (shouldReduceMotion) {
        flightRef.current = flapAmbient(freshFlight)
        syncMode('playing')
        return
      }
      morphRef.current = {
        particles: buildMorphParticles(board, freshFlight, currentLane.width, currentLane.height),
        startTime: performance.now(),
      }
      syncMode('morphing')
      return
    }

    if (cur === 'morphing') {
      // Allow eager player to jump straight into flight
      if (flightRef.current) {
        flightRef.current = flapAmbient(flightRef.current)
      }
      morphRef.current = null
      syncMode('playing')
      return
    }

    if (cur === 'crashed') {
      const freshFlight = flapAmbient(createAmbientFlight(currentLane.width, currentLane.height))
      flightRef.current = freshFlight
      board.trailDots = []
      setScore(0)
      syncMode('playing')
      return
    }

    // Playing: flap!
    if (flightRef.current) {
      flightRef.current = flapAmbient(flightRef.current)
    }
  }, [clearCrashTimer, shouldReduceMotion, syncMode])

  // Main 60fps canvas animation loop (zero React state updates per frame)
  useEffect(() => {
    const canvas = canvasRef.current
    const currentLane = laneRef.current
    if (!canvas || !currentLane || !inView) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(currentLane.width * dpr)
    canvas.height = Math.round(currentLane.height * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If reduced motion and in ambient life mode, render one calm static frame
    if (shouldReduceMotion && modeRef.current === 'life') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (boardRef.current) {
        renderLifeState(ctx, boardRef.current, getThemePalette())
      }
      return
    }

    let frame = 0
    let prevTime = 0

    const tick = (now: number) => {
      const dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 0
      prevTime = now

      const activeLane = laneRef.current
      const board = boardRef.current
      if (activeLane && board) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const pal = getThemePalette()
        const curMode = modeRef.current

        if (curMode === 'life') {
          advanceLifeBoard(board, dt)
          renderLifeState(ctx, board, pal)
        } else if (curMode === 'morphing') {
          const morph = morphRef.current
          if (!morph) {
            syncMode('playing')
          } else {
            const progress = Math.min(1, (now - morph.startTime) / MORPH_DURATION_MS)
            renderMorphState(ctx, morph.particles, progress, activeLane.width, activeLane.height, pal)
            if (progress >= 1) {
              morphRef.current = null
              if (flightRef.current) {
                flightRef.current = flapAmbient(flightRef.current)
              }
              syncMode('playing')
            }
          }
        } else if (curMode === 'playing' || curMode === 'crashed') {
          const currentFlight = flightRef.current
          if (currentFlight) {
            if (curMode === 'playing') {
              const next = advanceAmbientFlight(
                currentFlight,
                dt,
                activeLane.width,
                activeLane.height,
                false
              )
              flightRef.current = next

              if (next.score !== currentFlight.score) {
                setScore(next.score)
                if (next.score > bestRef.current) {
                  bestRef.current = next.score
                  setBest(next.score)
                  try {
                    localStorage.setItem(BEST_KEY, String(next.score))
                  } catch {
                    // ignore storage errors
                  }
                }
              }

              if (next.lastEvent) {
                const id = ++stampIdRef.current
                const ev = next.lastEvent
                setFloatingStamps((prev) => [
                  ...prev.slice(-3),
                  {
                    id,
                    text: ev.stamp,
                    x: activeLane.left + ev.x,
                    y: activeLane.top + ev.y,
                  },
                ])
                window.setTimeout(() => {
                  setFloatingStamps((prev) => prev.filter((item) => item.id !== id))
                }, 2350)
              }

              if (next.result === 'crashed') {
                syncMode('crashed')
                clearCrashTimer()
                crashTimerRef.current = window.setTimeout(() => {
                  dissolveBackToLife()
                }, 1800)
              }
            }

            renderFlappyCourse(
              ctx,
              board,
              flightRef.current ?? currentFlight,
              pal,
              now,
              modeRef.current === 'crashed',
              dt
            )
          }
        }
      }

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [lane, inView, mode, shouldReduceMotion, syncMode, clearCrashTimer, dissolveBackToLife])

  // Keyboard controls while actively flying or crashed
  useEffect(() => {
    if (mode === 'life') return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        dissolveBackToLife()
        return
      }
      if (target?.closest('button, a, [role="button"]')) {
        return
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!e.repeat) startMorphOrFlap()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, startMorphOrFlap, dissolveBackToLife])

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
    },
    [width, height, dimensions.cols, dimensions.rows]
  )

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setLaneHovered(true)
    if (modeRef.current !== 'life' || !boardRef.current) return
    const now = performance.now()
    if (now - lastSeedRef.current < 55) return
    lastSeedRef.current = now
    const rect = e.currentTarget.getBoundingClientRect()
    seedLifeAtPixel(boardRef.current, e.clientX - rect.left, e.clientY - rect.top)
  }, [])

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
              />
            )
          })
        )}

        {/* Floating 8-Bit Achievement Milestone Text Layer */}
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

      {/* Artistic Game of Life -> Dynamic Flappy Bird Canvas (desktop right margin only) */}
      {lane && (
        <canvas
          ref={canvasRef}
          className={`life-flappy-canvas ${mode !== 'life' ? 'is-playing' : ''}`}
          style={{
            left: `${lane.left}px`,
            top: `${lane.top}px`,
            width: `${lane.width}px`,
            height: `${lane.height}px`,
          }}
          aria-label="Interactive Game of Life artwork that rearranges into a Flappy milestones course on click"
          onMouseMove={handleCanvasMouseMove}
          onMouseEnter={() => setLaneHovered(true)}
          onMouseLeave={() => setLaneHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            startMorphOrFlap()
          }}
        />
      )}

      {/* Whisper-quiet inline micro-status anchored below the right margin (invisible until hover/play) */}
      {lane && (
        <div
          className={`ambient-flappy-hud ${laneHovered || mode !== 'life' ? 'is-visible' : ''}`}
          style={{
            left: `${lane.left + 14}px`,
            top: `${lane.top + lane.height + 8}px`,
            width: `${lane.width - 28}px`,
          }}
        >
          {mode === 'life' ? (
            <button
              type="button"
              className="ambient-flappy-hud-btn"
              onClick={startMorphOrFlap}
              aria-label="Rearrange Game of Life cells into Flappy Bird"
            >
              click to play
            </button>
          ) : mode === 'morphing' ? (
            <span className="ambient-flappy-hud-btn is-muted">rearranging…</span>
          ) : mode === 'crashed' ? (
            <>
              <button
                type="button"
                className="ambient-flappy-hud-btn"
                onClick={startMorphOrFlap}
              >
                {score}/{FLIGHT_STAMPS.length} · click to retry
              </button>
              <button
                type="button"
                className="ambient-flappy-hud-btn is-muted"
                onClick={dissolveBackToLife}
              >
                life
              </button>
            </>
          ) : (
            <>
              <span className="ambient-flappy-hud-score">
                {String(score).padStart(2, '0')} · best {String(best).padStart(2, '0')}
              </span>
              <button
                type="button"
                className="ambient-flappy-hud-btn is-muted"
                onClick={dissolveBackToLife}
              >
                life
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
