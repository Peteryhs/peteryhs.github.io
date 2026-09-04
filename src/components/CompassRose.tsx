import { motion, useReducedMotion } from 'motion/react'

interface CompassRoseProps {
  className?: string
  size?: number | string
  angle?: number
}

export function CompassRose({ className = '', size = '100%', angle = 0 }: CompassRoseProps) {
  const shouldReduceMotion = useReducedMotion()

  // Generate 24 tick lines around outer dial (every 15 degrees) centered at (200, 200)
  const ticks = Array.from({ length: 24 }).map((_, i) => {
    const angle = i * 15
    const isCardinal = angle % 90 === 0
    const isOrdinal = angle % 45 === 0 && !isCardinal
    const rOuter = 145
    const rInner = isCardinal ? 130 : isOrdinal ? 134 : 138
    const rad = (angle * Math.PI) / 180
    const x1 = 200 + Math.sin(rad) * rInner
    const y1 = 200 - Math.cos(rad) * rInner
    const x2 = 200 + Math.sin(rad) * rOuter
    const y2 = 200 - Math.cos(rad) * rOuter

    return {
      key: `tick-${angle}`,
      x1,
      y1,
      x2,
      y2,
      isCardinal,
      isOrdinal,
      angle,
    }
  })

  const dimension = typeof size === 'number' ? `${size}px` : size

  return (
    <div
      className={`compass-rose-container ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-hidden="true"
    >
      <svg
        className="compass-rose-svg"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.04" />
            <stop offset="85%" stopColor="var(--ink)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Subtle Radial Base */}
        <circle cx="200" cy="200" r="165" fill="url(#compassGlow)" />

        {/* Outer Concentric Calibration Rings */}
        <circle
          cx="200"
          cy="200"
          r="152"
          stroke="var(--line)"
          strokeWidth="0.5"
          className="compass-ring-outer"
        />
        <circle
          cx="200"
          cy="200"
          r="145"
          stroke="var(--line-strong)"
          strokeWidth="0.6"
          className="compass-ring-main"
        />
        <circle
          cx="200"
          cy="200"
          r="74"
          stroke="var(--line)"
          strokeWidth="0.4"
          className="compass-ring-mid"
        />
        <circle
          cx="200"
          cy="200"
          r="28"
          stroke="var(--line-strong)"
          strokeWidth="0.5"
          className="compass-ring-core"
        />

        {/* Degree Ticks (Every 15°) */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isCardinal ? 'var(--ink)' : 'var(--line-strong)'}
            strokeWidth={t.isCardinal ? 0.75 : t.isOrdinal ? 0.6 : 0.4}
            strokeLinecap="round"
          />
        ))}

        {/* Cardinal Axis Crosshairs */}
        <line
          x1="200"
          y1="48"
          x2="200"
          y2="352"
          stroke="var(--line-strong)"
          strokeWidth="0.45"
        />
        <line
          x1="48"
          y1="200"
          x2="352"
          y2="200"
          stroke="var(--line-strong)"
          strokeWidth="0.45"
        />

        {/* Secondary Ordinal Needles (NE, NW, SE, SW) */}
        <g className="compass-ordinal-needles">
          {/* NE */}
          <polygon
            points="200,200 202,194 256,144 194,202"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.4"
          />
          {/* NW */}
          <polygon
            points="200,200 198,194 144,144 206,202"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.4"
          />
          {/* SE */}
          <polygon
            points="200,200 202,206 256,256 194,198"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.4"
          />
          {/* SW */}
          <polygon
            points="200,200 198,206 144,256 206,198"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.4"
          />
        </g>

        {/* Dynamic Magnetic Needle Group (Spins in place to point to target tile) */}
        <motion.g
          className="compass-needle-group"
          animate={{ rotate: angle }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 140,
                  damping: 15,
                  mass: 0.35,
                }
          }
          style={{
            originX: 0.5,
            originY: 0.5,
            transformBox: 'view-box',
            transformOrigin: '200px 200px',
          }}
        >
          {/* East Pointer Needle */}
          <polygon
            points="200,200 200,191 310,200"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.5"
          />
          <polygon
            points="200,200 200,209 310,200"
            fill="var(--hover)"
            stroke="var(--line-strong)"
            strokeWidth="0.5"
          />

          {/* West Pointer Needle */}
          <polygon
            points="200,200 200,191 90,200"
            fill="var(--hover)"
            stroke="var(--line-strong)"
            strokeWidth="0.5"
          />
          <polygon
            points="200,200 200,209 90,200"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.5"
          />

          {/* South Pointer Needle (Hollow / Light Facet) */}
          <polygon
            points="200,200 191,200 200,312"
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
          />
          <polygon
            points="200,200 209,200 200,312"
            fill="var(--hover)"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
          />

          {/* ================================================================
              PROMINENT NORTH ARROW (True North Indicator)
             ================================================================ */}
          {/* North Left Facet: High-Contrast Solid Ink Fill */}
          <polygon
            points="200,200 191,200 200,74"
            fill="var(--ink)"
            stroke="var(--ink)"
            strokeWidth="0.7"
            className="compass-north-needle-solid"
          />

          {/* North Right Facet: Crisp Contrast Stroke Facet */}
          <polygon
            points="200,200 209,200 200,74"
            fill="var(--hover-active)"
            stroke="var(--ink)"
            strokeWidth="0.7"
            className="compass-north-needle-accent"
          />

          {/* Arrow Tip Apex Marker Accent */}
          <circle cx="200" cy="74" r="2" fill="var(--ink)" />
          <line
            x1="200"
            y1="67"
            x2="200"
            y2="74"
            stroke="var(--ink)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Center Hub Housing */}
          <circle
            cx="200"
            cy="200"
            r="13"
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth="0.8"
          />
          <circle
            cx="200"
            cy="200"
            r="5.5"
            fill="var(--ink)"
          />
          <circle
            cx="200"
            cy="200"
            r="2"
            fill="var(--paper)"
          />
        </motion.g>
      </svg>
    </div>
  )
}
