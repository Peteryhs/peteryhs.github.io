import { useEffect, useMemo } from 'react'
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
  // Directly change the site's background color
  useEffect(() => {
    const root = document.documentElement
    if (isActive) {
      root.classList.add('theme-sun-dark')
    } else {
      root.classList.remove('theme-sun-dark')
    }
    return () => {
      root.classList.remove('theme-sun-dark')
    }
  }, [isActive])

  // Generate crisp star dots (pure white dots, no glow)
  const stars = useMemo<Star[]>(() => {
    const starList: Star[] = []
    for (let i = 0; i < 70; i++) {
      const x = (i * 17.3 + (i % 7) * 31.7) % 100
      const y = (i * 23.9 + (i % 5) * 41.3) % 100
      const size = i % 3 === 0 ? 2 : 1.2
      const opacity = 0.3 + ((i % 8) * 0.07)
      const duration = 2.2 + ((i % 5) * 0.6)
      const delay = (i % 7) * 0.35
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
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          {/* Crisp Starfield Layer (No glow) */}
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

          {/* Clean Vector Orbiting Logo Rig (Strictly No Glow, sits below cards) */}
          <div className="sun-systems-orbit-positioner">
            <svg
              className="sun-systems-orbit-svg"
              viewBox="0 0 260 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Clean Orbit Guide Path */}
              <circle
                cx="130"
                cy="130"
                r="92"
                fill="none"
                stroke="#c9cdd4"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                strokeOpacity="0.45"
                className="sun-systems-orbit-track"
              />

              {/* Central Sun Cube */}
              <rect
                x="96"
                y="96"
                width="68"
                height="68"
                fill="#f2b800"
              />

              {/* Rotating Orbit System with the 3 Satellites */}
              <g className="sun-systems-satellites-orbit-group">
                {/* Blue Satellite */}
                <rect
                  x="50.9"
                  y="39.5"
                  width="40"
                  height="40"
                  fill="#2662d6"
                  className="satellite-cube"
                />

                {/* Red Satellite */}
                <rect
                  x="200.6"
                  y="94.0"
                  width="40"
                  height="40"
                  fill="#c3372b"
                  className="satellite-cube"
                />

                {/* Green Satellite */}
                <rect
                  x="78.5"
                  y="196.5"
                  width="40"
                  height="40"
                  fill="#3aa86b"
                  className="satellite-cube"
                />
              </g>
            </svg>
          </div>

          {/* Right-Edge Depth of Field Blur Lens (Out of focus effect) */}
          <div className="sun-systems-dof-blur-edge" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
