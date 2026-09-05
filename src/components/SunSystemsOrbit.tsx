import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export interface SunSystemsOrbitProps {
  isActive: boolean
}

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

export function SunSystemsOrbit({ isActive }: SunSystemsOrbitProps) {
  // Generate a deterministic constellation of stars
  const stars = useMemo<Star[]>(() => {
    const starList: Star[] = []
    for (let i = 0; i < 75; i++) {
      // distribute across screen with slight randomness
      const x = (i * 17.3 + (i % 7) * 31.7) % 100
      const y = (i * 23.9 + (i % 5) * 41.3) % 100
      const size = (i % 3 === 0 ? 2.2 : i % 2 === 0 ? 1.5 : 1)
      const opacity = 0.35 + ((i % 10) * 0.055)
      const duration = 2.4 + ((i % 5) * 0.7)
      const delay = (i % 7) * 0.4
      starList.push({ id: i, x, y, size, opacity, duration, delay })
    }
    return starList
  }, [])

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="sun-systems-backdrop-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          {/* Deep Dark Space Atmosphere */}
          <div className="sun-systems-dark-canvas" />

          {/* Starfield Layer */}
          <div className="sun-systems-starfield">
            {stars.map((star) => (
              <span
                key={star.id}
                className="sun-systems-star"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  animationDuration: `${star.duration}s`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Orbiting Logo Rig positioned on the right viewport edge */}
          <div className="sun-systems-orbit-positioner">
            <svg
              className="sun-systems-orbit-svg"
              viewBox="0 0 260 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow for central sun cube */}
                <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="blur1" />
                  <feGaussianBlur stdDeviation="22" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Soft ambient aura */}
                <radialGradient id="sun-aura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f2b800" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#f2b800" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#f2b800" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient Solar Aura */}
              <circle cx="130" cy="130" r="125" fill="url(#sun-aura)" />

              {/* Orbiting Guide Path */}
              <circle
                cx="130"
                cy="130"
                r="92"
                fill="none"
                stroke="rgba(201, 205, 212, 0.3)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                className="sun-systems-orbit-track"
              />

              {/* Central Sun Cube */}
              <g className="sun-systems-center-sun">
                <rect
                  x="96"
                  y="96"
                  width="68"
                  height="68"
                  rx="4"
                  fill="#f2b800"
                  filter="url(#sun-glow)"
                />
              </g>

              {/* Rotating Orbit System with the 3 Satellites */}
              <g className="sun-systems-satellites-orbit-group">
                {/* Blue Satellite */}
                <g className="satellite-group satellite-blue">
                  <rect
                    x="50.9"
                    y="39.5"
                    width="40"
                    height="40"
                    rx="3"
                    fill="#2662d6"
                    className="satellite-cube"
                  />
                </g>

                {/* Red Satellite */}
                <g className="satellite-group satellite-red">
                  <rect
                    x="200.6"
                    y="94.0"
                    width="40"
                    height="40"
                    rx="3"
                    fill="#c3372b"
                    className="satellite-cube"
                  />
                </g>

                {/* Green Satellite */}
                <g className="satellite-group satellite-green">
                  <rect
                    x="78.5"
                    y="196.5"
                    width="40"
                    height="40"
                    rx="3"
                    fill="#3aa86b"
                    className="satellite-cube"
                  />
                </g>
              </g>
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
