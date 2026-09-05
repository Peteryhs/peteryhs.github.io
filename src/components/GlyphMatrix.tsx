import React, { useEffect, useRef } from 'react'

export interface GlyphMatrixProps extends React.HTMLAttributes<HTMLCanvasElement> {
  /** Characters to randomly pick from */
  glyphs?: string
  /** Cell size in px (also font size) */
  cellSize?: number
  /** Probability (0-1) a cell mutates each tick */
  mutationRate?: number
  /** Tick interval in ms */
  interval?: number
  /** Fade out toward bottom (0 = no fade) */
  fadeBottom?: number
  /** Glyph color (any CSS color string) */
  color?: string
}

/**
 * GlyphMatrix — an animated grid of subtly shifting glyphs.
 * Based on MagicUI Glyph Matrix specification.
 */
export function GlyphMatrix({
  glyphs = '01·•+*/\\<>=_~:;{}[]#%^&!?010101',
  cellSize = 16,
  mutationRate = 0.045,
  interval = 80,
  fadeBottom = 0,
  color = 'var(--ink)',
  className,
  style,
  ...props
}: GlyphMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rgbaRef = useRef({ r: 244, g: 244, b: 245, a: 1 })

  // Resolve any valid CSS color string or variable to RGBA
  useEffect(() => {
    const resolveColor = () => {
      let resolved = color
      if (color.startsWith('var(') || color === 'currentColor') {
        const temp = document.createElement('div')
        temp.style.color = color
        document.body.appendChild(temp)
        resolved = getComputedStyle(temp).color || '#ffffff'
        document.body.removeChild(temp)
      }

      const probe = document.createElement('canvas')
      probe.width = 1
      probe.height = 1
      const probeCtx = probe.getContext('2d')
      if (!probeCtx) return
      probeCtx.fillStyle = '#ffffff'
      probeCtx.fillStyle = resolved
      probeCtx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data
      rgbaRef.current = { r, g, b, a: a / 255 }
    }

    resolveColor()
  }, [color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cols = 0
    let rows = 0
    let cells: string[] = []
    let alphas: number[] = []
    let raf = 0
    let last = 0
    let stopped = false

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight

      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(w / cellSize)
      rows = Math.ceil(h / cellSize)

      cells = new Array(cols * rows)
        .fill(0)
        .map(() => glyphs[Math.floor(Math.random() * glyphs.length)])
      alphas = new Array(cols * rows)
        .fill(0)
        .map(() => 0.05 + Math.random() * 0.20)
    }

    const draw = () => {
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      ctx.clearRect(0, 0, w, h)

      ctx.font = `${Math.max(10, cellSize - 2)}px "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textBaseline = 'top'
      ctx.textAlign = 'center'

      const { r, g, b, a: colorAlpha } = rgbaRef.current
      const halfCell = cellSize / 2

      for (let y = 0; y < rows; y++) {
        const fade = fadeBottom > 0 ? 1 - (y / rows) * fadeBottom : 1
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const a = alphas[i] * fade * colorAlpha
          if (a <= 0.01) continue
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
          ctx.fillText(cells[i], x * cellSize + halfCell, y * cellSize)
        }
      }
    }

    const tick = (t: number) => {
      if (stopped) return

      if (t - last >= interval) {
        last = t

        const total = cols * rows
        if (total > 0) {
          const mutations = Math.max(2, Math.floor(total * mutationRate))
          for (let n = 0; n < mutations; n++) {
            const i = Math.floor(Math.random() * total)
            cells[i] = glyphs[Math.floor(Math.random() * glyphs.length)]
            alphas[i] = 0.05 + Math.random() * 0.22
          }
        }

        draw()
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    draw()
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (!stopped) {
          resize()
          draw()
        }
      })
    })
    ro.observe(canvas)

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [glyphs, cellSize, mutationRate, interval, fadeBottom])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  )
}
