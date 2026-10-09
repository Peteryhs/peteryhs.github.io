import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackdropLoop } from '../hooks/useBackdropLoop'
import { ShootingStars } from './ShootingStars'
import { StarsBackground } from './StarsBackground'

export interface HermesStarsBackdropProps {
  isActive: boolean
}

export function HermesStarsBackdrop({ isActive }: HermesStarsBackdropProps) {
  // Mount once on first hover and keep the starfield; later hovers only fade
  // it in and restart the loops, instead of regenerating every star.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (isActive) setMounted(true)
  }, [isActive])
  const running = useBackdropLoop(isActive)

  if (typeof document === 'undefined' || !mounted) return null

  return createPortal(
    <div
      className={`hermes-stars-backdrop hover-backdrop${isActive ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      {/* Aceternity Stars Background (Twinkling Deep Field) */}
      <StarsBackground
        starDensity={0.0002}
        allStarsTwinkle={true}
        twinkleProbability={0.8}
        minTwinkleSpeed={0.5}
        maxTwinkleSpeed={1.2}
        running={running}
      />

      {/* Aceternity Shooting Stars Layer */}
      <ShootingStars
        minSpeed={14}
        maxSpeed={34}
        minDelay={800}
        maxDelay={2600}
        starColor="#f3e8ff"
        trailColor="#a855f7"
        starWidth={16}
        starHeight={1.5}
        running={running}
      />
    </div>,
    document.body
  )
}
