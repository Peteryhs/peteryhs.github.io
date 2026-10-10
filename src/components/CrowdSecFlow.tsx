import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The blind-proxy route with CrowdSec wired in. A loop plays while on screen:
 * a normal request passes, an attacker's first probe reaches Caddy and lands
 * in the logs, CrowdSec bans the IP over Tailscale, and the bouncer on the VPS
 * drops the next attempt while normal traffic keeps flowing.
 */

type NodeId = 'web' | 'vps' | 'caddy' | 'svc' | 'agent' | 'lapi'
type Pt = { x: number; y: number }

const NODES: { id: NodeId; label: string; detail?: string }[] = [
  { id: 'web', label: 'Public web' },
  { id: 'vps', label: 'VPS', detail: 'blind proxy + bouncer' },
  { id: 'caddy', label: 'Caddy on Casa', detail: 'writes access logs' },
  { id: 'svc', label: 'Immich · Nextcloud' },
  { id: 'lapi', label: 'CrowdSec LAPI', detail: 'shares decisions' },
  { id: 'agent', label: 'CrowdSec agent', detail: 'reads the logs' },
]

type Phase = 'idle' | 'pass' | 'probe' | 'hit' | 'ban' | 'blocked' | 'pass2'

const STATUS: Record<Phase, string> = {
  idle: 'Normal traffic flows straight through to Casa.',
  pass: 'A normal request passes straight through to Casa.',
  probe: 'An attacker\u2019s first probe gets through the proxy\u2026',
  hit: '\u2026and lands in Caddy\u2019s access logs.',
  ban: 'CrowdSec flags the IP and shares a ban over Tailscale.',
  blocked: 'The bouncer drops the attacker\u2019s next request at the VPS.',
  pass2: 'Normal traffic keeps flowing while the attacker stays banned.',
}

// Timeline (ms) of one loop.
const T = {
  pass: [0, 1900],
  probe: [2300, 3800],
  ban: [4300, 6300],
  block: [6800, 7800],
  pass2: [8900, 10800],
  end: 11800,
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

function along(points: Pt[], f: number): Pt {
  const segs = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
  const total = segs.reduce((a, b) => a + b, 0)
  let d = Math.max(0, Math.min(1, f)) * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const t = segs[i] ? Math.min(1, d / segs[i]) : 0
      return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t }
    }
    d -= segs[i]
  }
  return points[points.length - 1]
}

export function CrowdSecFlow() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Partial<Record<NodeId, HTMLDivElement | null>>>({})
  const blueRef = useRef<SVGCircleElement>(null)
  const redRef = useRef<SVGCircleElement>(null)
  const banRef = useRef<SVGCircleElement>(null)
  const [geo, setGeo] = useState<{ w: number; h: number; c: Record<NodeId, Pt>; gate: Pt } | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')

  // Measure node centres; every connector is drawn between them.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const box = wrap.getBoundingClientRect()
      const c = {} as Record<NodeId, Pt>
      const rects = {} as Record<NodeId, DOMRect>
      for (const n of NODES) {
        const el = nodeRefs.current[n.id]
        if (!el) return
        const r = el.getBoundingClientRect()
        rects[n.id] = r
        c[n.id] = { x: Math.round(r.left - box.left + r.width / 2), y: Math.round(r.top - box.top + r.height / 2) }
      }
      // Where a banned request stops: just outside the VPS, facing the web.
      const dx = c.vps.x - c.web.x
      const dy = c.vps.y - c.web.y
      const horizontal = Math.abs(dx) > Math.abs(dy)
      const gate = horizontal
        ? { x: c.vps.x - Math.sign(dx) * (rects.vps.width / 2 + 9), y: c.vps.y }
        : { x: c.vps.x, y: c.vps.y - Math.sign(dy) * (rects.vps.height / 2 + 9) }
      setGeo({ w: box.width, h: box.height, c, gate })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !geo) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('blocked')
      return
    }
    const { c, gate } = geo
    const main = [c.web, c.vps, c.caddy, c.svc]
    const probe = [c.web, c.vps, c.caddy]
    const loop = [c.caddy, c.agent, c.lapi, c.vps]
    const attempt = [c.web, gate]

    const R = new Map<SVGCircleElement, number>()
    // f is the eased progress along the path; the last stretch tucks the dot
    // under the box it reaches, shrinking it as it goes.
    const put = (el: SVGCircleElement | null, p: Pt | null, f = 0, tuck = true) => {
      if (!el) return
      if (!R.has(el)) R.set(el, Number(el.getAttribute('r')) || 5)
      if (!p) {
        el.style.opacity = '0'
        return
      }
      const k = tuck ? Math.min(1, Math.max(0, (1 - f) / 0.12)) : 1
      el.setAttribute('cx', String(p.x))
      el.setAttribute('cy', String(p.y))
      el.setAttribute('r', String(R.get(el)! * (0.35 + 0.65 * k)))
      el.style.opacity = String(0.25 + 0.75 * k)
    }
    let hitNode: NodeId | null = null
    const pulse = (id: NodeId | null) => {
      if (id === hitNode) return
      const prev = hitNode ? nodeRefs.current[hitNode] : null
      if (prev) delete prev.dataset.hit
      hitNode = id
      const next = id ? nodeRefs.current[id] : null
      if (next) next.dataset.hit = ''
    }
    const span = (t: number, [a, b]: number[]) => (t >= a && t <= b ? ease((t - a) / (b - a)) : null)

    let raf = 0
    let start = 0
    let visible = false
    let last: Phase = 'idle'
    const tick = (now: number) => {
      if (!start) start = now
      const t = (now - start) % T.end
      const fPass = span(t, T.pass)
      const fPass2 = span(t, T.pass2)
      const fProbe = span(t, T.probe)
      const fBan = span(t, T.ban)
      const fBlock = span(t, T.block)

      const fBlue = fPass ?? fPass2
      put(blueRef.current, fBlue !== null ? along(main, fBlue) : null, fBlue ?? 0)
      put(
        redRef.current,
        fProbe !== null ? along(probe, fProbe) : fBlock !== null ? along(attempt, fBlock) : null,
        fProbe ?? 0,
        fProbe !== null,
      )
      put(banRef.current, fBan !== null ? along(loop, fBan) : null, fBan ?? 0)
      pulse(
        fBlue !== null && fBlue > 0.94 ? 'svc'
        : fProbe !== null && fProbe > 0.94 ? 'caddy'
        : fBan !== null && fBan > 0.94 ? 'vps'
        : null,
      )

      const p: Phase =
        t < T.pass[1] + 200 ? 'pass'
        : t < T.probe[0] ? 'pass'
        : t < T.probe[1] ? 'probe'
        : t < T.ban[0] ? 'hit'
        : t < T.ban[1] ? 'ban'
        : t < T.pass2[0] ? 'blocked'
        : 'pass2'
      if (p !== last) {
        last = p
        setPhase(p)
      }
      raf = visible ? requestAnimationFrame(tick) : 0
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        start = 0
        raf = requestAnimationFrame(tick)
      }
    })
    io.observe(wrap)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      pulse(null)
    }
  }, [geo])

  const banned = phase === 'blocked' || phase === 'pass2'
  const cls = (id: NodeId) => {
    const on =
      (id === 'svc' && (phase === 'pass' || phase === 'pass2')) ||
      (id === 'caddy' && phase === 'hit') ||
      ((id === 'agent' || id === 'lapi') && phase === 'ban')
    return `cs-guard-node is-${id} ${on ? 'is-on' : ''} ${id === 'vps' && banned ? 'is-armed' : ''} ${id === 'vps' && phase === 'blocked' ? 'is-blocking' : ''}`
  }

  const seg = (a: Pt, b: Pt, k: string, className = '') => (
    <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={className} />
  )

  return (
    <figure className="cs-guard">
      <div className="cs-guard-legend" aria-hidden="true">
        <span className="is-good">Normal request</span>
        <span className="is-bad">Attacker</span>
        <span className="is-ban">Ban decision</span>
      </div>
      <div ref={wrapRef} className="cs-guard-stage" role="img" aria-label="Requests reach Immich and Nextcloud through the VPS blind proxy and Caddy on Casa. CrowdSec reads Caddy's logs, and its LAPI pushes bans over Tailscale to a bouncer on the VPS that drops attackers before they reach Casa.">
        {geo && (
          <svg className="cs-guard-svg" width={geo.w} height={geo.h} aria-hidden="true">
            <g className="cs-guard-wires">
              {seg(geo.c.web, geo.c.vps, 'a')}
              {seg(geo.c.vps, geo.c.caddy, 'b')}
              {seg(geo.c.caddy, geo.c.svc, 'c')}
            </g>
            <g className="cs-guard-wires is-loop">
              {seg(geo.c.caddy, geo.c.agent, 'd')}
              {seg(geo.c.agent, geo.c.lapi, 'e')}
              {seg(geo.c.lapi, geo.c.vps, 'f')}
            </g>
            {phase === 'blocked' && (
              <g className="cs-guard-x" transform={`translate(${geo.gate.x} ${geo.gate.y})`}>
                <circle r="11" />
                <path d="M-4 -4L4 4M4 -4L-4 4" />
              </g>
            )}
            <circle ref={banRef} className="cs-guard-dot is-ban" r="5" />
            <circle ref={blueRef} className="cs-guard-dot is-good" r="5.5" />
            <circle ref={redRef} className="cs-guard-dot is-bad" r="5.5" />
          </svg>
        )}
        {NODES.map((n) => (
          <div
            key={n.id}
            ref={(el) => {
              nodeRefs.current[n.id] = el
            }}
            className={cls(n.id)}
          >
            <span className="cs-guard-label">{n.label}</span>
            {n.detail && <span className="cs-guard-detail">{n.detail}</span>}
            {n.id === 'vps' && <span className="cs-guard-badge">IP banned</span>}
          </div>
        ))}
      </div>
      <figcaption className="cs-guard-status" aria-hidden="true">
        <span key={phase}>{STATUS[phase]}</span>
      </figcaption>
    </figure>
  )
}
