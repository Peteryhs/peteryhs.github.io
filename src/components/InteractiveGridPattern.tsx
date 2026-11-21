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
  buildWeatherMorphParticles,
  createTapestryRuntime,
  fetchWaterlooWeather,
  getDefaultWeather,
  getTapestryPalette,
  MORPH_DURATION_MS,
  renderFlappyInLane,
  renderMorphOverlay,
  renderWeatherTapestry,
  TAPESTRY_CELL,
  type LaneRect,
  type MorphParticle,
  type StageMode,
  type TapestryRuntime,
  type WeatherInfo,
} from './weatherTapestryEngine'

interface InteractiveGridPatternProps {
  sectionRef: RefObject<HTMLElement | null>
  width?: number
  height?: number
  className?: string
  squaresClassName?: string
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
  const bloomCanvasRef = useRef<HTMLCanvasElement>(null)
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1280, h: 720 })
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1280, h: 720 })
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 32,
    rows: 18,
  })
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)
  const [laneHovered, setLaneHovered] = useState(false)
  const [lane, setLane] = useState<LaneRect | null>(null)
  const laneRef = useRef<LaneRect | null>(null)

  const [weather, setWeather] = useState<WeatherInfo>(getDefaultWeather)
  const weatherRef = useRef<WeatherInfo>(weather)

  const [mode, setMode] = useState<StageMode>('tapestry')
  const modeRef = useRef<StageMode>('tapestry')
  const [isDissolving, setIsDissolving] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState<number>(readBest)
  const bestRef = useRef<number>(best)
  const [floatingStamps, setFloatingStamps] = useState<FloatingStamp[]>([])
  const [inView, setInView] = useState(true)

  const runtimeRef = useRef<TapestryRuntime>(createTapestryRuntime())
  const flightRef = useRef<AmbientFlight | null>(null)
  const morphRef = useRef<{ particles: MorphParticle[]; startTime: number } | null>(null)
  const crashTimerRef = useRef<number | null>(null)
  const dissolveTimerRef = useRef<number | null>(null)
  const stampIdRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [0, 1, 1, 0])

  const syncMode = useCallback((nextMode: StageMode) => {
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  const clearTimers = useCallback(() => {
    if (crashTimerRef.current !== null) {
      window.clearTimeout(crashTimerRef.current)
      crashTimerRef.current = null
    }
    if (dissolveTimerRef.current !== null) {
      window.clearTimeout(dissolveTimerRef.current)
      dissolveTimerRef.current = null
    }
  }, [])

  // Fetch live Waterloo weather once (cached 30 min in sessionStorage, instant time-of-day fallback)
  useEffect(() => {
    const controller = new AbortController()
    fetchWaterlooWeather(controller.signal).then((info) => {
      weatherRef.current = info
      setWeather(info)
    })
    return () => controller.abort()
  }, [])

  // Measure the full About grid container + the open right-side desktop Flappy lane
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateLayout = () => {
      const containerRect = el.getBoundingClientRect()
      const w = Math.max(320, Math.floor(containerRect.width || window.innerWidth))
      const h = Math.max(320, Math.floor(containerRect.height || 600))

      if (Math.abs(sizeRef.current.w - w) > 2 || Math.abs(sizeRef.current.h - h) > 2) {
        sizeRef.current = { w, h }
        setSize({ w, h })
      }

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
      const rightStart = Math.ceil((contentRect.right - containerRect.left + 24) / TAPESTRY_CELL) * TAPESTRY_CELL
      const rightEnd = Math.floor((w - 16) / TAPESTRY_CELL) * TAPESTRY_CELL
      const availWidth = rightEnd - rightStart

      // Desktop open-space only for playable Flappy lane; hide cleanly on narrow/mobile viewports
      if (availWidth < 210 || h < 340) {
        laneRef.current = null
        setLane(null)
        return
      }

      const laneHeight =
        Math.min(464, Math.max(304, Math.floor((h - 120) / TAPESTRY_CELL) * TAPESTRY_CELL))
      const laneTop =
        Math.round(((h - laneHeight) / 2) / TAPESTRY_CELL) * TAPESTRY_CELL

      const nextLane: LaneRect = {
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
        clearTimers()
        laneRef.current = nextLane
        setLane(nextLane)
        flightRef.current = createAmbientFlight(nextLane.width, nextLane.height)
        morphRef.current = null
        runtimeRef.current.wake = []
        setScore(0)
        syncMode('tapestry')
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
  }, [sectionRef, width, height, syncMode, clearTimers])

  // Pause rendering when About section is off-screen
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

  useEffect(() => clearTimers, [clearTimers])

  const dissolveBackToWeather = useCallback(() => {
    clearTimers()
    if (shouldReduceMotion) {
      morphRef.current = null
      runtimeRef.current.wake = []
      setScore(0)
      syncMode('tapestry')
      return
    }
    setIsDissolving(true)
    dissolveTimerRef.current = window.setTimeout(() => {
      morphRef.current = null
      runtimeRef.current.wake = []
      setScore(0)
      syncMode('tapestry')
      setIsDissolving(false)
    }, 180)
  }, [clearTimers, shouldReduceMotion, syncMode])

  const startMorphOrFlap = useCallback(() => {
    const currentLane = laneRef.current
    if (!currentLane) return

    clearTimers()
    setIsDissolving(false)
    const cur = modeRef.current

    if (cur === 'tapestry') {
      const freshFlight = createAmbientFlight(currentLane.width, currentLane.height)
      flightRef.current = freshFlight
      runtimeRef.current.wake = []
      setScore(0)
      if (shouldReduceMotion) {
        flightRef.current = flapAmbient(freshFlight)
        syncMode('playing')
        return
      }
      morphRef.current = {
        particles: buildWeatherMorphParticles(
          weatherRef.current.mood,
          performance.now(),
          runtimeRef.current,
          freshFlight,
          currentLane
        ),
        startTime: performance.now(),
      }
      syncMode('morphing')
      return
    }

    if (cur === 'morphing') {
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
      runtimeRef.current.wake = []
      setScore(0)
      syncMode('playing')
      return
    }

    if (flightRef.current) {
      flightRef.current = flapAmbient(flightRef.current)
    }
  }, [clearTimers, shouldReduceMotion, syncMode])

  // Full-bleed 60fps Crisp + Soft Aura rendering loop across the entire About grid
  useEffect(() => {
    const bloomCanvas = bloomCanvasRef.current
    const pixelCanvas = pixelCanvasRef.current
    if (!bloomCanvas || !pixelCanvas || !inView) return

    const { w, h } = sizeRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    bloomCanvas.width = Math.round(w * dpr)
    bloomCanvas.height = Math.round(h * dpr)
    pixelCanvas.width = Math.round(w * dpr)
    pixelCanvas.height = Math.round(h * dpr)

    const bloomCtx = bloomCanvas.getContext('2d')
    const pixelCtx = pixelCanvas.getContext('2d')
    if (!bloomCtx || !pixelCtx) return

    if (shouldReduceMotion && modeRef.current === 'tapestry') {
      bloomCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pixelCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const pal = getTapestryPalette(weatherRef.current.mood)
      renderWeatherTapestry(
        bloomCtx,
        pixelCtx,
        w,
        h,
        weatherRef.current.mood,
        pal,
        0,
        runtimeRef.current,
        null
      )
      return
    }

    let frame = 0
    let prevTime = 0

    const tick = (now: number) => {
      const dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 0
      prevTime = now

      const { w: cw, h: ch } = sizeRef.current
      bloomCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pixelCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const curMood = weatherRef.current.mood
      const pal = getTapestryPalette(curMood)
      const curMode = modeRef.current
      const activeLane = laneRef.current

      if (curMode === 'tapestry' || !activeLane) {
        pixelCanvas.style.filter = ''
        renderWeatherTapestry(
          bloomCtx,
          pixelCtx,
          cw,
          ch,
          curMood,
          pal,
          now,
          runtimeRef.current,
          null
        )
      } else if (curMode === 'morphing') {
        const morph = morphRef.current
        if (!morph) {
          pixelCanvas.style.filter = ''
          syncMode('playing')
        } else {
          const progress = Math.min(1, (now - morph.startTime) / MORPH_DURATION_MS)
          // Gentle blur-focus pulse at midpoint matching the site's blur transitions
          const blurPx = Math.sin(progress * Math.PI) * 2.8
          pixelCanvas.style.filter = blurPx > 0.08 ? `blur(${blurPx.toFixed(2)}px)` : ''

          renderWeatherTapestry(
            bloomCtx,
            pixelCtx,
            cw,
            ch,
            curMood,
            pal,
            now,
            runtimeRef.current,
            activeLane
          )
          renderMorphOverlay(bloomCtx, pixelCtx, morph.particles, progress, pal)

          if (progress >= 1) {
            pixelCanvas.style.filter = ''
            morphRef.current = null
            if (flightRef.current) {
              flightRef.current = flapAmbient(flightRef.current)
            }
            syncMode('playing')
          }
        }
      } else if (curMode === 'playing' || curMode === 'crashed') {
        pixelCanvas.style.filter = ''
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
              const minX = activeLane.left + 78
              const maxX = Math.max(minX, activeLane.left + activeLane.width - 78)
              const clampedX = Math.max(minX, Math.min(maxX, activeLane.left + ev.x))
              const liftedY = Math.max(activeLane.top + 20, activeLane.top + ev.y - 38)
              setFloatingStamps((prev) => [
                ...prev.slice(-3),
                {
                  id,
                  text: ev.stamp,
                  x: clampedX,
                  y: liftedY,
                },
              ])
              window.setTimeout(() => {
                setFloatingStamps((prev) => prev.filter((item) => item.id !== id))
              }, 2350)
            }

            if (next.result === 'crashed') {
              syncMode('crashed')
              clearTimers()
              crashTimerRef.current = window.setTimeout(() => {
                dissolveBackToWeather()
              }, 1800)
            }
          }

          renderWeatherTapestry(
            bloomCtx,
            pixelCtx,
            cw,
            ch,
            curMood,
            pal,
            now,
            runtimeRef.current,
            activeLane
          )
          renderFlappyInLane(
            bloomCtx,
            pixelCtx,
            runtimeRef.current,
            flightRef.current ?? currentFlight,
            activeLane,
            pal,
            now,
            modeRef.current === 'crashed',
            dt
          )
        }
      }

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
      pixelCanvas.style.filter = ''
    }
  }, [size, lane, inView, mode, weather, shouldReduceMotion, syncMode, clearTimers, dissolveBackToWeather])

  // Keyboard controls while actively flying or crashed
  useEffect(() => {
    if (mode === 'tapestry') return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        dissolveBackToWeather()
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
  }, [mode, startMorphOrFlap, dissolveBackToWeather])

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      runtimeRef.current.mouseX = x
      runtimeRef.current.mouseY = y
      runtimeRef.current.mouseActive = true

      const col = Math.floor(x / width)
      const row = Math.floor(y / height)
      if (col >= 0 && col < dimensions.cols && row >= 0 && row < dimensions.rows) {
        setHoveredSquare(`${col}-${row}`)
      }
    },
    [width, height, dimensions.cols, dimensions.rows]
  )

  const handleGridMouseLeave = useCallback(() => {
    setHoveredSquare(null)
    runtimeRef.current.mouseActive = false
  }, [])

  const handleHitboxMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setLaneHovered(true)
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    runtimeRef.current.mouseX = e.clientX - rect.left
    runtimeRef.current.mouseY = e.clientY - rect.top
    runtimeRef.current.mouseActive = true
  }, [])

  return (
    <motion.div
      ref={containerRef}
      className={`interactive-grid-container ${isDissolving ? 'is-dissolving' : ''} ${className}`}
      style={{ opacity: shouldReduceMotion ? 1 : opacity }}
    >
      <svg
        className="interactive-grid-svg"
        width="100%"
        height="100%"
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        <defs>
          {/* Fine 8px sub-grid nested 5x5 inside the 40px major graph-paper grid */}
          <pattern
            id="interactive-grid-sub"
            width={TAPESTRY_CELL}
            height={TAPESTRY_CELL}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${TAPESTRY_CELL} 0 L 0 0 0 ${TAPESTRY_CELL}`}
              fill="none"
              stroke="currentColor"
              className="interactive-grid-subline"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="interactive-grid-base"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <rect width={width} height={height} fill="url(#interactive-grid-sub)" />
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
      </svg>

      {/* Full-bleed Crisp + Soft Aura 8px live-weather tapestry spanning the ENTIRE About grid */}
      <canvas
        ref={bloomCanvasRef}
        className="tapestry-canvas-bloom"
        aria-hidden="true"
      />
      <canvas
        ref={pixelCanvasRef}
        className="tapestry-canvas-pixels"
        aria-hidden="true"
      />

      {/* Interactive right-side desktop hitbox (zero visual box, wakes Flappy morph on click) */}
      {lane && (
        <div
          className="tapestry-play-hitbox"
          role="button"
          tabIndex={0}
          aria-label="Rearrange live weather pixel tapestry into Flappy Bird milestones course"
          style={{
            left: `${lane.left}px`,
            top: `${lane.top}px`,
            width: `${lane.width}px`,
            height: `${lane.height}px`,
          }}
          onMouseMove={handleHitboxMouseMove}
          onMouseEnter={() => setLaneHovered(true)}
          onMouseLeave={() => {
            setLaneHovered(false)
            runtimeRef.current.mouseActive = false
          }}
          onClick={(e) => {
            e.stopPropagation()
            startMorphOrFlap()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
              e.preventDefault()
              if (!e.repeat) startMorphOrFlap()
            } else if (e.key === 'Escape' && modeRef.current !== 'tapestry') {
              e.preventDefault()
              dissolveBackToWeather()
            }
          }}
        />
      )}

      {/* Floating 8-Bit Milestone Text Layer rendered ABOVE both canvases so nothing occludes it */}
      {floatingStamps.length > 0 && (
        <div className="flappy-milestone-layer" aria-hidden="true">
          {floatingStamps.map((msg) => (
            <span
              key={msg.id}
              className="flappy-milestone-chip"
              style={{ left: `${msg.x}px`, top: `${msg.y}px` }}
            >
              {msg.text}
            </span>
          ))}
        </div>
      )}

      {/* Whisper-quiet inline micro-status anchored below the right margin (invisible until hover/play) */}
      {lane && (
        <div
          className={`ambient-flappy-hud ${laneHovered || mode !== 'tapestry' ? 'is-visible' : ''}`}
          style={{
            left: `${lane.left + 14}px`,
            top: `${lane.top + lane.height + 8}px`,
            width: `${lane.width - 28}px`,
          }}
        >
          {mode === 'tapestry' ? (
            <button
              type="button"
              className="ambient-flappy-hud-btn"
              onClick={startMorphOrFlap}
              aria-label="Rearrange live weather pixel tapestry into Flappy Bird"
            >
              {weather.label.toLowerCase()} · click to play
            </button>
          ) : mode === 'morphing' ? (
            <span className="ambient-flappy-hud-btn is-muted">focusing…</span>
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
                onClick={dissolveBackToWeather}
              >
                weather
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
                onClick={dissolveBackToWeather}
              >
                weather
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
