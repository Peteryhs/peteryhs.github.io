import React, { useEffect, useState, useRef } from 'react'

export interface ShootingStar {
  id: number
  x: number
  y: number
  angle: number
  scale: number
  speed: number
  distance: number
}

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
}

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4)
  const offset = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 }
    case 1:
      return { x: typeof window !== 'undefined' ? window.innerWidth : 1200, y: offset, angle: 135 }
    case 2:
      return { x: offset, y: typeof window !== 'undefined' ? window.innerHeight : 800, angle: 225 }
    case 3:
      return { x: 0, y: offset, angle: 315 }
    default:
      return { x: 0, y: 0, angle: 45 }
  }
}

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
}) => {
  const [star, setStar] = useState<ShootingStar | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let isMounted = true

    const createStar = () => {
      if (!isMounted) return
      const { x, y, angle } = getRandomStartPoint()
      const newStar: ShootingStar = {
        id: Date.now() + Math.random(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: 0,
      }
      setStar(newStar)

      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay
      timeoutId = setTimeout(createStar, randomDelay)
    }

    createStar()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [minSpeed, maxSpeed, minDelay, maxDelay])

  useEffect(() => {
    let animationFrame: number

    const moveStar = () => {
      if (star) {
        setStar((prevStar) => {
          if (!prevStar) return null
          const newX =
            prevStar.x + prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180)
          const newY =
            prevStar.y + prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180)
          const newDistance = prevStar.distance + prevStar.speed
          const newScale = 1 + newDistance / 80

          const maxW = typeof window !== 'undefined' ? window.innerWidth : 1200
          const maxH = typeof window !== 'undefined' ? window.innerHeight : 800

          if (newX < -40 || newX > maxW + 40 || newY < -40 || newY > maxH + 40) {
            return null
          }

          return {
            ...prevStar,
            x: newX,
            y: newY,
            distance: newDistance,
            scale: newScale,
          }
        })
      }
    }

    animationFrame = requestAnimationFrame(moveStar)
    return () => cancelAnimationFrame(animationFrame)
  }, [star])

  return (
    <svg
      ref={svgRef}
      className={`shooting-stars-svg ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {star && (
        <rect
          key={star.id}
          x={star.x}
          y={star.y}
          width={starWidth * star.scale}
          height={starHeight}
          fill="url(#shooting-star-gradient)"
          transform={`rotate(${star.angle}, ${
            star.x + (starWidth * star.scale) / 2
          }, ${star.y + starHeight / 2})`}
        />
      )}
      <defs>
        <linearGradient id="shooting-star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  )
}
