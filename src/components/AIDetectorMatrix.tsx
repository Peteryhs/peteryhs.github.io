import { motion, AnimatePresence } from 'motion/react'
import { GlyphMatrix } from './GlyphMatrix'

export interface AIDetectorMatrixProps {
  isActive: boolean
}

export function AIDetectorMatrix({ isActive }: AIDetectorMatrixProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="ai-detector-matrix-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          {/* Fullscreen MagicUI Glyph Matrix Layer */}
          <GlyphMatrix
            glyphs="01·•+*/\<>=-_~:;{}[]#%^&!?010101"
            cellSize={15}
            mutationRate={0.04}
            interval={80}
            color="var(--ink)"
            className="ai-detector-matrix-canvas"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
