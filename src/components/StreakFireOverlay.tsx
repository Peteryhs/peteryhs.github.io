import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

export interface FlameOrigin {
  x: number
  y: number
  width: number
  height: number
  cardWidth: number
  cardHeight: number
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

      {/* Outer Duolingo flat-vector flame silhouette */}
      <g className="qe-flame-outer-group">
        <path
          d="M41.2 4.8C42.9 14.9 35.8 22.1 30.8 27.6C27.2 24.4 25.7 19.6 26.8 14.8C16.2 21.8 9.2 33.8 9.2 48.2C9.2 66.8 22.5 81.2 38.4 81.2C54.8 81.2 67.2 67.4 67.2 49.4C67.2 34.4 58.6 19.8 41.2 4.8Z"
          fill="#FF9600"
        />
      </g>

      {/* Mid amber flame tongue */}
      <g className="qe-flame-mid-group">
        <path
          d="M39.8 23.4C41.2 31.4 35.2 36.8 31.8 40.6C29.4 38.2 28.5 34.8 29.3 31.4C22.4 36.8 18.2 45.2 18.2 54.6C18.2 66.8 27.2 76.4 38.4 76.4C49.8 76.4 58.4 67.1 58.4 55.2C58.4 44.6 52.1 34.2 39.8 23.4Z"
          fill="#FFC800"
        />
      </g>

      {/* Bright inner yellow-white core */}
      <g className="qe-flame-inner-group">
        <path
          d="M39 44.2C32.4 49.8 27.8 56.4 27.8 63.4C27.8 70.1 32.5 75.4 38.4 75.4C44.4 75.4 49.1 70.1 49.1 63.6C49.1 56.8 45.2 50.2 39 44.2Z"
          fill="#FFF1B8"
        />
        <ellipse cx="38.4" cy="67.5" rx="6.2" ry="4.8" fill="#FFFDF2" opacity="0.72" />
      </g>
    </svg>
  )
}

interface SparkParticle {
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

const SPARK_COLORS = ['#FFF6CC', '#FFD900', '#FFC800', '#FF9600', '#FFFFFF']

const SUNBURST_RAYS = Array.from({ length: 16 }, (_, idx) => {
  const angle = (idx * 360) / 16
  return { id: idx, angle }
})

interface StreakFireOverlayProps {
  origin: FlameOrigin
  onComplete: () => void
}

const ANIMATION_DURATION_S = 1.78

export function StreakFireOverlay({ origin, onComplete }: StreakFireOverlayProps) {
  const [dismissing, setDismissing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const completedRef = useRef(false)
  const dismissTimerRef = useRef<number | null>(null)

  const finishOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const triggerEarlyDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (dismissing) return
    setDismissing(true)
    dismissTimerRef.current = window.setTimeout(finishOnce, 240)
  }

  // Allow Escape key to dismiss cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerEarlyDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissing])

  // Card-contained canvas burst for Duolingo vector sparks & embers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, origin.cardWidth)
    const height = Math.max(1, origin.cardHeight)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)

    const particles: SparkParticle[] = []
    const centerX = width / 2
    const centerY = height / 2

    const spawnBurst = (count: number, speedMin: number, speedMax: number) => {
      const kinds: SparkParticle['kind'][] = ['spark', 'spark', 'ember', 'flame']
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45
        const speed = speedMin + Math.random() * (speedMax - speedMin)
        const maxLife = 28 + Math.random() * 24
        particles.push({
          x: centerX + (Math.random() - 0.5) * 18,
          y: centerY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 0.8,
          size: 3 + Math.random() * 5.2,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.14,
          life: maxLife,
          maxLife,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          kind: kinds[Math.floor(Math.random() * kinds.length)],
        })
      }
    }

    const tBurst1 = window.setTimeout(() => spawnBurst(26, 2.0, 6.2), 260)
    const tBurst2 = window.setTimeout(() => spawnBurst(14, 1.4, 3.8), 520)

    let rafId = 0
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.vx *= 0.955
        p.vy = p.vy * 0.955 - 0.035
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.vRot
        p.life -= 1

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const t = p.life / p.maxLife
        const alpha = Math.min(1, t * 1.4)
        const s = p.size * (0.45 + 0.55 * t)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color

        if (p.kind === 'spark') {
          ctx.beginPath()
          ctx.moveTo(0, -s * 1.3)
          ctx.quadraticCurveTo(s * 0.18, -s * 0.18, s * 1.3, 0)
          ctx.quadraticCurveTo(s * 0.18, s * 0.18, 0, s * 1.3)
          ctx.quadraticCurveTo(-s * 0.18, s * 0.18, -s * 1.3, 0)
          ctx.quadraticCurveTo(-s * 0.18, -s * 0.18, 0, -s * 1.3)
          ctx.closePath()
          ctx.fill()
        } else if (p.kind === 'flame') {
          ctx.beginPath()
          ctx.moveTo(0, -s * 1.35)
          ctx.bezierCurveTo(s * 1.0, -s * 0.25, s * 0.85, s, 0, s)
          ctx.bezierCurveTo(-s * 0.85, s, -s * 1.0, -s * 0.25, 0, -s * 1.35)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2)
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
  }, [origin.cardHeight, origin.cardWidth])

  const cardW = Math.max(1, origin.cardWidth)
  const cardH = Math.max(1, origin.cardHeight)
  const maxRadius = Math.ceil(
    Math.hypot(Math.max(origin.x, cardW - origin.x), Math.max(origin.y, cardH - origin.y)) + 10
  )

  const heroSize = Math.round(Math.max(92, Math.min(Math.min(cardW, cardH) * 0.54, 128)))
  const startScale = origin.width / heroSize

  const centerX = cardW / 2
  const centerY = cardH / 2
  const startDx = origin.x - centerX
  const startDy = origin.y - centerY

  const ox = `${Math.round(origin.x)}px`
  const oy = `${Math.round(origin.y)}px`

  return (
    <motion.div
      className="streak-overlay"
      role="presentation"
      aria-hidden="true"
      onClick={triggerEarlyDismiss}
      initial={{ opacity: 1 }}
      animate={{ opacity: dismissing ? 0 : 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Single smooth geometric radial bloom from the flame across the entire card and back */}
      <motion.div
        className="streak-overlay-wash"
        initial={{
          clipPath: `circle(0px at ${ox} ${oy})`,
          opacity: 0.96,
        }}
        animate={
          dismissing
            ? {
                clipPath: `circle(0px at ${ox} ${oy})`,
                opacity: 0,
              }
            : {
                clipPath: [
                  `circle(0px at ${ox} ${oy})`,
                  `circle(${maxRadius}px at ${ox} ${oy})`,
                  `circle(${maxRadius}px at ${ox} ${oy})`,
                  `circle(0px at ${ox} ${oy})`,
                ],
                opacity: [0.92, 1, 1, 0.2],
              }
        }
        transition={
          dismissing
            ? { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
            : {
                duration: ANIMATION_DURATION_S,
                times: [0, 0.36, 0.62, 1],
                ease: ['easeOut', 'linear', 'easeInOut'],
              }
        }
        onAnimationComplete={() => {
          if (!dismissing) finishOnce()
        }}
      />

      {/* Spinning Duolingo vector sunburst contained inside the card */}
      <motion.div
        className="streak-overlay-sunburst-wrap"
        initial={{ scale: 0.16, opacity: 0 }}
        animate={
          dismissing
            ? { scale: 0.16, opacity: 0 }
            : {
                scale: [0.16, 1, 1.06, 0.16],
                opacity: [0, 0.88, 0.82, 0],
              }
        }
        transition={
          dismissing
            ? { duration: 0.2, ease: 'easeOut' }
            : {
                duration: ANIMATION_DURATION_S,
                times: [0, 0.36, 0.64, 1],
                ease: ['easeOut', 'linear', 'easeInOut'],
              }
        }
      >
        <svg className="streak-overlay-sunburst" viewBox="-200 -200 400 400" aria-hidden="true">
          {SUNBURST_RAYS.map((ray) => (
            <polygon
              key={ray.id}
              points="0,0 -13,-210 13,-210"
              fill="rgba(255, 241, 184, 0.22)"
              transform={`rotate(${ray.angle})`}
            />
          ))}
        </svg>
        <div className="streak-overlay-ring streak-overlay-ring-1" />
        <div className="streak-overlay-ring streak-overlay-ring-2" />
      </motion.div>

      {/* Card-contained spark & ember burst */}
      <canvas ref={canvasRef} className="streak-overlay-canvas" aria-hidden="true" />

      {/* Hero flame: glides & glows up from its slot to center-card and smoothly returns */}
      <motion.div
        className="streak-overlay-hero"
        style={{
          width: heroSize,
          height: Math.round(heroSize * 1.14),
          marginLeft: -heroSize / 2,
          marginTop: -Math.round(heroSize * 1.14) / 2,
        }}
        initial={{
          x: startDx,
          y: startDy,
          scale: startScale,
        }}
        animate={
          dismissing
            ? {
                x: startDx,
                y: startDy,
                scale: startScale,
                opacity: 0,
              }
            : {
                x: [startDx, 0, 0, startDx],
                y: [startDy, -4, -6, startDy],
                scale: [startScale, 1.08, 1.0, startScale],
              }
        }
        transition={
          dismissing
            ? { duration: 0.2, ease: 'easeOut' }
            : {
                duration: ANIMATION_DURATION_S,
                times: [0, 0.38, 0.62, 1],
                ease: ['easeOut', 'easeInOut', 'easeInOut'],
              }
        }
      >
        <div className="streak-overlay-glow" aria-hidden="true" />
        <DuolingoVectorFlame size={heroSize} mode="hero" />
      </motion.div>
    </motion.div>
  )
}
