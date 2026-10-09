import { useEffect, useState } from 'react'

// How long a hover backdrop takes to fade out. Keep in sync with
// .hover-backdrop in index.css.
export const BACKDROP_FADE_MS = 360

// True while the backdrop is shown, and for the length of its fade-out after,
// so a canvas keeps animating as it fades and then stops costing frames.
export function useBackdropLoop(isActive: boolean) {
  const [running, setRunning] = useState(isActive)
  useEffect(() => {
    if (isActive) {
      setRunning(true)
      return
    }
    const id = window.setTimeout(() => setRunning(false), BACKDROP_FADE_MS + 40)
    return () => window.clearTimeout(id)
  }, [isActive])
  return running
}
