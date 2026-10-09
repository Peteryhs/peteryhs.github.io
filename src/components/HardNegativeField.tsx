import { useEffect, useRef, useState } from 'react'

/**
 * Live take on the AI Detector banner: human samples sit on a rising curve
 * (blue), each one threaded to the AI "mirror" the pipeline found for it
 * (orange). Hover or tap a dot to light up its pair.
 *
 * Illustrative layout, seeded so it is identical on every load.
 */

const BLUE = [74, 158, 230] as const
const ORANGE = [246, 146, 52] as const
const PAIRS = 170

type Pair = {
  hx: number; hy: number // human point, 0..1
  ax: number; ay: number // AI mirror, 0..1
  cx: number; cy: number // thread control point
  phase: number
  size: number
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The human curve: enters bottom-left, bends up to the top near the middle. */
function curve(t: number) {
  const x = 0.16 + 0.34 * Math.pow(t, 0.85)
  const y = 1.04 - 1.1 * (1 - Math.pow(1 - t, 1.6))
  return [x, y] as const
}

function buildPairs(): Pair[] {
  const r = rng(412)
  return Array.from({ length: PAIRS }, (_, i) => {
    const t = (i + r() * 0.8) / PAIRS
    const [x, y] = curve(t)
    const hx = x + (r() - 0.5) * 0.012
    const hy = y + (r() - 0.5) * 0.03
    // Mirrors spread across the right half, loosely keeping their height.
    const ax = 0.56 + Math.pow(r(), 0.8) * 0.42
    const ay = Math.min(0.96, Math.max(0.04, hy * 0.55 + r() * 0.45))
    return {
      hx, hy, ax, ay,
      cx: (hx + ax) / 2 + (r() - 0.5) * 0.08,
      cy: Math.min(hy, ay) - 0.05 - r() * 0.12,
      phase: r() * Math.PI * 2,
      size: 0.75 + r() * 0.7,
    }
  })
}

const rgba = (c: readonly number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export function HardNegativeField({ caption, className = '' }: { caption: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pairs = buildPairs()
    const threads = document.createElement('canvas')
    let w = 0
    let h = 0
    let dpr = 1
    let hover = -1 // pair under the pointer
    let shown = -1 // pair being drawn (kept while it fades out)
    let auto = -1 // pair the idle "mining" cycle is showing
    let autoAt = 0
    const autoRng = rng(7)
    let lit = 0 // eased 0..1 highlight strength
    let raf = 0
    let visible = false
    let start = 0
    const DRAW_IN = reduced ? 0 : 1400

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      for (const c of [canvas, threads]) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
      }
      // Pre-render the faint thread web once per size.
      const t = threads.getContext('2d')!
      t.setTransform(dpr, 0, 0, dpr, 0, 0)
      t.lineWidth = 0.6
      for (const p of pairs) {
        const g = t.createLinearGradient(p.hx * w, 0, p.ax * w, 0)
        g.addColorStop(0, rgba(BLUE, 0.22))
        g.addColorStop(1, rgba(ORANGE, 0.16))
        t.strokeStyle = g
        t.beginPath()
        t.moveTo(p.hx * w, p.hy * h)
        t.quadraticCurveTo(p.cx * w, p.cy * h, p.ax * w, p.ay * h)
        t.stroke()
      }
      draw(performance.now())
    }

    const pointAt = (i: number, now: number, side: 'h' | 'a') => {
      const p = pairs[i]
      if (side === 'h') return [p.hx * w, p.hy * h] as const
      const drift = reduced ? 0 : 1
      return [
        p.ax * w + Math.sin(now / 2400 + p.phase) * 2.2 * drift,
        p.ay * h + Math.cos(now / 2900 + p.phase) * 1.6 * drift,
      ] as const
    }

    const draw = (now: number) => {
      if (!start) start = now
      const k = DRAW_IN ? Math.min(1, (now - start) / DRAW_IN) : 1
      const ease = 1 - Math.pow(1 - k, 3)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Thread web reveals left to right.
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, w * (0.12 + 0.88 * ease), h)
      ctx.clip()
      ctx.globalAlpha = 1 - 0.55 * lit
      ctx.drawImage(threads, 0, 0, w, h)
      ctx.restore()

      // Human curve as a soft glowing spine.
      ctx.save()
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.strokeStyle = rgba(BLUE, 0.85)
      ctx.shadowColor = rgba(BLUE, 0.9)
      ctx.shadowBlur = 12
      ctx.setLineDash([10, 7])
      ctx.lineDashOffset = reduced ? 0 : -now / 60
      ctx.beginPath()
      for (let s = 0; s <= 60 * ease; s++) {
        const [x, y] = curve(s / 60)
        if (s === 0) ctx.moveTo(x * w, y * h)
        else ctx.lineTo(x * w, y * h)
      }
      ctx.stroke()
      ctx.restore()

      // Dots.
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i]
        const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(now / 900 + p.phase * 3)
        const dim = shown >= 0 && shown !== i ? 1 - 0.5 * lit : 1
        const [hx, hy] = pointAt(i, now, 'h')
        const [ax, ay] = pointAt(i, now, 'a')
        if (p.hx < 0.12 + 0.88 * ease) {
          ctx.fillStyle = rgba(BLUE, 0.9 * dim)
          ctx.beginPath()
          ctx.arc(hx, hy, 1.3 * p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        if (p.ax < 0.12 + 0.88 * ease) {
          ctx.fillStyle = rgba(ORANGE, 0.85 * tw * dim)
          ctx.beginPath()
          ctx.arc(ax, ay, 1.5 * p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Highlighted pair.
      if (shown >= 0 && lit > 0.01) {
        const p = pairs[shown]
        const [hx, hy] = pointAt(shown, now, 'h')
        const [ax, ay] = pointAt(shown, now, 'a')
        const g = ctx.createLinearGradient(hx, 0, ax, 0)
        g.addColorStop(0, rgba(BLUE, lit))
        g.addColorStop(1, rgba(ORANGE, lit))
        ctx.save()
        ctx.lineWidth = 1.6
        ctx.strokeStyle = g
        ctx.shadowColor = 'rgba(255,255,255,0.35)'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(hx, hy)
        ctx.quadraticCurveTo(p.cx * w, p.cy * h, ax, ay)
        ctx.stroke()
        for (const [x, y, c] of [[hx, hy, BLUE], [ax, ay, ORANGE]] as const) {
          ctx.fillStyle = rgba(c, lit)
          ctx.shadowColor = rgba(c, 1)
          ctx.shadowBlur = 14
          ctx.beginPath()
          ctx.arc(x, y, 4.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = `rgba(255,255,255,${0.7 * lit})`
          ctx.lineWidth = 1.2
          ctx.shadowBlur = 0
          ctx.beginPath()
          ctx.arc(x, y, 7.5, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()
      }
    }

    const loop = (now: number) => {
      // Idle: cycle through pairs as if mining them, one every ~2.4s.
      if (hover < 0 && !reduced && now - start > DRAW_IN) {
        if (!autoAt) autoAt = now
        const phase = (now - autoAt) % 2400
        if (phase < 450 && auto >= 0) auto = -1
        else if (phase >= 450 && auto < 0) {
          // Only pairs comfortably inside the frame, so both ends stay visible.
          do auto = Math.floor(autoRng() * pairs.length)
          while (pairs[auto].hy < 0.15 || pairs[auto].hy > 0.85 || pairs[auto].ay < 0.12 || pairs[auto].ay > 0.88)
          shown = auto
        }
      } else auto = -1
      const target = hover >= 0 || auto >= 0 ? 1 : 0
      lit += (target - lit) * 0.18
      draw(now)
      const settling = DRAW_IN && now - start < DRAW_IN
      if (visible && (!reduced || settling || Math.abs(target - lit) > 0.01)) raf = requestAnimationFrame(loop)
      else raf = 0
    }
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    const pick = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const now = performance.now()
      let best = -1
      let bestD = 22 * 22
      for (let i = 0; i < pairs.length; i++) {
        for (const side of ['h', 'a'] as const) {
          const [px, py] = pointAt(i, now, side)
          const d = (px - x) ** 2 + (py - y) ** 2
          if (d < bestD) {
            bestD = d
            best = i
          }
        }
      }
      return best
    }

    const onMove = (e: PointerEvent) => {
      const i = pick(e.clientX, e.clientY)
      if (i !== hover) {
        hover = i
        if (i >= 0) shown = i
        auto = -1
        autoAt = 0
        setActive(i >= 0)
        kick()
      }
    }
    const onLeave = () => {
      hover = -1
      setActive(false)
      kick()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) kick()
    })
    io.observe(wrap)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    resize()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <figure className={`cs-hn ${className}`}>
      <div ref={wrapRef} className={`cs-hn-stage ${active ? 'is-active' : ''}`}>
        <canvas ref={canvasRef} className="cs-hn-canvas" role="img" aria-label={caption} />
        <div className="cs-hn-legend" aria-hidden="true">
          <span className="is-human">Human samples</span>
          <span className="is-ai">AI mirrors</span>
        </div>
        <span className="cs-hn-hint" aria-hidden="true">
          {active ? 'Human sample ↔ its AI mirror' : (
            <>
              <span className="cs-hn-hint-fine">Hover a dot to see its pair</span>
              <span className="cs-hn-hint-touch">Tap a dot to see its pair</span>
            </>
          )}
        </span>
      </div>
      <figcaption className="cs-figure-caption">{caption}</figcaption>
    </figure>
  )
}
