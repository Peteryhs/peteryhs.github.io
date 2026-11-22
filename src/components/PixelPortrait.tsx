import { useEffect, useRef, useState } from 'react'
import { discover } from '../hooks/secrets'

// Mosaic resolutions (cells per side) stepped through on the way in and out.
const STEPS_IN = [56, 28, 20, 14]
const STEPS_OUT = [20, 28, 56]
const STEP_MS = 64

/** The About portrait. Click it and the photo steps down into pixel art; click again to restore. */
export function PixelPortrait({ src, alt }: { src: string; alt: string }) {
  const [pixelated, setPixelated] = useState(false)
  const [covered, setCovered] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const touched = useRef(false)

  useEffect(() => {
    // Nothing to do until the first click.
    if (!pixelated && !touched.current) return
    touched.current = true
    const img = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!img || !canvas || !ctx || !img.complete || !img.naturalWidth) return

    const cssSize = canvas.clientWidth || 112
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = canvas.height = Math.round(cssSize * dpr)
    const tiny = document.createElement('canvas')
    const tinyCtx = tiny.getContext('2d')
    if (!tinyCtx) return

    // Same square crop the <img> shows (object-fit: cover, object-position: center 45%).
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - side) / 2
    const sy = (img.naturalHeight - side) * 0.45

    const draw = (cells: number) => {
      tiny.width = tiny.height = cells
      tinyCtx.drawImage(img, sx, sy, side, side, 0, 0, cells, cells)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tiny, 0, 0, cells, cells, 0, 0, canvas.width, canvas.height)
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const steps = pixelated ? STEPS_IN : STEPS_OUT
    const timers: number[] = []

    if (pixelated) {
      setCovered(true)
      if (reduce) draw(STEPS_IN[STEPS_IN.length - 1])
      else steps.forEach((cells, i) => timers.push(window.setTimeout(() => draw(cells), i * STEP_MS)))
    } else if (reduce) {
      setCovered(false)
    } else {
      steps.forEach((cells, i) => timers.push(window.setTimeout(() => draw(cells), i * STEP_MS)))
      timers.push(window.setTimeout(() => setCovered(false), steps.length * STEP_MS))
    }

    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [pixelated])

  return (
    <button
      type="button"
      className="about-portrait-frame about-portrait-btn"
      aria-pressed={pixelated}
      aria-label={pixelated ? 'Restore the portrait photo' : 'Turn the portrait into pixel art'}
      onClick={(e) => {
        e.stopPropagation()
        setPixelated((p) => !p)
        discover('derez')
      }}
    >
      <img ref={imgRef} src={src} alt={alt} className="about-portrait-img" loading="lazy" />
      <canvas ref={canvasRef} className="about-portrait-canvas" data-covered={covered} aria-hidden="true" />
      <span className="about-portrait-hint" aria-hidden="true" />
    </button>
  )
}
