import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ShootingStars } from './ShootingStars'
import { StarsBackground } from './StarsBackground'

export interface HermesStarsBackdropProps {
  isActive: boolean
}

export function HermesStarsBackdrop({ isActive }: HermesStarsBackdropProps) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="hermes-stars-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          {/* Aceternity Stars Background (Twinkling Deep Field) */}
          <StarsBackground
            starDensity={0.0002}
            allStarsTwinkle={true}
            twinkleProbability={0.8}
            minTwinkleSpeed={0.5}
            maxTwinkleSpeed={1.2}
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
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
