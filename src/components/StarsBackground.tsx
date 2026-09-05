import React, { useEffect, useRef } from 'react'

export interface StarProps {
  x: number
  y: number
  radius: number
  opacity: number
  twinkleSpeed: number | null
}

export interface StarBackgroundProps {
  starDensity?: number
  allStarsTwinkle?: boolean
  twinkleProbability?: number
  minTwinkleSpeed?: number
  maxTwinkleSpeed?: number
  className?: string
  style?: React.CSSProperties
}

export const StarsBackground: React.FC<StarBackgroundProps> = ({
  starDensity = 0.00018,
  allStarsTwinkle = true,
  twinkleProbability = 0.75,
  minTwinkleSpeed = 0.6,
  maxTwinkleSpeed = 1.4,
  className = '',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<StarProps[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = 0
    let stopped = false

    const initAndResize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(window.innerWidth, canvas.clientWidth || 0, document.documentElement.clientWidth || 0)
      const height = Math.max(window.innerHeight, canvas.clientHeight || 0, document.documentElement.clientHeight || 0)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const area = width * height
      const numStars = Math.max(80, Math.floor(area * starDensity))

      const newStars: StarProps[] = []
      for (let i = 0; i < numStars; i++) {
        const shouldTwinkle = allStarsTwinkle || Math.random() < twinkleProbability
        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.9 + 0.5,
          opacity: Math.random() * 0.6 + 0.35,
          twinkleSpeed: shouldTwinkle
            ? minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed)
            : null,
        })
      }
      starsRef.current = newStars
    }

    initAndResize()

    const render = () => {
      if (stopped) return

      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)
      const stars = starsRef.current
      const now = Date.now() * 0.001

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        if (star.twinkleSpeed !== null) {
          star.opacity = 0.25 + Math.abs(Math.sin(now / star.twinkleSpeed) * 0.7)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      requestAnimationFrame(() => {
        if (!stopped) initAndResize()
      })
    }

    window.addEventListener('resize', handleResize)
    const ro = new ResizeObserver(handleResize)
    ro.observe(canvas)

    return () => {
      stopped = true
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      ro.disconnect()
    }
  }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed])

  return (
    <canvas
      ref={canvasRef}
      className={`stars-background-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
