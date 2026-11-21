import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  advanceFlight,
  birdX,
  createFlight,
  flap,
  FLIGHT_STAMPS,
  FLOOR_Y,
  PIPE_GAP,
  PIPE_WIDTH,
  WORLD_HEIGHT,
  type Flight,
} from './flappyBirdEngine'
import './FlappyBird.css'

type Mode = 'ready' | 'playing' | 'paused' | 'crashed' | 'complete'
const STORAGE_KEY = 'peter-flappy-milestones-best'

function readBest() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(saved)
      ? Math.max(0, Math.min(FLIGHT_STAMPS.length, Math.floor(saved)))
      : 0
  } catch {
    return 0
  }
}

function Bird({
  x,
  y,
  tilt = 0,
  flying = false,
}: {
  x: number
  y: number
  tilt?: number
  flying?: boolean
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${tilt})`}
      className={flying ? 'flappy-bird is-flying' : 'flappy-bird'}
    >
      <path
        d="M-14 4l-15 4 7-10 12-1"
        fill="#ed8c64"
        stroke="#604b38"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M-17 1c0-14 9-21 20-18C16-16 21-7 18 4 15 16-2 20-12 12Z"
        fill="#f7c65c"
        stroke="#604b38"
        strokeWidth="2.4"
      />
      <path
        d="M-3 6c2 9 10 9 15 4"
        fill="none"
        stroke="#ffdf87"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        className="flappy-wing"
        d="M-5-1c-15-8-17 7-6 11 7 3 13-3 6-11Z"
        fill="#e6a13f"
        stroke="#604b38"
        strokeWidth="2"
      />
      <path
        d="M17-2l12 5-13 5"
        fill="#ef9265"
        stroke="#604b38"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M-9-11l27 2" stroke="#71634f" strokeWidth="4" />
      <rect
        x="4"
        y="-14"
        width="12"
        height="12"
        rx="5"
        fill="#f9f7e9"
        stroke="#604b38"
        strokeWidth="2"
      />
      <circle cx="12" cy="-8" r="2.2" fill="#373b36" />
      <path
        d="M-2-17l-5-5m9 6 1-6"
        stroke="#604b38"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  )
}

export function FlappyBird() {
  const id = useId()
  const stageRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const widthRef = useRef(720)
  const [mode, setMode] = useState<Mode>('ready')
  const [flight, setFlight] = useState(() => createFlight(720))
  const flightRef = useRef(flight)
  const [best, setBest] = useState(readBest)
  const [announcement, setAnnouncement] = useState('')
  const bestRef = useRef(best)

  const commit = (next: Flight) => {
    flightRef.current = next
    setFlight(next)
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.max(280, Math.round(entry.contentRect.width))
      if (nextWidth === widthRef.current) return
      widthRef.current = nextWidth
      setWidth(nextWidth)
      // Resizing a viewport starts a fresh, fair course; saved stamps stay intact.
      setMode('ready')
      const fresh = createFlight(nextWidth)
      flightRef.current = fresh
      setFlight(fresh)
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (mode !== 'playing') return
    let frame = 0
    let previous = 0
    const tick = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0
      previous = now
      const current = flightRef.current
      const next = advanceFlight(current, dt, width)
      flightRef.current = next
      setFlight(next)
      if (next.score > current.score) {
        setAnnouncement(
          `Stamp ${next.score} of ${FLIGHT_STAMPS.length}: ${FLIGHT_STAMPS[next.score - 1]}`
        )
        if (next.score > bestRef.current) {
          bestRef.current = next.score
          setBest(next.score)
          try {
            localStorage.setItem(STORAGE_KEY, String(next.score))
          } catch {
            /* The game also works without storage. */
          }
        }
      }
      if (next.result !== 'flying') {
        setMode(next.result)
        setAnnouncement(
          next.result === 'complete'
            ? 'All nine milestones collected. Welcome to Waterloo!'
            : `Flight over. ${next.score} stamps collected. Try another flight.`
        )
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [mode, width])

  useEffect(() => {
    const pause = () => setMode((current) => (current === 'playing' ? 'paused' : current))
    const onVisibility = () => {
      if (document.hidden) pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause()
    })
    if (stageRef.current) observer.observe(stageRef.current)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [])

  const start = () => {
    commit(flap(createFlight(width)))
    setMode('playing')
    setAnnouncement('Flight started. Press Space or tap to flap. Escape pauses.')
    stageRef.current?.focus({ preventScroll: true })
  }

  const resume = () => {
    setMode('playing')
    stageRef.current?.focus({ preventScroll: true })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    if ([' ', 'ArrowUp', 'Enter'].includes(event.key)) {
      event.preventDefault()
      if (event.repeat) return
      if (mode === 'playing') commit(flap(flightRef.current))
      else if (mode === 'paused') resume()
      else start()
    } else if (
      (event.key === 'Escape' || event.key.toLowerCase() === 'p') &&
      mode === 'playing'
    ) {
      event.preventDefault()
      setMode('paused')
    }
  }

  const active = mode === 'playing'
  const idle = mode === 'ready'
  const collected = Math.max(best, flight.score)
  const nextStamp = FLIGHT_STAMPS[Math.min(flight.score, FLIGHT_STAMPS.length - 1)]

  return (
    <section className="flappy" aria-labelledby={`${id}-title`}>
      <header className="flappy-header">
        <div>
          <p className="flappy-eyebrow">
            <span aria-hidden="true">✦</span> A LITTLE SIDE QUEST
          </p>
          <h3 id={`${id}-title`}>
            Flappy milestones<span className="flappy-title-dot">.</span>
          </h3>
          <p className="flappy-subtitle">
            A little lift through the chapters that got me here.
          </p>
        </div>
        <div
          className="flappy-scoreboard"
          aria-label={`Flight score ${flight.score}. Best flight ${best}.`}
        >
          <div>
            <span>THIS FLIGHT</span>
            <strong>{String(flight.score).padStart(2, '0')}</strong>
          </div>
          <div>
            <span>PERSONAL BEST</span>
            <strong>{String(best).padStart(2, '0')}</strong>
          </div>
        </div>
      </header>

      <div
        ref={stageRef}
        className={`flappy-stage ${active ? 'is-playing' : ''}`}
        role="group"
        tabIndex={0}
        aria-label="Flappy milestones game"
        aria-describedby={`${id}-instructions`}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setMode((current) => (current === 'playing' ? 'paused' : current))
          }
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          if (active) {
            event.preventDefault()
            stageRef.current?.focus({ preventScroll: true })
            commit(flap(flightRef.current))
          }
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${WORLD_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="flappy-scene"
        >
          <defs>
            <pattern
              id={`${id}-graph`}
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="0.6" />
            </pattern>
            <pattern
              id={`${id}-ground`}
              width="24"
              height="26"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 10l8-6m8 16 8-6" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={width} height={WORLD_HEIGHT} className="flappy-sky" />
          <rect width={width} height={FLOOR_Y} fill={`url(#${id}-graph)`} className="flappy-graph" />
          <circle cx={width - 90} cy="65" r="29" className="flappy-sun" />
          {[0.16, 0.58, 0.89].map((fraction, i) => (
            <path
              key={fraction}
              d="M-36 0c-7-17 12-29 24-20 3-24 38-24 41 1 15-5 28 5 25 19Z"
              transform={`translate(${(((width * fraction - flight.distance * 0.12) % (width + 100)) + width + 100) % (width + 100) - 30} ${55 + i * 35})`}
              className="flappy-cloud"
            />
          ))}
          <path
            d={`M0 280Q${width * 0.15} 219 ${width * 0.36} 276T${width * 0.75} 262T${width + 80} 276V320H0Z`}
            className="flappy-hills-back"
          />
          <path
            d={`M0 288Q${width * 0.2} 251 ${width * 0.4} 290T${width * 0.8} 278T${width + 60} 285V320H0Z`}
            className="flappy-hills"
          />
          {!idle &&
            flight.gates
              .filter((gate) => gate.index < FLIGHT_STAMPS.length)
              .map((gate) => {
                const top = gate.center - PIPE_GAP / 2
                const bottom = gate.center + PIPE_GAP / 2
                return (
                  <g
                    key={gate.index}
                    className={`flappy-gate ${gate.passed ? 'is-passed' : ''}`}
                  >
                    <rect
                      x={gate.x}
                      y="-8"
                      width={PIPE_WIDTH}
                      height={top + 8}
                      rx="5"
                      className="flappy-pipe"
                    />
                    <rect
                      x={gate.x - 5}
                      y={top - 16}
                      width={PIPE_WIDTH + 10}
                      height="16"
                      rx="4"
                      className="flappy-pipe-cap"
                    />
                    <rect
                      x={gate.x}
                      y={bottom}
                      width={PIPE_WIDTH}
                      height={WORLD_HEIGHT - bottom}
                      rx="5"
                      className="flappy-pipe"
                    />
                    <rect
                      x={gate.x - 5}
                      y={bottom}
                      width={PIPE_WIDTH + 10}
                      height="16"
                      rx="4"
                      className="flappy-pipe-cap"
                    />
                    <path
                      d={`M${gate.x + 10} 0V${top - 23}M${gate.x + 10} ${bottom + 24}V${FLOOR_Y}`}
                      className="flappy-pipe-shine"
                    />
                    {!gate.passed && (
                      <g transform={`translate(${gate.x + PIPE_WIDTH / 2} ${gate.center})`}>
                        <circle r="15" className="flappy-token-ring" />
                        <path
                          d="M0-8 3-3 8 0 3 3 0 8-3 3-8 0-3-3Z"
                          className="flappy-token"
                        />
                      </g>
                    )}
                    <text
                      x={gate.x + PIPE_WIDTH / 2}
                      y={bottom + 42 < FLOOR_Y ? bottom + 40 : top - 28}
                      textAnchor="middle"
                      className="flappy-gate-number"
                    >
                      {String(gate.index + 1).padStart(2, '0')}
                    </text>
                  </g>
                )
              })}
          <rect y={FLOOR_Y} width={width} height="26" className="flappy-ground" />
          <rect
            y={FLOOR_Y}
            width={width}
            height="26"
            fill={`url(#${id}-ground)`}
            className="flappy-ground-texture"
          />
          <path d={`M0 ${FLOOR_Y}H${width}`} className="flappy-ground-line" />
          <Bird
            x={idle ? width * (width > 580 ? 0.24 : 0.5) : birdX(width)}
            y={idle ? (width > 580 ? 155 : 67) : flight.y}
            tilt={active ? Math.max(-22, Math.min(65, flight.velocity / 9)) : 0}
            flying={active}
          />
          {idle && width > 580 && (
            <path
              d={`M${width * 0.24 - 42} 158h-44m39 15h-23m31-30h-30`}
              className="flappy-speed-lines"
            />
          )}
        </svg>

        {active && (
          <>
            <div className="flappy-next">
              <span>NEXT STAMP</span>
              {nextStamp}
            </div>
            <button
              type="button"
              className="flappy-pause"
              onClick={() => setMode('paused')}
              aria-label="Pause flight"
            >
              <span aria-hidden="true">Ⅱ</span>
            </button>
            {flight.score > 0 && (
              <div key={flight.score} className="flappy-collected" aria-hidden="true">
                ✦ {FLIGHT_STAMPS[flight.score - 1]}
              </div>
            )}
          </>
        )}

        {!active && (
          <div className={`flappy-overlay ${idle ? 'is-ready' : ''}`}>
            <div className="flappy-overlay-card">
              <p className="flappy-overlay-kicker">
                {idle
                  ? 'THE SKY IS NOT THE LIMIT'
                  : mode === 'paused'
                    ? 'TAKE A BREATHER'
                    : mode === 'complete'
                      ? 'DESTINATION: WATERLOO'
                      : 'A LITTLE TURBULENCE'}
              </p>
              <h4>
                {idle ? (
                  <>
                    Small bird.{' '}
                    <br />
                    Big plans.
                  </>
                ) : mode === 'paused' ? (
                  'Holding pattern.'
                ) : mode === 'complete' ? (
                  'What a journey.'
                ) : (
                  'One more flight?'
                )}
              </h4>
              <p>
                {idle
                  ? 'Nine milestones. A pair of wings. Your turn.'
                  : mode === 'paused'
                    ? 'Your flight is right where you left it.'
                    : mode === 'complete'
                      ? 'All nine chapters, from DECA to UW CE ’31.'
                      : `${flight.score} of 9 stamps this flight. A fresh start is one flap away.`}
              </p>
              <button
                type="button"
                className="flappy-start"
                onClick={mode === 'paused' ? resume : start}
              >
                {idle ? 'Let’s fly' : mode === 'paused' ? 'Keep flying' : 'Fly again'}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flappy-underwing">
        <p id={`${id}-instructions`}>
          <kbd>Space</kbd> / <kbd>↑</kbd> or tap to flap <span>·</span> <kbd>Esc</kbd> to pause
        </p>
        <span>No downloads. Just a little determination.</span>
      </div>
      <details className="flappy-log">
        <summary>
          <span className="flappy-log-icon" aria-hidden="true">
            ✧
          </span>{' '}
          The flight log <span className="flappy-log-count">{collected} / 9 stamps</span>
          <span className="flappy-log-toggle" aria-hidden="true">
            +
          </span>
        </summary>
        <ol>
          {FLIGHT_STAMPS.map((stamp, index) => (
            <li key={stamp} className={index < collected ? 'is-collected' : ''}>
              <span>{index < collected ? '✓' : String(index + 1).padStart(2, '0')}</span>
              {stamp}
            </li>
          ))}
        </ol>
        <p>The same little references from the original snake, with a new set of wings.</p>
      </details>
      <p className="flappy-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  )
}
