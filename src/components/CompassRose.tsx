import { motion, useReducedMotion } from 'motion/react'

const COMPASS_CENTER = 200
const SHOW_TRUE_NORTH_MERIDIAN = false

interface CompassRoseProps {
  className?: string
  size?: number | string
  angle?: number
}

function pointOnCompass(bearing: number, radius: number) {
  const rad = (bearing * Math.PI) / 180

  return {
    x: COMPASS_CENTER + Math.sin(rad) * radius,
    y: COMPASS_CENTER - Math.cos(rad) * radius,
  }
}

export function CompassRose({
  className = '',
  size = '100%',
  angle = 0,
}: CompassRoseProps) {
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

  const collarTeeth = Array.from({ length: 18 }).map((_, i) => {
    const toothAngle = i * 20
    const inner = pointOnCompass(toothAngle, i % 3 === 0 ? 34 : 36)
    const outer = pointOnCompass(toothAngle, 40)

    return {
      key: `collar-tooth-${toothAngle}`,
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      isPrimary: i % 3 === 0,
    }
  })

  const boundedArcAngle = Math.max(-179.5, Math.min(179.5, angle))
  const hasBearingArc = Math.abs(boundedArcAngle) > 4
  const bearingArcProgress = Math.min(Math.abs(boundedArcAngle) / 360, 0.5)
  const bearingArcDirection = boundedArcAngle < 0 ? -1 : 1
  const dimension = typeof size === 'number' ? `${size}px` : size
  const needleTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 140,
        damping: 15,
        mass: 0.35,
      }
  const collarTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 105,
        damping: 18,
        mass: 0.42,
      }

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
          <linearGradient
            id="northNeedleDark"
            x1="191"
            y1="200"
            x2="200"
            y2="74"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--ink)" />
            <stop offset="54%" stopColor="var(--ink)" />
            <stop offset="100%" stopColor="var(--ink)" />
          </linearGradient>
          <linearGradient
            id="northNeedleAccent"
            x1="209"
            y1="200"
            x2="200"
            y2="74"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--hover-active)" />
            <stop offset="62%" stopColor="var(--hover-active)" />
            <stop offset="100%" stopColor="var(--paper)" />
          </linearGradient>
        </defs>

        {/* Layer 1: fixed dial foundation */}
        <g className="compass-layer compass-dial-layer">
          <circle cx="200" cy="200" r="165" fill="url(#compassGlow)" />

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

          <line
            className="compass-crosshair"
            x1="200"
            y1="48"
            x2="200"
            y2="352"
          />
          <line
            className="compass-crosshair"
            x1="48"
            y1="200"
            x2="352"
            y2="200"
          />

          {SHOW_TRUE_NORTH_MERIDIAN && (
            <g className="compass-true-north-meridian">
              <line
                className="compass-true-north-line"
                x1="200"
                y1="48"
                x2="200"
                y2="172"
              />
              <line
                className="compass-true-north-cap"
                x1="193"
                y1="57"
                x2="207"
                y2="57"
              />
              <circle className="compass-true-north-pin" cx="200" cy="48" r="1.7" />
            </g>
          )}
        </g>

        {/* Layer 2: bearing readout, below the solid rose points */}
        <motion.g
          className="compass-bearing-arc-group"
          initial={false}
          animate={{ scaleX: bearingArcDirection }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 160,
                  damping: 24,
                }
          }
          style={{
            originX: 0.5,
            originY: 0.5,
            transformBox: 'view-box',
            transformOrigin: '200px 200px',
          }}
        >
          <motion.circle
            className="compass-bearing-arc"
            cx="200"
            cy="200"
            r="116"
            pathLength={1}
            initial={false}
            animate={{
              opacity: hasBearingArc ? 0.5 : 0,
              pathLength: hasBearingArc ? bearingArcProgress : 0,
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    opacity: { duration: 0.18 },
                    pathLength: {
                      type: 'spring',
                      stiffness: 92,
                      damping: 18,
                      mass: 0.34,
                    },
                  }
            }
            transform="rotate(-90 200 200)"
          />
        </motion.g>

        {/* Layer 3: opaque rose points mask the calibration below them */}
        <g className="compass-layer compass-static-points-layer">
          <polygon
            className="compass-point-face"
            points="200,200 202,194 256,144 194,202"
          />
          <polygon
            className="compass-point-face"
            points="200,200 198,194 144,144 206,202"
          />
          <polygon
            className="compass-point-face compass-point-face-warm"
            points="200,200 202,206 256,256 194,198"
          />
          <polygon
            className="compass-point-face"
            points="200,200 198,206 144,256 206,198"
          />
        </g>

        {/* Mechanical Index Collar */}
        <motion.g
          className="compass-mechanical-collar"
          animate={{ rotate: angle }}
          transition={collarTransition}
          style={{
            originX: 0.5,
            originY: 0.5,
            transformBox: 'view-box',
            transformOrigin: '200px 200px',
          }}
        >
          <circle className="compass-collar-plate" cx="200" cy="200" r="43.5" />
          <circle className="compass-collar-outer-ring" cx="200" cy="200" r="41.5" />
          <circle className="compass-collar-inner-ring" cx="200" cy="200" r="31.5" />
          {collarTeeth.map((tooth) => (
            <line
              key={tooth.key}
              className={tooth.isPrimary ? 'is-primary' : ''}
              x1={tooth.x1}
              y1={tooth.y1}
              x2={tooth.x2}
              y2={tooth.y2}
              strokeLinecap="round"
            />
          ))}
          <line
            className="compass-collar-index"
            x1="200"
            y1="158"
            x2="200"
            y2="169"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Dynamic Magnetic Needle Group (Spins in place to point to target tile) */}
        <motion.g
          className="compass-needle-group"
          animate={{ rotate: angle }}
          transition={needleTransition}
          style={{
            originX: 0.5,
            originY: 0.5,
            transformBox: 'view-box',
            transformOrigin: '200px 200px',
          }}
        >
          {/* East Pointer Needle */}
          <polygon
            className="compass-needle-face"
            points="200,200 200,191 310,200"
          />
          <polygon
            className="compass-needle-face compass-needle-face-warm"
            points="200,200 200,209 310,200"
          />

          {/* West Pointer Needle */}
          <polygon
            className="compass-needle-face compass-needle-face-warm"
            points="200,200 200,191 90,200"
          />
          <polygon
            className="compass-needle-face"
            points="200,200 200,209 90,200"
          />

          {/* South Pointer Needle (Hollow / Light Facet) */}
          <polygon
            className="compass-needle-face"
            points="200,200 191,200 200,312"
          />
          <polygon
            className="compass-needle-face compass-needle-face-warm"
            points="200,200 209,200 200,312"
          />

          {/* ================================================================
              PROMINENT NORTH ARROW (True North Indicator)
             ================================================================ */}
          {/* North Left Facet: High-Contrast Solid Ink Fill */}
          <polygon
            points="200,200 191,200 200,74"
            fill="url(#northNeedleDark)"
            stroke="var(--ink)"
            strokeWidth="0.7"
            className="compass-north-needle-solid"
          />

          {/* North Right Facet: Crisp Contrast Stroke Facet */}
          <polygon
            points="200,200 209,200 200,74"
            fill="url(#northNeedleAccent)"
            stroke="var(--ink)"
            strokeWidth="0.7"
            className="compass-north-needle-accent"
          />
          <line
            className="compass-north-needle-highlight"
            x1="202.7"
            y1="191"
            x2="200.6"
            y2="83"
            strokeLinecap="round"
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
