import { createPortal } from 'react-dom'
import { GlyphMatrix } from './GlyphMatrix'

export interface AIDetectorMatrixProps {
  isActive: boolean
}

export function AIDetectorMatrix({ isActive }: AIDetectorMatrixProps) {
  if (typeof document === 'undefined') return null

  // Retain the canvas and its atlas between hovers; CSS reverses interrupted fades.
  return createPortal(
    <div className={`ai-detector-matrix-backdrop ${isActive ? 'is-active' : ''}`} aria-hidden="true">
      <GlyphMatrix
        active={isActive}
        glyphs="01·•+*/\\<>=-_~:;{}[]#%^&!?010101"
        cellSize={18}
        mutationRate={0.028}
        interval={90}
        color="var(--ink)"
        className="ai-detector-matrix-canvas"
      />
    </div>,
    document.body,
  )
}
