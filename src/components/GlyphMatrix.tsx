import React, { useEffect, useRef } from 'react'

export interface GlyphMatrixProps extends React.HTMLAttributes<HTMLCanvasElement> {
  /** Pause updates without discarding the canvas or glyph atlas. */
  active?: boolean
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
 * Glyphs are rasterized once into an atlas, then only mutated cells are repainted.
 * Hover changes pause/resume the renderer without reallocating its buffers.
 */
export function GlyphMatrix({
  active = true,
  glyphs = '01·•+*/\\\\<>=_~:;{}[]#%^&!?010101',
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
  const rendererRef = useRef<{ setActive: (value: boolean) => void } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const chars = Array.from(new Set(glyphs || '01'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    let enabled = false
    let disposed = false
    let sizeDirty = true
    let colorDirty = true
    let frame = 0
    let timer = 0
    let cols = 0
    let rows = 0
    let total = 0
    let width = 0
    let height = 0
    let tileSize = 0
    let atlas: HTMLCanvasElement | null = null
    let atlasKey = ''
    const atlases = new Map<string, HTMLCanvasElement>()
    let charIndices = new Uint16Array(0)
    let tiers = new Uint8Array(0)

    const cancel = () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      frame = 0
      timer = 0
    }
    const canPaint = () => enabled && !disposed && !document.hidden

    const drawCell = (i: number, erase: boolean) => {
      if (!atlas) return
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = col * tileSize
      const y = row * tileSize
      if (erase) ctx.clearRect(x, y, tileSize, tileSize)
      const fade = fadeBottom > 0 ? Math.max(0, 1 - (row / rows) * fadeBottom) : 1
      const tier = Math.round(tiers[i] * fade)
      if (tier > 0) {
        ctx.drawImage(atlas, charIndices[i] * tileSize, tier * tileSize,
          tileSize, tileSize, x, y, tileSize, tileSize)
      }
    }
    const randomizeCell = (i: number) => {
      charIndices[i] = Math.floor(Math.random() * chars.length)
      tiers[i] = Math.random() < 0.12 ? 0 : 1 + Math.floor(Math.random() * (NUM_TIERS - 1))
    }

    const paint = () => {
      frame = 0
      if (!canPaint()) return
      let redraw = false

      if (sizeDirty) {
        sizeDirty = false
        // A subtle backdrop does not need a full-resolution Retina pixel buffer.
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const cssWidth = canvas.clientWidth
        const cssHeight = canvas.clientHeight
        const nextWidth = Math.round(cssWidth * dpr)
        const nextHeight = Math.round(cssHeight * dpr)
        // Keep the initial draw bounded even on ultrawide/4K displays.
        const effectiveCellSize = Math.max(cellSize, Math.sqrt(cssWidth * cssHeight / 8500))
        const nextTileSize = Math.max(10, Math.round(effectiveCellSize * dpr))
        if (width !== nextWidth || height !== nextHeight || tileSize !== nextTileSize) {
          width = nextWidth
          height = nextHeight
          tileSize = nextTileSize
          canvas.width = width
          canvas.height = height
          cols = Math.ceil(width / tileSize)
          rows = Math.ceil(height / tileSize)
          total = cols * rows
          charIndices = new Uint16Array(total)
          tiers = new Uint8Array(total)
          for (let i = 0; i < total; i++) randomizeCell(i)
          colorDirty = true
          redraw = true
        }
      }

      if (colorDirty) {
        colorDirty = false
        const { r, g, b, a } = resolveCSSColor(color)
        const nextKey = `${tileSize}:${r},${g},${b},${a}`
        if (nextKey !== atlasKey) {
          atlasKey = nextKey
          atlas = atlases.get(nextKey) ?? buildGlyphAtlas(chars, tileSize, tileSize, r, g, b, a, Math.round(tileSize * 0.68))
          atlases.set(nextKey, atlas)
          if (atlases.size > 3) atlases.delete(atlases.keys().next().value!)
          redraw = true
        }
      }
      if (redraw) {
        ctx.clearRect(0, 0, width, height)
        for (let i = 0; i < total; i++) drawCell(i, false)
      } else if (!reducedMotion.matches && total > 0) {
        const mutations = Math.ceil(total * Math.max(0, Math.min(1, mutationRate)))
        for (let n = 0; n < mutations; n++) {
          const i = Math.floor(Math.random() * total)
          randomizeCell(i)
          drawCell(i, true)
        }
      }

      // Wake only when a glyph update is due, and align the paint to a frame.
      if (!reducedMotion.matches && canPaint()) {
        timer = window.setTimeout(() => {
          timer = 0
          if (canPaint()) frame = requestAnimationFrame(paint)
        }, Math.max(40, interval))
      }
    }

    const queuePaint = () => {
      if (!canPaint() || frame) return
      window.clearTimeout(timer)
      timer = 0
      frame = requestAnimationFrame(paint)
    }
    rendererRef.current = {
      setActive(value) {
        enabled = value
        if (value) queuePaint()
        else cancel()
      },
    }
    const onResize = () => {
      sizeDirty = true
      queuePaint()
    }
    const onTheme = () => {
      colorDirty = true
      queuePaint()
    }
    const onVisibility = () => {
      if (document.hidden) cancel()
      else queuePaint()
    }
    const onMotion = () => {
      cancel()
      queuePaint()
    }

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(onTheme)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    colorScheme.addEventListener('change', onTheme)
    reducedMotion.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      cancel()
      rendererRef.current = null
      resizeObserver.disconnect()
      themeObserver.disconnect()
      colorScheme.removeEventListener('change', onTheme)
      reducedMotion.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [glyphs, cellSize, mutationRate, interval, fadeBottom, color])

  useEffect(() => {
    rendererRef.current?.setActive(active)
  }, [active, glyphs, cellSize, mutationRate, interval, fadeBottom, color])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none', ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}
