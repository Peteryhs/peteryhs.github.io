import { motion, useScroll, useTransform } from 'motion/react'
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
  PIXEL_GRID_MAJOR,
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
import { discover } from '../hooks/secrets'

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
const GAME_AURA_GUTTER = 32

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
  className = '',
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bloomCanvasRef = useRef<HTMLCanvasElement>(null)
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null)
  const gameCanvasRef = useRef<HTMLCanvasElement>(null)
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // Motion's preference hook only samples on mount. Keep this animation loop
  // in sync when the OS preference changes while the page is already open.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setShouldReduceMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1280, h: 720 })
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1280, h: 720 })
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

      const aboutSection = sectionRef.current?.querySelector('.about-longform-section')
      if (!aboutSection) {
        laneRef.current = null
        setLane(null)
        return
      }

      const contentRect = aboutSection.getBoundingClientRect()
      const rightStart = Math.ceil((contentRect.right - containerRect.left + 20) / TAPESTRY_CELL) * TAPESTRY_CELL
      const rightEnd = Math.floor(w / TAPESTRY_CELL) * TAPESTRY_CELL
      const availWidth = rightEnd - rightStart

      // Desktop open-space only for playable Flappy lane; hide cleanly on narrow/mobile viewports
      if (availWidth < 200 || h < 340) {
        laneRef.current = null
        setLane(null)
        return
      }

      const laneTop = TAPESTRY_CELL
      const laneHeight = Math.max(300, Math.floor((h - TAPESTRY_CELL * 3) / TAPESTRY_CELL) * TAPESTRY_CELL)

      const nextLane: LaneRect = {
        left: rightStart,
        top: laneTop,
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
  }, [sectionRef, syncMode, clearTimers])

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
      setIsDissolving(false)
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

    discover('flappy')
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

  // Keep the 20px tiles sharp; blur the aura at cell resolution rather than
  // filtering a viewport-sized layer on every frame (costly on software GPUs).
  useEffect(() => {
    const bloomCanvas = bloomCanvasRef.current
    const outputCanvas = pixelCanvasRef.current
    if (!bloomCanvas || !outputCanvas || !inView) return
    const pixelCanvas = document.createElement('canvas')

    const { w, h } = sizeRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Cache full-bleed weather, then update only the bird's lane between weather
    // frames. The browser composites one sharp surface, not several large layers.
    const activeArea = lane ? {
      left: lane.left - GAME_AURA_GUTTER,
      top: lane.top - GAME_AURA_GUTTER,
      width: lane.width + GAME_AURA_GUTTER * 2,
      height: lane.height + GAME_AURA_GUTTER * 2,
    } : null
    const weatherArea = { left: 0, top: 0, width: w, height: h }
    const bloomScale = 1 / TAPESTRY_CELL
    bloomCanvas.width = Math.ceil(weatherArea.width * bloomScale)
    bloomCanvas.height = Math.ceil(weatherArea.height * bloomScale)
    pixelCanvas.width = Math.ceil(weatherArea.width * dpr)
    pixelCanvas.height = Math.ceil(weatherArea.height * dpr)
    outputCanvas.width = pixelCanvas.width
    outputCanvas.height = pixelCanvas.height
    outputCanvas.style.left = '0px'
    outputCanvas.style.top = '0px'
    outputCanvas.style.width = `${w}px`
    outputCanvas.style.height = `${h}px`
    for (const canvas of [bloomCanvas, pixelCanvas]) {
      canvas.style.left = `${weatherArea.left}px`
      canvas.style.top = `${weatherArea.top}px`
    }
    pixelCanvas.style.width = `${weatherArea.width}px`
    pixelCanvas.style.height = `${weatherArea.height}px`
    bloomCanvas.style.width = `${bloomCanvas.width / bloomScale}px`
    bloomCanvas.style.height = `${bloomCanvas.height / bloomScale}px`

    const bloomBuffer = document.createElement('canvas')
    bloomBuffer.width = bloomCanvas.width
    bloomBuffer.height = bloomCanvas.height
    const bloomCtx = bloomBuffer.getContext('2d')
    const auraCtx = bloomCanvas.getContext('2d')
    const pixelCtx = pixelCanvas.getContext('2d')
    const outputCtx = outputCanvas.getContext('2d')
    if (!bloomCtx || !auraCtx || !pixelCtx || !outputCtx) return

    const paintAura = () => {
      auraCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height)
      auraCtx.filter = `blur(${12 * bloomScale}px)`
      auraCtx.drawImage(bloomBuffer, 0, 0)
    }

    let lastWeatherPaint = -Infinity
    let weatherDirty = true
    const paintWeather = (time: number) => {
      lastWeatherPaint = time
      weatherDirty = true
      bloomCtx.setTransform(bloomScale, 0, 0, bloomScale, -weatherArea.left * bloomScale, -weatherArea.top * bloomScale)
      pixelCtx.setTransform(dpr, 0, 0, dpr, -weatherArea.left * dpr, -weatherArea.top * dpr)
      bloomCtx.clearRect(weatherArea.left, weatherArea.top, weatherArea.width, weatherArea.height)
      pixelCtx.clearRect(weatherArea.left, weatherArea.top, weatherArea.width, weatherArea.height)
      const morphProgress = morphRef.current ? Math.min(1, (time - morphRef.current.startTime) / MORPH_DURATION_MS) : 1
      const dim = modeRef.current === 'tapestry' ? 1 : modeRef.current === 'morphing' ? 1 - morphProgress * 0.72 : 0.26
      const activeMood = weatherRef.current.mood
      renderWeatherTapestry(
        bloomCtx, pixelCtx, w, h, activeMood,
        getTapestryPalette(activeMood), shouldReduceMotion ? 0 : time,
        runtimeRef.current, dim
      )
      paintAura()
    }

    // Keep the game's intermediate pixels local to the lane.
    const gameCanvas = gameCanvasRef.current
    const gameCtx = gameCanvas?.getContext('2d')
    const gameBloom = document.createElement('canvas')
    const gameAura = document.createElement('canvas')
    gameBloom.width = gameAura.width = Math.ceil((activeArea?.width ?? 1) * bloomScale)
    gameBloom.height = gameAura.height = Math.ceil((activeArea?.height ?? 1) * bloomScale)
    const gameBloomCtx = gameBloom.getContext('2d')
    const gameAuraCtx = gameAura.getContext('2d')
    if (gameCanvas && activeArea) {
      gameCanvas.width = Math.round(activeArea.width * dpr)
      gameCanvas.height = Math.round(activeArea.height * dpr)
    }

    const paintGameAura = () => {
      if (!gameCtx || !gameAuraCtx || !activeArea) return
      gameAuraCtx.clearRect(0, 0, gameAura.width, gameAura.height)
      gameAuraCtx.filter = `blur(${12 * bloomScale}px)`
      gameAuraCtx.drawImage(gameBloom, 0, 0)
      gameCtx.save()
      gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      gameCtx.globalAlpha = 0.44
      gameCtx.globalCompositeOperation = 'destination-over'
      gameCtx.drawImage(gameAura, 0, 0, gameAura.width / bloomScale, gameAura.height / bloomScale)
      gameCtx.restore()
    }

    let gameBlur = 0
    const presentScene = () => {
      const area = weatherDirty || !activeArea ? weatherArea : activeArea
      outputCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      outputCtx.clearRect(area.left, area.top, area.width, area.height)
      outputCtx.globalAlpha = 0.44
      outputCtx.drawImage(bloomCanvas,
        area.left * bloomScale, area.top * bloomScale, area.width * bloomScale, area.height * bloomScale,
        area.left, area.top, area.width, area.height)
      outputCtx.globalAlpha = 1
      outputCtx.drawImage(pixelCanvas,
        area.left * dpr, area.top * dpr, area.width * dpr, area.height * dpr,
        area.left, area.top, area.width, area.height)
      if (modeRef.current !== 'tapestry' && gameCanvas && activeArea) {
        outputCtx.filter = isDissolving ? 'blur(6px)' : gameBlur > 0.08 ? `blur(${gameBlur.toFixed(2)}px)` : 'none'
        outputCtx.drawImage(gameCanvas, activeArea.left, activeArea.top, activeArea.width, activeArea.height)
        outputCtx.filter = 'none'
      }
      weatherDirty = false
    }

    paintWeather(performance.now())
    presentScene()
    const themeObserver = new MutationObserver(() => {
      paintWeather(performance.now())
      presentScene()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    if (shouldReduceMotion && modeRef.current === 'tapestry') {
      return () => themeObserver.disconnect()
    }

    let frame = 0
    let prevTime = 0

    const tick = (now: number) => {
      const dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 0
      prevTime = now

      const rt = runtimeRef.current
      const targetStr = rt.mouseActive ? 1 : 0
      rt.mouseStrength += (targetStr - rt.mouseStrength) * 0.08
      if (rt.mouseActive) {
        if (rt.smoothMouseX < -9000) {
          rt.smoothMouseX = rt.mouseX
          rt.smoothMouseY = rt.mouseY
        } else {
          rt.smoothMouseX += (rt.mouseX - rt.smoothMouseX) * 0.14
          rt.smoothMouseY += (rt.mouseY - rt.smoothMouseY) * 0.14
        }
      }

      const curMood = weatherRef.current.mood
      const pal = getTapestryPalette(curMood)
      const curMode = modeRef.current
      const activeLane = laneRef.current
      gameBlur = 0

      if (curMode !== 'tapestry' && !shouldReduceMotion && now - lastWeatherPaint >= 1000 / 12) {
        paintWeather(now)
      }

      if (gameCtx && gameBloomCtx && activeArea) {
        gameCtx.setTransform(dpr, 0, 0, dpr, -activeArea.left * dpr, -activeArea.top * dpr)
        gameCtx.clearRect(activeArea.left, activeArea.top, activeArea.width, activeArea.height)
        gameBloomCtx.setTransform(bloomScale, 0, 0, bloomScale, -activeArea.left * bloomScale, -activeArea.top * bloomScale)
        gameBloomCtx.clearRect(activeArea.left, activeArea.top, activeArea.width, activeArea.height)
      }

      if (curMode === 'tapestry' || !activeLane) {
        paintWeather(now)
      } else if (curMode === 'morphing' && gameCtx && gameBloomCtx && gameCanvas) {
        const morph = morphRef.current
        if (!morph) {
          syncMode('playing')
        } else {
          const progress = Math.min(1, (now - morph.startTime) / MORPH_DURATION_MS)
          // Gentle blur-focus pulse at midpoint matching the site's blur transitions
          const blurPx = Math.sin(progress * Math.PI) * 2.6
          gameBlur = blurPx
          renderMorphOverlay(gameBloomCtx, gameCtx, morph.particles, progress, pal)

          if (progress >= 1) {
            morphRef.current = null
            if (flightRef.current) {
              flightRef.current = flapAmbient(flightRef.current)
            }
            syncMode('playing')
          }
        }
      } else if ((curMode === 'playing' || curMode === 'crashed') && gameCtx && gameBloomCtx && gameCanvas) {
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
              const liftedY = Math.max(activeLane.top + 24, activeLane.top + ev.y - 42)
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

          renderFlappyInLane(
            gameBloomCtx,
            gameCtx,
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

      if (curMode !== 'tapestry') paintGameAura()
      presentScene()
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
      themeObserver.disconnect()
    }
  }, [size, lane, inView, mode, weather, shouldReduceMotion, isDissolving, syncMode, clearTimers, dissolveBackToWeather])

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

  const handleGridMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    runtimeRef.current.mouseX = e.clientX - rect.left
    runtimeRef.current.mouseY = e.clientY - rect.top
    runtimeRef.current.mouseActive = true
  }, [])

  const handleGridMouseLeave = useCallback(() => {
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

  const gridStep = PIXEL_GRID_MAJOR

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
          {/* Quiet architectural graph paper aligned to the active pixel sub-grid. */}
          <pattern
            id="interactive-grid-unified"
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
              fill="none"
              stroke="currentColor"
              className="interactive-grid-line"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#interactive-grid-unified)" />
      </svg>

      {/* Transparent 20px sculpture layers; aura and game redraw independently. */}
      <canvas
        ref={bloomCanvasRef}
        className="tapestry-canvas-bloom"
        aria-hidden="true"
        style={{ display: 'none' }}
      />
      <canvas
        ref={pixelCanvasRef}
        className="tapestry-canvas-pixels"
        aria-hidden="true"
        style={{ visibility: 'visible' }}
      />
      {lane && (
        <canvas
          ref={gameCanvasRef}
          className="tapestry-canvas-game"
          aria-hidden="true"
          style={{
            display: 'none',
            left: lane.left - GAME_AURA_GUTTER,
            top: lane.top - GAME_AURA_GUTTER,
            width: lane.width + GAME_AURA_GUTTER * 2,
            height: lane.height + GAME_AURA_GUTTER * 2,
          }}
        />
      )}

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
            top: `${lane.top + lane.height + 6}px`,
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
