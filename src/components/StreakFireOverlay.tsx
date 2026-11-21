import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'

export interface FlameOrigin {
  x: number
  y: number
  width: number
  height: number
}

interface DuolingoVectorFlameProps {
  size?: number
  mode?: 'idle' | 'hero'
  className?: string
}

export function DuolingoVectorFlame({
  size = 44,
  mode = 'idle',
  className = '',
}: DuolingoVectorFlameProps) {
  const height = Math.round(size * 1.14)

  return (
    <svg
      className={`qe-flame-svg qe-flame-${mode} ${className}`.trim()}
      width={size}
      height={height}
      viewBox="0 0 76 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Subtle rising micro-embers */}
      <circle className="qe-ember qe-ember-1" cx="25" cy="22" r="2.2" fill="#FFB100" />
      <circle className="qe-ember qe-ember-2" cx="54" cy="18" r="1.8" fill="#FFC800" />
      <circle className="qe-ember qe-ember-3" cx="39" cy="11" r="1.6" fill="#FF9600" />

      {/* Outer Duolingo flame silhouette */}
      <g className="qe-flame-outer-group">
        <path
          d="M40 3C41.2 20.5 60 24.8 57.2 43.2C61.8 39.2 63.4 35.4 63.4 31.8C71.2 41.6 74.8 50.2 72.8 61.2C70.4 75.8 57.8 84 39 84C19.2 84 5.2 73.2 5.2 57C5.2 42 14.2 31 24.4 25C21.4 35.6 23.4 42.8 29.2 46C26.2 29.4 41.2 19.8 40 3Z"
          fill="#FF9600"
        />
      </g>

      {/* Mid amber tongue */}
      <g className="qe-flame-mid-group">
        <path
          d="M39.5 23C40.2 35.4 53 39.2 51.8 51.8C55.2 48.8 56.6 45.8 56.8 43C63.2 50.4 64.6 58.6 61.8 67.4C58.6 77.2 49.4 82.6 38.6 82.6C25.2 82.6 15.2 74.2 15.2 61.4C15.2 49.8 22.4 41.4 29.8 36.8C27.8 44.6 29.8 49.8 34 51.6C31.8 39.6 40 32.8 39.5 23Z"
          fill="#FFB100"
        />
      </g>

      {/* Inner bright yellow core */}
      <g className="qe-flame-inner-group">
        <path
          d="M39 42C38.4 51.2 47.2 55.2 47.2 62.6C50.2 60.6 52 58.2 52.2 55.4C58 61.6 58.2 71.8 52 77.2C45 83.4 29.4 81.8 24.2 74.8C16.6 64.4 23.2 55.2 29.2 50.2C28.2 57.8 31.2 61.8 34.2 63C31.4 55 39.2 48.6 39 42Z"
          fill="#FFC800"
        />
        <path
          d="M38.8 59.5C41.8 63.6 44.6 66.8 44.4 71.2C44.2 75.8 40.6 79 36.6 78.6C32.4 78.2 30.2 74.8 30.8 70.6C31.4 66.4 35.6 63.4 38.8 59.5Z"
          fill="#FFF4B8"
        />
      </g>
    </svg>
  )
}

interface BurstParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vRot: number
  life: number
  maxLife: number
  color: string
  kind: 'spark' | 'ember' | 'flame'
}

type OverlayPhase = 'ignite' | 'celebrate' | 'settle'

interface StreakFireOverlayProps {
  origin: FlameOrigin
  getTargetOrigin: () => FlameOrigin | null
  onComplete: () => void
}

const SPARK_COLORS = ['#FFF6C2', '#FFC800', '#FFB100', '#FFFFFF', '#FFE066']

export function StreakFireOverlay({
  origin,
  getTargetOrigin,
  onComplete,
}: StreakFireOverlayProps) {
  const [phase, setPhase] = useState<OverlayPhase>('ignite')
  const [counterTicked, setCounterTicked] = useState(false)
  const [settleTarget, setSettleTarget] = useState<FlameOrigin>(origin)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseTimersRef = useRef<number[]>([])
  const completedRef = useRef(false)

  const finishOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const clearPhaseTimers = () => {
    for (const id of phaseTimersRef.current) {
      window.clearTimeout(id)
    }
    phaseTimersRef.current = []
  }

  const triggerEarlySettle = () => {
    clearPhaseTimers()
    setPhase((prev) => {
      if (prev === 'settle') return prev
      const fresh = getTargetOrigin()
      if (fresh) setSettleTarget(fresh)
      return 'settle'
    })
  }

  // Choreograph the Duolingo-style streak refresh phases
  useEffect(() => {
    const tCelebrate = window.setTimeout(() => setPhase('celebrate'), 260)
    const tTick = window.setTimeout(() => setCounterTicked(true), 580)
    const tSettle = window.setTimeout(() => {
      const fresh = getTargetOrigin()
      if (fresh) setSettleTarget(fresh)
      setPhase('settle')
    }, 1780)
    phaseTimersRef.current = [tCelebrate, tTick, tSettle]

    return () => {
      clearPhaseTimers()
    }
  }, [getTargetOrigin])

  // Unmount cleanly after settle flight completes
  useEffect(() => {
    if (phase !== 'settle') return
    const tDone = window.setTimeout(finishOnce, 640)
    return () => window.clearTimeout(tDone)
  }, [phase])

  // Prevent native document pointerdown listeners (e.g. App's outside-click handler)
  // from collapsing the expanded About Me panel when dismissing the portal overlay.
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const stopOutsidePointerDown = (e: PointerEvent) => {
      e.stopPropagation()
    }
    el.addEventListener('pointerdown', stopOutsidePointerDown)
    return () => el.removeEventListener('pointerdown', stopOutsidePointerDown)
  }, [])

  // Allow Escape to settle early
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerEarlySettle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Full-screen flat-vector spark & mini-flame particle burst
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const vw = window.innerWidth
    const vh = window.innerHeight
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)

    const cx = vw / 2
    const cy = vh * 0.44
    const particles: BurstParticle[] = []

    const spawnBurst = (count: number, speedMin: number, speedMax: number) => {
      const kinds: BurstParticle['kind'][] = ['spark', 'spark', 'ember', 'flame']
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35
        const speed = speedMin + Math.random() * (speedMax - speedMin)
        const maxLife = 42 + Math.random() * 44
        particles.push({
          x: cx + (Math.random() - 0.5) * 36,
          y: cy + (Math.random() - 0.5) * 36,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          size: 4 + Math.random() * 7.5,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.14,
          life: maxLife,
          maxLife,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          kind: kinds[Math.floor(Math.random() * kinds.length)],
        })
      }
    }

    // Primary explosion on center-stage ignition + secondary rising wave
    const tBurst1 = window.setTimeout(() => spawnBurst(46, 4.2, 13.5), 210)
    const tBurst2 = window.setTimeout(() => spawnBurst(24, 2.4, 7.2), 540)

    let rafId = 0
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.vx *= 0.965
        p.vy = p.vy * 0.965 - 0.045 // gentle thermal updraft
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.vRot
        p.life -= 1

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const t = p.life / p.maxLife
        const alpha = Math.min(1, t * 1.45)
        const s = p.size * (0.45 + 0.55 * t)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color

        if (p.kind === 'spark') {
          // Crisp 4-point Duolingo vector star
          ctx.beginPath()
          ctx.moveTo(0, -s * 1.35)
          ctx.quadraticCurveTo(s * 0.18, -s * 0.18, s * 1.35, 0)
          ctx.quadraticCurveTo(s * 0.18, s * 0.18, 0, s * 1.35)
          ctx.quadraticCurveTo(-s * 0.18, s * 0.18, -s * 1.35, 0)
          ctx.quadraticCurveTo(-s * 0.18, -s * 0.18, 0, -s * 1.35)
          ctx.closePath()
          ctx.fill()
        } else if (p.kind === 'flame') {
          // Flat vector teardrop flame tongue
          ctx.beginPath()
          ctx.moveTo(0, -s * 1.4)
          ctx.bezierCurveTo(s * 1.05, -s * 0.25, s * 0.9, s, 0, s)
          ctx.bezierCurveTo(-s * 0.9, s, -s * 1.05, -s * 0.25, 0, -s * 1.4)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      ctx.restore()
      rafId = window.requestAnimationFrame(render)
    }

    rafId = window.requestAnimationFrame(render)

    return () => {
      window.clearTimeout(tBurst1)
      window.clearTimeout(tBurst2)
      window.cancelAnimationFrame(rafId)
    }
  }, [])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const heroSize = Math.round(Math.max(124, Math.min(vw * 0.22, 168)))
  const startScale = origin.width / heroSize
  const endScale = settleTarget.width / heroSize

  const centerX = vw / 2
  const centerY = vh * 0.43

  const startDx = origin.x - centerX
  const startDy = origin.y - centerY
  const endDx = settleTarget.x - centerX
  const endDy = settleTarget.y - centerY

  const originPctX = `${Math.round((origin.x / vw) * 100)}%`
  const originPctY = `${Math.round((origin.y / vh) * 100)}%`
  const settlePctX = `${Math.round((settleTarget.x / vw) * 100)}%`
  const settlePctY = `${Math.round((settleTarget.y / vh) * 100)}%`

  return createPortal(
    <div
      ref={overlayRef}
      className={`streak-overlay is-${phase}`}
      role="dialog"
      aria-modal="false"
      aria-label="1,000+ day Duolingo streak celebration"
      onClick={triggerEarlySettle}
    >
      {/* Full-screen Duolingo fiery orange radial flash */}
      <motion.div
        className="streak-overlay-wash"
        initial={{
          clipPath: `circle(0% at ${originPctX} ${originPctY})`,
          opacity: 0.95,
        }}
        animate={
          phase === 'settle'
            ? {
                clipPath: `circle(0% at ${settlePctX} ${settlePctY})`,
                opacity: 0,
              }
            : {
                clipPath: `circle(150% at ${originPctX} ${originPctY})`,
                opacity: 1,
              }
        }
        transition={
          phase === 'settle'
            ? { duration: 0.56, ease: [0.4, 0, 0.2, 1] }
            : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
        }
      />

      {/* Spinning Duolingo vector sunburst + shockwave rings */}
      <motion.div
        className="streak-overlay-sunburst-wrap"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={
          phase === 'celebrate'
            ? { scale: 1, opacity: 1 }
            : phase === 'ignite'
              ? { scale: 0.55, opacity: 0.4 }
              : { scale: 0.35, opacity: 0 }
        }
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg className="streak-overlay-sunburst" viewBox="0 0 400 400" fill="none" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, idx) => (
            <polygon
              key={idx}
              points="200,200 184,8 216,8"
              fill="rgba(255, 224, 102, 0.24)"
              transform={`rotate(${idx * 22.5} 200 200)`}
            />
          ))}
        </svg>
        <span className="streak-overlay-ring streak-overlay-ring-1" />
        <span className="streak-overlay-ring streak-overlay-ring-2" />
      </motion.div>

      {/* Full-screen vector spark particle canvas */}
      <canvas ref={canvasRef} className="streak-overlay-canvas" aria-hidden="true" />

      {/* Hero flame that launches from the card, celebrates center-stage, and glides home */}
      <motion.div
        className="streak-overlay-hero"
        initial={{ x: startDx, y: startDy, scale: startScale, opacity: 1 }}
        animate={
          phase === 'settle'
            ? { x: endDx, y: endDy, scale: endScale, opacity: 1 }
            : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        transition={
          phase === 'settle'
            ? { duration: 0.56, ease: [0.32, 0.72, 0, 1] }
            : { type: 'spring', stiffness: 250, damping: 18, mass: 0.9 }
        }
      >
        <DuolingoVectorFlame size={heroSize} mode="hero" />
      </motion.div>

      {/* Rolling streak counter (999 -> 1,000+) */}
      <motion.div
        className="streak-overlay-counter"
        initial={{ opacity: 0, y: 24, scale: 0.88 }}
        animate={
          phase === 'celebrate'
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: phase === 'settle' ? -10 : 24, scale: 0.9 }
        }
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="streak-overlay-roll" aria-live="polite">
          <div className={`streak-overlay-roll-track ${counterTicked ? 'is-ticked' : ''}`}>
            <span className="streak-overlay-num">999</span>
            <span className="streak-overlay-num">1,000+</span>
          </div>
        </div>
        <span className="streak-overlay-label">day streak</span>
      </motion.div>
    </div>,
    document.body
  )
}
