import { useEffect, useRef, useState } from 'react'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const CLEARANCE = 4
const CLEARANCE_PRESSED = 2.5
const DOT = 10
const IBEAM_W = 2.5
const IBEAM_DEFAULT_H = 24
const FRAME_RADIUS = {
  default: 14,
  pixel: 0,
  pcb: 14,
  viewfinder: 2,
  projects: 13,
  waterloo: 10,
  studio: 13,
  systems: 13,
  ml: 12,
} as const
type FrameKind = keyof typeof FRAME_RADIUS
const CORNERS = ['tl', 'tr', 'bl', 'br'] as const
const BIN_PAD = 10
const SYS_PAD = 12
const SYS_OUTSET = 0.65
const SYS_CABLES = [
  { id: 'red', offset: 1.5, casing: '#2b1718', jacket: '#a64d4d', sheen: '#c98585' },
  { id: 'blue', offset: 0, casing: '#172336', jacket: '#4d76a6', sheen: '#88acd4' },
  { id: 'green', offset: -1.5, casing: '#162d21', jacket: '#478564', sheen: '#80b89a' },
] as const
const SYS_MAX_COMBS = 8

function computeCableCombs(w: number, h: number) {
  const x0 = SYS_PAD - SYS_OUTSET
  const y0 = SYS_PAD - SYS_OUTSET
  const bw = w + SYS_OUTSET * 2
  const bh = h + SYS_OUTSET * 2
  const r = Math.min(13.6, bw / 2, bh / 2)
  const sh = Math.max(0, bw - 2 * r)
  const sv = Math.max(0, bh - 2 * r)

  const combs: { x: number; y: number; deg: number }[] = []
  const hFracs = sh >= 120 ? [0.18, 0.5, 0.82] : sh >= 42 ? [0.28, 0.72] : [0.5]

  for (const f of hFracs) {
    const x = x0 + r + sh * f
    combs.push({ x, y: y0, deg: -90 })
    combs.push({ x, y: y0 + bh, deg: 90 })
  }

  if (sv >= 6) {
    const cy = y0 + bh / 2
    combs.push({ x: x0, y: cy, deg: 180 })
    combs.push({ x: x0 + bw, y: cy, deg: 0 })
  }

  return { x0, y0, bw, bh, r, combs }
}

function encodeAsciiBinary(message: string): string {
  return Array.from(message)
    .map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('')
}

// 8-bit ASCII encoded message forming the rounded Projects cursor border
const PROJECTS_BIN_SPANS = Array.from(encodeAsciiBinary('HELLO WORLD! BUILD & SHIP! DEV OSS ')).map((bit, i) =>
  bit === '1' ? (
    <tspan key={i} className="mc-b1">
      1
    </tspan>
  ) : (
    '0'
  ),
)

const TEXT_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, dt, dd'
const FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]'
const CONTROL_SELECTOR = 'button, a, summary, label, [role="button"], [role="img"]'

interface Box {
  x: number
  y: number
  w: number
  h: number
  r: number
}

type Mode = 'dot' | 'text' | 'lock'
const CHANNELS = ['x', 'y', 'w', 'h', 'r'] as const

/** Exact critically damped spring step: no overshoot, stable at any frame time. */
function spring(value: number, velocity: number, target: number, omega: number, dt: number): [number, number] {
  const d = value - target
  const e = Math.exp(-omega * dt)
  const t = (velocity + omega * d) * dt
  return [target + (d + t) * e, (velocity - omega * t) * e]
}

/**
 * Checks whether (x, y) actually lands on rendered non-whitespace glyphs inside `hit`,
 * rather than empty block width or line-height whitespace of a `<p>` / heading.
 */
function getTextRectAtPoint(hit: Element, x: number, y: number, range: Range): DOMRect | null {
  if (hit.closest(CONTROL_SELECTOR) || !hit.closest(TEXT_SELECTOR)) return null

  const padX = 2
  const padY = 1

  for (let node = hit.firstChild; node; node = node.nextSibling) {
    if (node.nodeType !== Node.TEXT_NODE) continue
    const value = node.nodeValue
    if (!value) continue

    const start = value.search(/\S/)
    if (start === -1) continue

    let end = value.length - 1
    while (end > start && /\s/.test(value[end])) end--

    range.setStart(node, start)
    range.setEnd(node, end + 1)

    const rects = range.getClientRects()
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]
      if (r.width <= 0 || r.height <= 0) continue
      if (x >= r.left - padX && x <= r.right + padX && y >= r.top - padY && y <= r.bottom + padY) {
        return r
      }
    }
  }

  return null
}

export function MagneticCursor() {
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches)

  useEffect(() => {
    const query = window.matchMedia(FINE_POINTER)
    const sync = () => setEnabled((prev) => prev || query.matches)
    sync()
    query.addEventListener('change', sync)

    // Also enable on hybrid/touch-capable laptops as soon as a real mouse moves.
    const onMouseDetect = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        setEnabled(true)
        window.removeEventListener('pointermove', onMouseDetect)
      }
    }
    window.addEventListener('pointermove', onMouseDetect, { passive: true })

    return () => {
      query.removeEventListener('change', sync)
      window.removeEventListener('pointermove', onMouseDetect)
    }
  }, [])

  return enabled ? <Cursor /> : null
}

function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const binSvgRef = useRef<SVGSVGElement>(null)
  const binPathRef = useRef<SVGPathElement>(null)
  const sysSvgRef = useRef<SVGSVGElement>(null)
  const sysCableRefs = useRef<(SVGRectElement | null)[]>([])
  const sysCombRefs = useRef<(SVGGElement | null)[]>([])

  useEffect(() => {
    const layer = layerRef.current
    const box = boxRef.current
    if (!layer || !box) return

    const root = document.documentElement
    const reduceQuery = window.matchMedia(REDUCED_MOTION)
    const textRange = document.createRange()

    const pointer = { x: 0, y: 0, inside: false, pressed: false, seen: false }
    const cur: Box = { x: -100, y: -100, w: DOT, h: DOT, r: DOT / 2 }
    const vel: Box = { x: 0, y: 0, w: 0, h: 0, r: 0 }
    const drift = { x: 0, y: 0, vx: 0, vy: 0 }

    let mode: Mode = 'dot'
    let target: Element | null = null
    let prevBase: Box | null = null
    let needsJump = true
    let frame = 0
    let lastTime = 0
    let visible = false
    let lastBinKey = ''
    let lastSysKey = ''

    const setVisible = (next: boolean) => {
      if (next === visible) return
      visible = next
      layer.dataset.visible = String(next)
    }

    const applyTarget = (el: Element | null) => {
      if (el === target) return
      target = el
      prevBase = null
      if (el instanceof HTMLElement) {
        const kind = (el.dataset.frame as FrameKind) || 'default'
        box.dataset.frame = kind in FRAME_RADIUS ? kind : 'default'
        const accent = getComputedStyle(el).getPropertyValue('--tb-accent').trim()
        box.style.setProperty('--mc-accent', accent || 'var(--ink)')
      }
    }

    const resolve = () => {
      const hit = document.elementFromPoint(pointer.x, pointer.y)
      if (!hit) return { mode: 'dot' as Mode, el: null, field: false, textHeight: IBEAM_DEFAULT_H }
      if (hit.closest(FIELD_SELECTOR)) return { mode: 'dot' as Mode, el: null, field: true, textHeight: IBEAM_DEFAULT_H }
      const magnetic = hit.closest('[data-magnetic]')
      if (magnetic) return { mode: 'lock' as Mode, el: magnetic, field: false, textHeight: IBEAM_DEFAULT_H }
      const textRect = getTextRectAtPoint(hit, pointer.x, pointer.y, textRange)
      if (textRect) {
        const h = Math.max(16, Math.min(30, Math.round(textRect.height * 0.92)))
        return { mode: 'text' as Mode, el: null, field: false, textHeight: h }
      }
      return { mode: 'dot' as Mode, el: null, field: false, textHeight: IBEAM_DEFAULT_H }
    }

    const step = (time: number) => {
      frame = 0
      if (!pointer.inside) return

      const dt = Math.min((time - lastTime) / 1000 || 1 / 60, 1 / 20)
      lastTime = time
      const reduce = reduceQuery.matches

      const next = resolve()
      mode = next.mode
      applyTarget(next.el)
      setVisible(pointer.seen && !next.field)
      root.classList.toggle('mc-on', pointer.seen && !next.field)

      let base: Box

      if (mode === 'lock' && target && target.isConnected) {
        const rect = target.getBoundingClientRect()
        const c = pointer.pressed ? CLEARANCE_PRESSED : CLEARANCE
        const kind = (box.dataset.frame as FrameKind) || 'default'

        // Symmetric subtle drift so top/bottom and left/right ring margins stay aligned.
        const nx = rect.width ? Math.max(-1, Math.min(1, (pointer.x - (rect.left + rect.width / 2)) / (rect.width / 2))) : 0
        const ny = rect.height ? Math.max(-1, Math.min(1, (pointer.y - (rect.top + rect.height / 2)) / (rect.height / 2))) : 0
        const maxDrift = Math.min(1.2, c * 0.24)
        const wantX = reduce ? 0 : nx * maxDrift
        const wantY = reduce ? 0 : ny * maxDrift
        ;[drift.x, drift.vx] = spring(drift.x, drift.vx, wantX, 24, dt)
        ;[drift.y, drift.vy] = spring(drift.y, drift.vy, wantY, 24, dt)

        base = {
          x: rect.left - c + drift.x,
          y: rect.top - c + drift.y,
          w: rect.width + c * 2,
          h: rect.height + c * 2,
          r: FRAME_RADIUS[kind],
        }

        // Carry the frame rigidly under scroll/layout changes so only the morph springs.
        if (prevBase) {
          cur.x += base.x - prevBase.x
          cur.y += base.y - prevBase.y
        }
        prevBase = base
      } else {
        prevBase = null
        drift.x = drift.y = drift.vx = drift.vy = 0

        if (mode === 'text') {
          const h = next.textHeight
          base = {
            x: pointer.x - IBEAM_W / 2,
            y: pointer.y - h / 2,
            w: IBEAM_W,
            h,
            r: IBEAM_W / 2,
          }
        } else {
          base = {
            x: pointer.x - DOT / 2,
            y: pointer.y - DOT / 2,
            w: DOT,
            h: DOT,
            r: DOT / 2,
          }
        }
      }

      box.dataset.mode = mode

      if (needsJump || reduce) {
        for (const k of CHANNELS) {
          cur[k] = base[k]
          vel[k] = 0
        }
        needsJump = false
      } else {
        const omega = mode === 'lock' ? 52 : 110
        for (const k of CHANNELS) {
          const [v, s] = spring(cur[k], vel[k], base[k], k === 'r' ? 40 : omega, dt)
          cur[k] = v
          vel[k] = s
        }
      }

      box.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`
      box.style.width = `${Math.max(cur.w, 0)}px`
      box.style.height = `${Math.max(cur.h, 0)}px`
      box.style.borderRadius = `${Math.max(cur.r, 0)}px`

      if (mode === 'lock' && box.dataset.frame === 'projects' && binSvgRef.current && binPathRef.current) {
        const w = Math.max(cur.w, 16)
        const h = Math.max(cur.h, 16)
        const inset = 1.4
        const bw = w - inset * 2
        const bh = h - inset * 2
        const r = Math.min(Math.max(cur.r - inset, 4), bw / 2, bh / 2)
        const key = `${w.toFixed(1)}:${h.toFixed(1)}:${r.toFixed(1)}`
        if (key !== lastBinKey) {
          lastBinKey = key
          const svgW = w + BIN_PAD * 2
          const svgH = h + BIN_PAD * 2
          const x0 = BIN_PAD + inset
          const y0 = BIN_PAD + inset
          const x1 = BIN_PAD + w - inset
          const y1 = BIN_PAD + h - inset
          const gapAngle = Math.min(0.26, 2.8 / r)
          const endX = x0 + r - r * Math.sin(gapAngle)
          const endY = y0 + r - r * Math.cos(gapAngle)
          binSvgRef.current.style.width = `${svgW.toFixed(1)}px`
          binSvgRef.current.style.height = `${svgH.toFixed(1)}px`
          binSvgRef.current.setAttribute('viewBox', `0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}`)
          binPathRef.current.setAttribute(
            'd',
            `M ${(x0 + r).toFixed(1)} ${y0.toFixed(1)} H ${(x1 - r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${(y0 + r).toFixed(1)} V ${(y1 - r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x1 - r).toFixed(1)} ${y1.toFixed(1)} H ${(x0 + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x0.toFixed(1)} ${(y1 - r).toFixed(1)} V ${(y0 + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`,
          )
        }
      }

      if (mode === 'lock' && box.dataset.frame === 'systems' && sysSvgRef.current) {
        const w = Math.max(cur.w, 16)
        const h = Math.max(cur.h, 16)
        const key = `${w.toFixed(1)}:${h.toFixed(1)}`
        if (key !== lastSysKey) {
          lastSysKey = key
          const svgW = w + SYS_PAD * 2
          const svgH = h + SYS_PAD * 2
          sysSvgRef.current.style.width = `${svgW.toFixed(1)}px`
          sysSvgRef.current.style.height = `${svgH.toFixed(1)}px`
          sysSvgRef.current.setAttribute('viewBox', `0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}`)
          const { x0, y0, bw, bh, r, combs } = computeCableCombs(w, h)
          SYS_CABLES.forEach((cable, k) => {
            const rect = sysCableRefs.current[k]
            if (!rect) return
            const d = cable.offset
            rect.setAttribute('x', (x0 - d).toFixed(2))
            rect.setAttribute('y', (y0 - d).toFixed(2))
            rect.setAttribute('width', (bw + d * 2).toFixed(2))
            rect.setAttribute('height', (bh + d * 2).toFixed(2))
            rect.setAttribute('rx', Math.max(2, r + d).toFixed(2))
          })
          for (let i = 0; i < SYS_MAX_COMBS; i++) {
            const g = sysCombRefs.current[i]
            if (!g) continue
            const comb = combs[i]
            if (comb) {
              g.style.display = ''
              g.setAttribute('transform', `translate(${comb.x.toFixed(2)} ${comb.y.toFixed(2)}) rotate(${comb.deg})`)
            } else {
              g.style.display = 'none'
            }
          }
        }
      }

      frame = requestAnimationFrame(step)
    }

    const wake = () => {
      if (!frame) {
        lastTime = performance.now()
        frame = requestAnimationFrame(step)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!pointer.inside) needsJump = true
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.inside = true
      pointer.seen = true
      wake()
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pointer.pressed = true
    }
    const onUp = () => {
      pointer.pressed = false
    }

    const leave = () => {
      pointer.inside = false
      pointer.pressed = false
      setVisible(false)
      root.classList.remove('mc-on')
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) leave()
    }

    const onVisibility = () => {
      if (document.hidden) leave()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('blur', leave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      leave()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('blur', leave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div ref={layerRef} className="mc-layer" data-visible="false" aria-hidden="true">
      <div ref={boxRef} className="mc" data-mode="dot" data-frame="default">
        {CORNERS.map((corner) => (
          <i key={`v${corner}`} className={`mc-orn mc-via ${corner}`} />
        ))}
        {CORNERS.map((corner) => (
          <i key={`b${corner}`} className={`mc-orn mc-bracket ${corner}`} />
        ))}
        {CORNERS.map((corner) => (
          <i key={`px${corner}`} className={`mc-orn mc-px ${corner}`} />
        ))}
        <svg ref={binSvgRef} className="mc-orn mc-bin-svg" aria-hidden="true" focusable="false">
          <defs>
            <path ref={binPathRef} id="mc-bin-path" d="M 23 10.5 H 120 A 12.5 12.5 0 0 1 132.5 23 V 30 A 12.5 12.5 0 0 1 120 42.5 H 23 A 12.5 12.5 0 0 1 10.5 30 V 23 A 12.5 12.5 0 0 1 20.3 10.8" />
          </defs>
          <text className="mc-bin-text">
            <textPath href="#mc-bin-path" startOffset="0.5">
              {PROJECTS_BIN_SPANS}
            </textPath>
          </text>
        </svg>
        <i className="mc-orn mc-wl-stripes" />
        <svg className="mc-orn mc-wl-goose" viewBox="0 0 28 18" fill="none" aria-hidden="true" focusable="false">
          <path d="M16 13.4L16.8 17.4M14.7 17.4H17.8M12.6 13.4L11.8 17.4M10.2 17.4H13.3" stroke="#2c303a" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M21.4 11.4L27.1 9.5L25.6 12.2L21.7 13.3Z" fill="#171920" stroke="#474d5c" strokeWidth=".55" strokeLinejoin="round" />
          <path d="M19.2 12.5L24.7 11.6L23.6 13.5L18.4 14Z" fill="#f7f5f0" />
          <path d="M8.5 11.2C8.8 8.6 12.8 7.8 17.6 8.6C21.2 9.2 23.4 10.6 22.8 12.2C21.8 14 16.5 14.5 11.8 14C9.4 13.7 8.3 12.5 8.5 11.2Z" fill="#958b7c" stroke="#2a2d36" strokeWidth=".6" />
          <path d="M12.2 9.4C15.4 8.9 19.6 9.6 21.8 11.3C19.5 12.6 15.2 12.7 12.1 11.6Z" fill="#686054" />
          <path d="M13.5 10.1C16 9.8 18.6 10.2 20.4 11.1" stroke="#c8bfb0" strokeWidth=".65" strokeLinecap="round" />
          <path d="M8.6 10.6C9.6 10.2 10.8 10.6 11.2 11.8C10.4 12.7 9.1 12.5 8.6 11.4Z" fill="#cfc7b8" />
          <g className="mc-wl-goose-head">
            <path d="M4.1 3.5L1.2 4.1L4.0 4.8Z" fill="#2d313d" stroke="#535a6b" strokeWidth=".4" strokeLinejoin="round" />
            <path d="M9.8 11.1C8.8 8.8 8.6 5.6 8.2 3.8C7.9 2.3 6.5 1.8 5.2 2.2C4.1 2.5 3.6 3.5 3.8 4.4C4.1 5.3 5.5 5.6 6.5 5.4C6.8 6.8 6.9 9.4 7.8 11.6Z" fill="#15171e" stroke="#4d5364" strokeWidth=".55" strokeLinejoin="round" />
            <path d="M4.7 3.6C5.2 3.1 6.1 3.3 6.5 4.2C6.0 4.9 5.0 4.9 4.5 4.3Z" fill="#ffffff" />
            <circle cx="4.8" cy="3.1" r=".48" fill="#f5c94d" />
          </g>
        </svg>
        <svg className="mc-orn mc-wl-ring" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
          <polygon points="4.6,1.4 9.4,1.4 12.6,4.6 12.6,9.4 9.4,12.6 4.6,12.6 1.4,9.4 1.4,4.6" fill="#181b22" stroke="#dce2ec" strokeWidth="1.35" strokeLinejoin="bevel" />
          <polygon points="5.4,3.4 8.6,3.4 10.6,5.4 10.6,8.6 8.6,10.6 5.4,10.6 3.4,8.6 3.4,5.4" fill="none" stroke="#8e98aa" strokeWidth=".8" />
          <line x1="4.6" y1="1.4" x2="9.4" y2="1.4" stroke="#f5c94d" strokeWidth="1.35" />
        </svg>
        <svg ref={sysSvgRef} className="mc-orn mc-sys-svg" fill="none" aria-hidden="true" focusable="false">
          <defs>
            {SYS_CABLES.map((cable, k) => (
              <rect
                key={cable.id}
                ref={(el) => {
                  sysCableRefs.current[k] = el
                }}
                id={`mc-sys-cable-${cable.id}`}
              />
            ))}
          </defs>
          {SYS_CABLES.map((cable) => (
            <g key={cable.id}>
              <use href={`#mc-sys-cable-${cable.id}`} stroke={cable.casing} strokeWidth="1.75" />
              <use href={`#mc-sys-cable-${cable.id}`} stroke={cable.jacket} strokeWidth="1.18" />
              <use href={`#mc-sys-cable-${cable.id}`} stroke={cable.sheen} strokeWidth="0.34" opacity="0.34" />
            </g>
          ))}
          {Array.from({ length: SYS_MAX_COMBS }, (_, i) => (
            <g
              key={`comb-${i}`}
              ref={(el) => {
                sysCombRefs.current[i] = el
              }}
            >
              <rect x="-2.95" y="-2.1" width="5.9" height="4.2" rx="0.95" fill="#3b424f" stroke="#0d0f14" strokeWidth="0.7" />
              <line x1="-2.1" y1="-1.15" x2="2.1" y2="-1.15" stroke="#8e98ab" strokeWidth="0.55" strokeLinecap="round" />
              <line x1="-0.75" y1="-1.55" x2="-0.75" y2="1.55" stroke="#151820" strokeWidth="0.55" />
              <line x1="0.75" y1="-1.55" x2="0.75" y2="1.55" stroke="#151820" strokeWidth="0.55" />
              <rect x="2.65" y="-1.25" width="1.15" height="2.5" rx="0.45" fill="#4a5263" stroke="#0d0f14" strokeWidth="0.6" />
              <line x1="3.2" y1="-0.65" x2="3.2" y2="0.65" stroke="#9aa4b8" strokeWidth="0.42" strokeLinecap="round" />
            </g>
          ))}
        </svg>
        <i className="mc-orn mc-ml-ring" />
        <svg className="mc-orn mc-ml-spark" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false">
          <path d="M5 0.5L6.1 3.9L9.5 5L6.1 6.1L5 9.5L3.9 6.1L0.5 5L3.9 3.9Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}
