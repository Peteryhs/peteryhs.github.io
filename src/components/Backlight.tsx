import { useState, useRef, type ReactNode, type MouseEvent } from 'react'
import { motion } from 'motion/react'

export interface BacklightProps {
  children: ReactNode
  className?: string
  glowClassName?: string
  color?: string
  size?: number
  blur?: number
}

export function Backlight({
  children,
  className = '',
  glowClassName = '',
  color,
  size = 480,
  blur = 54,
}: BacklightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={containerRef}
      className={`backlight-wrapper ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Ambient Glowing Backlight (positioned behind card) */}
      <motion.div
        className={`backlight-glow ${glowClassName}`}
        aria-hidden="true"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={
          {
            filter: `blur(${blur}px)`,
            '--backlight-x': `${mousePos.x}px`,
            '--backlight-y': `${mousePos.y}px`,
            '--backlight-size': `${size}px`,
            ...(color ? { '--backlight-color': color } : {}),
          } as React.CSSProperties
        }
      />

      {/* Foreground Content Card */}
      <div className="backlight-content">
        {children}
      </div>
    </div>
  )
}
