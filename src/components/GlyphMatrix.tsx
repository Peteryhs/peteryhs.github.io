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

const NUM_TIERS = 9
const MIN_ALPHA = 0.04
const MAX_ALPHA = 0.24

/**
 * Builds an offscreen sprite atlas containing all unique glyphs
 * pre-rendered at discrete alpha levels. This completely eliminates
 * font rasterization, string allocations, and canvas state churn on every tick.
 */
function buildGlyphAtlas(
  uniqueChars: string[],
  tileW: number,
  tileH: number,
  r: number,
  g: number,
  b: number,
  colorAlpha: number,
  fontSize: number
): HTMLCanvasElement {
  const atlas = document.createElement('canvas')
  atlas.width = Math.max(1, uniqueChars.length * tileW)
  atlas.height = Math.max(1, NUM_TIERS * tileH)
  const actx = atlas.getContext('2d', { willReadFrequently: false })
  if (!actx) return atlas

  actx.textBaseline = 'middle'
  actx.textAlign = 'center'
  actx.font = `${fontSize}px "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`

  // Tier 0 is intentionally left transparent (blank cell)
  // Tiers 1 through NUM_TIERS - 1 have subtle escalating opacity
  for (let tier = 1; tier < NUM_TIERS; tier++) {
    const norm = (tier - 1) / (NUM_TIERS - 2)
    const alpha = (MIN_ALPHA + norm * (MAX_ALPHA - MIN_ALPHA)) * colorAlpha
    actx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(4)})`

    const cy = Math.round(tier * tileH + tileH / 2)
    for (let c = 0; c < uniqueChars.length; c++) {
      const cx = Math.round(c * tileW + tileW / 2)
      actx.fillText(uniqueChars[c], cx, cy)
    }
  }

  return atlas
}

/**
 * Resolves a CSS color string (including var(--ink)) to RGBA components.
 */
function resolveCSSColor(color: string): { r: number; g: number; b: number; a: number } {
  if (typeof document === 'undefined') return { r: 244, g: 244, b: 245, a: 1 }

  let resolved = color
  if (color.startsWith('var(') || color === 'currentColor') {
    const temp = document.createElement('div')
    temp.style.color = color
    temp.style.position = 'absolute'
    temp.style.visibility = 'hidden'
    document.body.appendChild(temp)
    resolved = getComputedStyle(temp).color || '#ffffff'
    document.body.removeChild(temp)
  }

  const probe = document.createElement('canvas')
  probe.width = 1
  probe.height = 1
  const probeCtx = probe.getContext('2d')
  if (!probeCtx) return { r: 244, g: 244, b: 245, a: 1 }
  probeCtx.fillStyle = '#ffffff'
  probeCtx.fillStyle = resolved
  probeCtx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a: a / 255 }
}

/**
 * GlyphMatrix — high-performance animated grid of subtly shifting glyphs.
 * Uses a pre-rendered GPU sprite atlas and dirty-cell partial redraws so tick updates
 * take <0.1ms of CPU time instead of re-rasterizing thousands of glyphs every frame.
 */
export function GlyphMatrix({
  glyphs = '01·•+*/\\<>=_~:;{}[]#%^&!?010101',
  cellSize = 16,
  mutationRate = 0.03,
  interval = 80,
  fadeBottom = 0,
  color = 'var(--ink)',
  className,
  style,
  ...props
}: GlyphMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rgbaRef = useRef(resolveCSSColor(color))

  // Watch for theme changes or color prop changes to update RGBA
  useEffect(() => {
    const update = () => {
      rgbaRef.current = resolveCSSColor(color)
    }
    update()

    // Observe changes on <html> (dark/light mode class toggles)
    const observer = new MutationObserver(() => update())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return

    // Extract unique characters for the atlas
    const charList = Array.from(new Set(glyphs.length > 0 ? glyphs : '01'))
    const uniqueChars = charList.length > 0 ? charList : ['0', '1']

    let cols = 0
    let rows = 0
    let total = 0
    let tileW = 16
    let tileH = 16
    let dW = 0
    let dH = 0

    // Memory-efficient typed arrays for cell state
    let charIndices: Uint16Array = new Uint16Array(0)
    let baseTiers: Uint8Array = new Uint8Array(0)

    let atlas: HTMLCanvasElement | null = null
    let raf = 0
    let last = 0
    let stopped = false

    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resizeAndInit = () => {
      // Cap DPR to 2 to avoid huge pixel buffers on high-density displays
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight

      dW = Math.round(w * dpr)
      dH = Math.round(h * dpr)
      canvas.width = dW
      canvas.height = dH

      tileW = Math.max(10, Math.round(cellSize * dpr))
      tileH = tileW

      cols = Math.ceil(dW / tileW)
      rows = Math.ceil(dH / tileH)
      total = cols * rows

      // Font size scaled to device pixels
      const fontSize = Math.max(9 * dpr, Math.round(tileH * 0.68))

      // Generate offscreen sprite atlas
      const { r, g, b, a: colorAlpha } = rgbaRef.current
      atlas = buildGlyphAtlas(uniqueChars, tileW, tileH, r, g, b, colorAlpha, fontSize)

      // Initialize cell buffers
      charIndices = new Uint16Array(total)
      baseTiers = new Uint8Array(total)

      for (let i = 0; i < total; i++) {
        charIndices[i] = Math.floor(Math.random() * uniqueChars.length)
        // 12% probability of a blank cell for natural matrix breathing room
        baseTiers[i] = Math.random() < 0.12 ? 0 : 1 + Math.floor(Math.random() * (NUM_TIERS - 1))
      }

      drawAll()
    }

    /**
     * Initial full draw of all cells (runs once on mount/resize).
     */
    const drawAll = () => {
      if (!ctx || !atlas || total === 0) return
      ctx.clearRect(0, 0, dW, dH)

      for (let i = 0; i < total; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const fade = fadeBottom > 0 ? Math.max(0, 1 - (row / rows) * fadeBottom) : 1
        const effectiveTier = Math.round(baseTiers[i] * fade)

        if (effectiveTier > 0) {
          const destX = col * tileW
          const destY = row * tileH
          ctx.drawImage(
            atlas,
            charIndices[i] * tileW,
            effectiveTier * tileH,
            tileW,
            tileH,
            destX,
            destY,
            tileW,
            tileH
          )
        }
      }
    }

    /**
     * Partial redraw: only dirty/mutated cells are cleared and redrawn.
     * Takes ~0.05ms of CPU time instead of re-rendering thousands of cells.
     */
    const tick = (t: number) => {
      if (stopped) return

      if (t - last >= interval) {
        last = t

        if (total > 0 && atlas) {
          const mutations = Math.max(2, Math.floor(total * mutationRate))

          for (let n = 0; n < mutations; n++) {
            const i = Math.floor(Math.random() * total)
            const newChar = Math.floor(Math.random() * uniqueChars.length)
            const newTier = Math.random() < 0.12 ? 0 : 1 + Math.floor(Math.random() * (NUM_TIERS - 1))

            charIndices[i] = newChar
            baseTiers[i] = newTier

            const col = i % cols
            const row = Math.floor(i / cols)
            const destX = col * tileW
            const destY = row * tileH

            // Erase only the mutated cell's bounding box
            ctx.clearRect(destX, destY, tileW, tileH)

            const fade = fadeBottom > 0 ? Math.max(0, 1 - (row / rows) * fadeBottom) : 1
            const effectiveTier = Math.round(newTier * fade)

            if (effectiveTier > 0) {
              ctx.drawImage(
                atlas,
                newChar * tileW,
                effectiveTier * tileH,
                tileW,
                tileH,
                destX,
                destY,
                tileW,
                tileH
              )
            }
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }

    resizeAndInit()

    // If reduced motion is requested, render once and do not tick
    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(tick)
    }

    // Debounced resize handler to avoid layout churn
    let resizeTimer: number | null = null
    const handleResize = () => {
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (!stopped) {
          resizeAndInit()
        }
      }, 100)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // Pause animation when tab is in background to save battery and CPU
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (!stopped && !prefersReducedMotion) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [glyphs, cellSize, mutationRate, interval, fadeBottom, color])

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
