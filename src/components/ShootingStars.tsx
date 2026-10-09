import React, { useEffect, useId, useRef } from 'react'

export interface ShootingStarsProps {
  minSpeed?: number
  maxSpeed?: number
  minDelay?: number
  maxDelay?: number
  starColor?: string
  trailColor?: string
  starWidth?: number
  starHeight?: number
  className?: string
  /** When false nothing is scheduled or animated. */
  running?: boolean
}

interface Star {
  x: number
  y: number
  angle: number
  speed: number
  distance: number
}

const randomStart = (): Omit<Star, 'speed' | 'distance'> => {
  const w = window.innerWidth
  const h = window.innerHeight
  const side = Math.floor(Math.random() * 4)
  const offset = Math.random() * w
  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 }
    case 1:
      return { x: w, y: offset, angle: 135 }
    case 2:
      return { x: offset, y: h, angle: 225 }
    default:
      return { x: 0, y: offset, angle: 315 }
  }
}

// One star at a time, moved by writing the rect's attributes directly from a
// single rAF loop. The old version set React state every frame.
export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 12,
  maxSpeed = 32,
  minDelay = 900,
  maxDelay = 3200,
  starColor = '#c084fc',
  trailColor = '#38bdf8',
  starWidth = 14,
  starHeight = 1.5,
  className = '',
  running = true,
}) => {
  const rectRef = useRef<SVGRectElement>(null)
  const gradientId = `shooting-star-gradient-${useId().replace(/:/g, '')}`

  useEffect(() => {
    const rect = rectRef.current
    if (!rect || !running) {
      rect?.setAttribute('visibility', 'hidden')
      return
    }

    let star: Star | null = null
    let raf = 0
    let timeout = 0

    const spawn = () => {
      star = { ...randomStart(), speed: Math.random() * (maxSpeed - minSpeed) + minSpeed, distance: 0 }
      if (!raf) raf = requestAnimationFrame(frame)
      timeout = window.setTimeout(spawn, Math.random() * (maxDelay - minDelay) + minDelay)
    }

    const frame = () => {
      raf = 0
      if (!star) {
        rect.setAttribute('visibility', 'hidden')
        return
      }
      const rad = (star.angle * Math.PI) / 180
      star.x += star.speed * Math.cos(rad)
      star.y += star.speed * Math.sin(rad)
      star.distance += star.speed
      const w = window.innerWidth
      const h = window.innerHeight
      if (star.x < -40 || star.x > w + 40 || star.y < -40 || star.y > h + 40) {
        star = null
        rect.setAttribute('visibility', 'hidden')
        return
      }
      const width = starWidth * (1 + star.distance / 80)
      rect.setAttribute('x', String(star.x))
      rect.setAttribute('y', String(star.y))
      rect.setAttribute('width', String(width))
      rect.setAttribute(
        'transform',
        `rotate(${star.angle}, ${star.x + width / 2}, ${star.y + starHeight / 2})`
      )
      rect.setAttribute('visibility', 'visible')
      raf = requestAnimationFrame(frame)
    }

    spawn()
    return () => {
      window.clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [running, minSpeed, maxSpeed, minDelay, maxDelay, starWidth, starHeight])

  return (
    <svg
      className={`shooting-stars-svg ${className}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <rect ref={rectRef} height={starHeight} fill={`url(#${gradientId})`} visibility="hidden" />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  )
}
