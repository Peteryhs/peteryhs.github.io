import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import type { CaseBlock, ChartView, Figure } from '../content/caseStudies'
import { HardNegativeField } from './HardNegativeField'
import { CrowdSecFlow } from './CrowdSecFlow'

/* Visual building blocks for case study pages. They borrow the home page's
   vocabulary: soft bento surfaces, warm stat pills, the dashed IGN badge,
   the About card's "- Bold (muted)" list, the gear dock's line icons, and the
   contact rows' label | divider | items layout. */

const vars = (v: Record<string, string | number>) => v as CSSProperties

/* ---------- small pieces ---------- */

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M17 7H8M17 7V16" />
    </svg>
  )
}

function DeviceIcon({ icon }: { icon: 'laptop' | 'vps' | 'drive' }) {
  const common = {
    className: 'gear-vector-svg cs-device-svg',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const
  const stroke = { stroke: 'currentColor', strokeWidth: 1.55, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  if (icon === 'laptop') {
    return (
      <svg {...common} viewBox="0 0 72 46">
        <g {...stroke}>
          <rect x="14" y="5" width="44" height="29" rx="3" />
          <path d="M6 38.5h60c0 2.5-2 4.5-4.5 4.5h-51C8 43 6 41 6 38.5Z" />
          <path d="M31 38.5h10" opacity="0.6" />
          <path d="M21 13h12M21 18h20M21 23h9" opacity="0.55" />
        </g>
      </svg>
    )
  }
  if (icon === 'vps') {
    return (
      <svg {...common} viewBox="0 0 72 46">
        <g {...stroke}>
          <path d="M22 18a10 10 0 0 1 19.4-3.3A8 8 0 0 1 52 22" />
          <rect x="15" y="22" width="42" height="9" rx="2.5" />
          <rect x="15" y="33" width="42" height="9" rx="2.5" />
          <circle cx="21" cy="26.5" r="1.1" fill="currentColor" />
          <circle cx="21" cy="37.5" r="1.1" fill="currentColor" />
          <path d="M41 26.5h10M41 37.5h10" opacity="0.6" />
        </g>
      </svg>
    )
  }
  return (
    <svg {...common} viewBox="0 0 72 46">
      <g {...stroke}>
        <rect x="16" y="4" width="40" height="38" rx="4" />
        <circle cx="36" cy="20" r="10" />
        <circle cx="36" cy="20" r="2.4" opacity="0.7" />
        <path d="M41 29l6 6" />
        <path d="M22 37h8" opacity="0.6" />
      </g>
    </svg>
  )
}

/* ---------- figures + lightbox ---------- */

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

function withZoomTransition(source: HTMLElement | null, update: () => void, after?: () => void) {
  const doc = document as DocWithVT
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce || !source) {
    update()
    after?.()
    return
  }
  const root = document.documentElement
  root.dataset.vt = 'zoom'
  source.style.viewTransitionName = 'case-zoom'
  const t = doc.startViewTransition(() => {
    source.style.viewTransitionName = ''
    flushSync(update)
    after?.()
  })
  t.finished.finally(() => {
    delete root.dataset.vt
  })
}

export function Lightbox({ figure, onClose }: { figure: Figure; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const big = figure.width > 1900

  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      html.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div
      className={`cs-lightbox ${zoomed ? 'is-zoomed' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={figure.alt}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <button ref={closeRef} type="button" className="cs-lightbox-close" onClick={onClose} aria-label="Close image">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="cs-lightbox-scroll" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          className={`cs-lightbox-img tone-${figure.tone ?? 'light'}`}
          style={{ viewTransitionName: 'case-zoom' }}
          onClick={() => big && setZoomed((z) => !z)}
          data-zoomable={big || undefined}
        />
      </div>
      {figure.caption && <p className="cs-lightbox-caption">{figure.caption}{big && <span> · Click the image to {zoomed ? 'fit it' : 'see full size'}.</span>}</p>}
    </div>,
    document.body,
  )
}

export function FigureView({ figure, className = '' }: { figure: Figure; className?: string }) {
  const [open, setOpen] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const show = () => withZoomTransition(imgRef.current, () => setOpen(true))
  const hide = () => {
    const lightboxImg = document.querySelector<HTMLElement>('.cs-lightbox-img')
    withZoomTransition(
      lightboxImg,
      () => setOpen(false),
      () => {
        if (imgRef.current) {
          imgRef.current.style.viewTransitionName = 'case-zoom'
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (imgRef.current) imgRef.current.style.viewTransitionName = ''
          }))
        }
      },
    )
    imgRef.current?.closest('button')?.focus({ preventScroll: true })
  }

  return (
    <figure className={`cs-figure ${figure.size ? `is-${figure.size}` : ''} ${className}`}>
      <button type="button" className={`cs-figure-frame tone-${figure.tone ?? 'light'}`} onClick={show} aria-label={`Enlarge: ${figure.alt}`}>
        <img
          ref={imgRef}
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          loading="lazy"
          decoding="async"
          style={open ? { visibility: 'hidden' } : undefined}
        />
        <span className="cs-figure-zoom" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        </span>
      </button>
      {figure.caption && <figcaption className="cs-figure-caption">{figure.caption}</figcaption>}
      {open && <Lightbox figure={figure} onClose={hide} />}
    </figure>
  )
}

function FigureTabs({ items }: { items: (Figure & { label: string })[] }) {
  const [active, setActive] = useState(0)
  const ratio = Math.max(...items.map((f) => f.height / f.width))
  return (
    <div className="cs-figtabs">
      <div className="cs-figtabs-bar" role="tablist" aria-label="Result charts">
        {items.map((f, i) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`cs-figtab ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="cs-figtabs-stage" style={vars({ '--ratio': ratio })}>
        {items.map((f, i) => (
          <div key={f.label} className={`cs-figtabs-panel ${i === active ? 'is-active' : ''}`} role="tabpanel" aria-hidden={i !== active}>
            <FigureView figure={f} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- blocks ---------- */

function Timeline({ items }: { items: { when: string; title: string; text?: string }[] }) {
  const lastReal = items.reduce((acc, item, i) => (/^\d/.test(item.when) ? i : acc), -1)
  return (
    <ol className="cs-timeline">
      {items.map((item, i) => {
        const state = i < lastReal ? 'past' : i === lastReal ? 'now' : 'next'
        return (
          <li key={item.when + item.title} className={`cs-timeline-item is-${state}`} style={vars({ '--i': i })}>
            <span className="cs-timeline-when">{item.when}</span>
            <span className="cs-timeline-dot" aria-hidden="true" />
            <div className="cs-timeline-body">
              <span className="cs-timeline-title">{item.title}</span>
              {item.text && <span className="cs-timeline-text">{item.text}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Hardware({ items }: Extract<CaseBlock, { kind: 'hardware' }>) {
  return (
    <table className="cs-split cs-hw-table">
      <thead>
        <tr>
          <th scope="col">Machine</th>
          <th scope="col">Role</th>
          <th scope="col">Specs</th>
        </tr>
      </thead>
      <tbody>
        {items.map((d) => (
          <tr key={d.name}>
            <td>
              <span className="cs-hw-name">
                <DeviceIcon icon={d.icon} />
                {d.name}
              </span>
            </td>
            <td className="cs-hw-role">{d.role}</td>
            <td className="cs-hw-specs">{d.specs.join(' · ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Services({ hosts, items }: Extract<CaseBlock, { kind: 'services' }>) {
  const filters = [['all', 'All'], ...Object.entries(hosts), ['inhouse', 'Built in-house']] as const
  const [filter, setFilter] = useState<string>('all')
  const visible = (s: (typeof items)[number]) =>
    filter === 'all' || (filter === 'inhouse' ? s.inHouse : s.host === filter)
  const count = (key: string) => items.filter((s) => key === 'all' || (key === 'inhouse' ? s.inHouse : s.host === key)).length

  return (
    <div className="cs-services">
      <div className="cs-figtabs-bar" role="group" aria-label="Filter services">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`cs-figtab ${filter === key ? 'is-active' : ''}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="cs-figtab-count">{count(key)}</span>
          </button>
        ))}
      </div>
      <ul className="cs-service-list">
        {items.map((s) => {
          const name = s.href ? (
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="cs-service-link">
              {s.name}
              <Arrow className="cs-service-arrow" />
            </a>
          ) : (
            s.name
          )
          return (
            <li key={s.name} className={`cs-service ${visible(s) ? '' : 'is-dimmed'}`}>
              <span className="bento-focus-bullet" aria-hidden="true">-</span>
              <span className="cs-service-text">
                <span className="bento-focus-name">{name}</span>{' '}
                <span className="bento-focus-desc">({s.text})</span>
              </span>
              <span className="cs-service-tags">
                {s.inHouse && <span className="cs-badge-dashed">in-house</span>}
                <span className={`cs-host cs-host-${s.host}`}>
                  <span className="cs-host-dot" aria-hidden="true" />
                  {hosts[s.host]}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Routes({ items }: Extract<CaseBlock, { kind: 'routes' }>) {
  return (
    <div className="cs-routes">
      {items.map((r, ri) => (
        <div key={r.tag} className="cs-route" style={vars({ '--i': ri })}>
          <div className="cs-route-head">
            <span className="cs-route-title">{r.title}</span>
            <span className="cs-route-note">{r.note}</span>
          </div>
          <div className="cs-route-flow">
            {r.nodes.map((n, i) => (
              <FlowNode key={n.label + i} node={n} link={i < r.nodes.length - 1 ? r.links[i] ?? '' : null} last={i === r.nodes.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FlowNode({ node, link, last }: { node: { label: string; detail?: string }; link: string | null; last: boolean }) {
  return (
    <>
      <span className={`cs-route-node ${last ? 'is-dest' : ''}`}>
        <span className="cs-route-node-label">{node.label}</span>
        {node.detail && <span className="cs-route-node-detail">{node.detail}</span>}
      </span>
      {link !== null && (
        <span className="cs-route-link">
          {link && <span className="cs-route-link-label">{link}</span>}
        </span>
      )}
    </>
  )
}

function Steps({ items, loop }: Extract<CaseBlock, { kind: 'steps' }>) {
  return (
    <div className={`cs-steps ${loop ? 'has-loop' : ''}`} style={vars({ '--n': items.length })}>
      <ol className="cs-steps-row">
        {items.map((s, i) => (
          <li key={s.title} className="cs-step" style={vars({ '--i': i })}>
            <span className="cs-step-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="cs-step-title">{s.title}</span>
            <span className="cs-step-text">{s.text}</span>
            {s.file && <span className="cs-badge-dashed cs-step-file">{s.file}</span>}
          </li>
        ))}
      </ol>
      {loop && (
        <div className="cs-steps-loop" aria-label={loop}>
          <svg className="cs-steps-loop-path" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M100 0 V14 Q100 24 92 24 H8 Q0 24 0 14 V3" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg className="cs-steps-loop-head" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 8 L6 3 L10 8" />
          </svg>
          <span className="cs-steps-loop-label">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            {loop}
          </span>
        </div>
      )}
    </div>
  )
}

function Split({ groups }: Extract<CaseBlock, { kind: 'split' }>) {
  const depth = Math.max(...groups.map((g) => g.items.length))
  return (
    <table className="cs-split">
      <thead>
        <tr>
          {groups.map((g) => (
            <th key={g.label} scope="col">{g.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: depth }, (_, r) => (
          <tr key={r}>
            {groups.map((g) => (
              <td key={g.label}>{g.items[r] ?? ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Metrics({ items }: Extract<CaseBlock, { kind: 'metrics' }>) {
  return (
    <div className="cs-metrics">
      {items.map((m, i) => (
        <div key={m.label} className="cs-metric" style={vars({ '--i': i, '--f': m.fraction })}>
          <span className="cs-metric-value">{m.display}</span>
          <span className="cs-metric-meter" aria-hidden="true"><span /></span>
          <span className="cs-metric-label">{m.label}</span>
          {m.note && <span className="cs-metric-note">{m.note}</span>}
        </div>
      ))}
    </div>
  )
}

function BranchIcon({ icon }: { icon: 'code' | 'image' | 'search' }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg className="cs-router-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {icon === 'code' && (
        <g {...p}>
          <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.2 5.5l-2.4 13" />
        </g>
      )}
      {icon === 'image' && (
        <g {...p}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M20.5 15.5l-4.6-4.6L6 19.5" />
        </g>
      )}
      {icon === 'search' && (
        <g {...p}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M15 15l5 5" />
        </g>
      )}
    </svg>
  )
}

function Router({ stages, branches }: Extract<CaseBlock, { kind: 'router' }>) {
  const n = branches.length
  // Inner columns (not the two ends, which the bus's own sides draw) get a drop wire.
  const inner = branches.slice(1, -1).map((_, k) => k + 1)
  return (
    <div className="cs-router" style={vars({ '--n': n })}>
      <ol className="cs-router-stages">
        {stages.map((s, i) => (
          <li key={s.label} className="cs-router-stage" style={vars({ '--i': i })}>
            {i > 0 && <span className="cs-wire" aria-hidden="true" />}
            <span className="cs-router-node">{s.label}</span>
            {s.note && <span className="cs-router-note">{s.note}</span>}
          </li>
        ))}
      </ol>
      <div className="cs-router-fork" aria-hidden="true">
        <span className="cs-wire cs-router-stem" />
        <span className="cs-router-bus" />
        {inner.map((k) => (
          <span key={k} className="cs-wire cs-router-drop" style={vars({ '--k': k })} />
        ))}
      </div>
      <ul className="cs-router-branches">
        {branches.map((b, i) => (
          <li key={b.name} className="cs-router-branch" style={vars({ '--i': i })}>
            <BranchIcon icon={b.icon} />
            <span className="cs-router-branch-name">{b.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, seen] as const
}

function useCountUp(target: number, active: boolean, delay = 0, duration = 1300) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf = 0
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t + delay
      const p = Math.min(1, Math.max(0, (t - start) / duration))
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, delay, duration])
  return value
}

const fmt = (n: number) => n.toLocaleString('en-US')

function CounterPart({ part, total, index, active }: { part: { value: number; label: string; href?: string }; total: number; index: number; active: boolean }) {
  const v = useCountUp(part.value, active, 250 + index * 120)
  const label = part.href ? (
    <a href={part.href} target="_blank" rel="noopener noreferrer" className="cs-service-link">
      {part.label}
      <Arrow className="cs-service-arrow" />
    </a>
  ) : (
    part.label
  )
  return (
    <li className={`cs-counter-part is-${index === 0 ? 'a' : 'b'}`}>
      <span className="cs-host-dot" aria-hidden="true" />
      <span className="cs-counter-part-label">{label}</span>
      <span className="cs-counter-part-value">{fmt(v)}</span>
      <span className="cs-counter-part-share">{Math.round((part.value / total) * 100)}%</span>
    </li>
  )
}

function Counters({ total, parts, releases }: Extract<CaseBlock, { kind: 'counters' }>) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const t = useCountUp(total.value, seen)
  const r = useCountUp(releases.value, seen, 500, 900)
  const sum = parts.reduce((acc, p) => acc + p.value, 0)
  return (
    <div ref={ref} className={`cs-counters ${seen ? 'is-on' : ''}`}>
      <div className="cs-counter-total">
        <span className="cs-counter-big" aria-label={fmt(total.value)}>{fmt(t)}</span>
        <span className="cs-counter-label">{total.label}</span>
      </div>

      <div className="cs-counter-split">
        <div className="cs-counter-bar" aria-hidden="true">
          {parts.map((p, i) => (
            <span
              key={p.label}
              className={`cs-counter-seg is-${i === 0 ? 'a' : 'b'}`}
              style={vars({ '--w': `${(p.value / sum) * 100}%`, '--i': i })}
            />
          ))}
        </div>
        <ul className="cs-counter-parts">
          {parts.map((p, i) => (
            <CounterPart key={p.label} part={p} total={sum} index={i} active={seen} />
          ))}
        </ul>
      </div>

      <div className="cs-counter-releases">
        <span className="cs-counter-big is-small" aria-label={String(releases.value)}>{r}</span>
        <span className="cs-counter-label">{releases.label}</span>
        <span className="cs-counter-pips" aria-hidden="true">
          {Array.from({ length: releases.value }, (_, i) => (
            <span key={i} className={i < r ? 'is-lit' : ''} />
          ))}
        </span>
      </div>
    </div>
  )
}

function Rows({ items }: Extract<CaseBlock, { kind: 'rows' }>) {
  return (
    <ul className="cs-rows">
      {items.map((r) => (
        <li key={r.href}>
          <a className="cs-row" href={r.href} target="_blank" rel="noopener noreferrer">
            <span className="cs-row-tag">{r.tag}</span>
            <span className="cs-row-divider" aria-hidden="true" />
            <span className="cs-row-title">{r.title}</span>
            <span className="cs-row-meta">
              {r.meta}
              <Arrow />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

const pct = (v: number, d = 1) => `${v.toFixed(d)}%`

function ChartRows({ view, on }: { view: ChartView; on: boolean }) {
  if (view.mode === 'stack') {
    return (
      <div className="cs-chart-rows is-stack">
        {view.rows.map((row) => {
          const total = row.values.reduce((a, b) => a + b, 0)
          return (
            <div key={`${view.label}-${row.label}`} className="cs-chart-row">
              <span className="cs-chart-label">
                {row.label}
                <span className="cs-chart-sub">{total.toLocaleString('en-US')}</span>
              </span>
              <div className="cs-chart-stack">
                {row.values.map((v, j) => (
                  <span
                    key={j}
                    className={`cs-chart-seg tone-${view.series[j].tone}`}
                    style={vars({ '--w': on ? v / total : 0 })}
                  >
                    <span className="cs-chart-seg-val">{v.toLocaleString('en-US')}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div className="cs-chart-rows">
      {view.rows.map((row, i) => (
        <div key={i} className="cs-chart-row">
          <span className="cs-chart-label">
            {row.label}
            {row.lowerBetter && <span className="cs-chart-flag">lower is better</span>}
          </span>
          <div className="cs-chart-bars">
            {row.values.map((v, j) => (
              <div key={j} className={`cs-chart-line tone-${view.series[j].tone} ${row.lowerBetter ? 'is-lower' : ''}`}>
                <span className="cs-chart-bar" style={vars({ '--w': on ? v / 100 : 0 })} />
                <span className="cs-chart-val">{pct(v, row.decimals)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsChart({ views }: { views: ChartView[] }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const view = views[active]
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length
    setActive(next)
    tabs.current[next]?.focus()
  }
  return (
    <div ref={ref} className={`cs-chart ${seen ? 'is-on' : ''}`}>
      <div className="cs-chart-head">
        <div className="cs-figtabs-bar" role="tablist" aria-label="Results" onKeyDown={onKey}>
          {views.map((v, i) => (
            <button
              key={v.label}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className={`cs-figtab ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view.series.length > 1 && (
          <div className="cs-chart-legend" aria-hidden="true">
            {view.series.map((s) => (
              <span key={s.name} className={`tone-${s.tone}`}>{s.name}</span>
            ))}
          </div>
        )}
      </div>
      <p className="cs-chart-note" role="tabpanel" aria-live="polite">{view.note}</p>
      <ChartRows view={view} on={seen} />
      {view.mode === 'bars' && (
        <div className="cs-chart-axis" aria-hidden="true">
          <span />
          <div>
            {[0, 25, 50, 75, 100].map((t) => (
              <span key={t} style={vars({ '--t': t / 100 })}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CaseBlockView({ block }: { block: CaseBlock }): ReactNode {
  switch (block.kind) {
    case 'text':
      return block.paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="case-paragraph">
          {p}
        </p>
      ))
    case 'list':
      return (
        <div className="bento-focus-list cs-list">
          {block.items.map((item) => (
            <div key={item.title} className="bento-focus-row">
              <span className="bento-focus-bullet">-</span>
              <div className="bento-focus-text">
                <span className="bento-focus-name">{item.title}</span>{' '}
                <span className="bento-focus-desc">({item.text})</span>
              </div>
            </div>
          ))}
        </div>
      )
    case 'timeline':
      return <Timeline items={block.items} />
    case 'hardware':
      return <Hardware {...block} />
    case 'services':
      return <Services {...block} />
    case 'routes':
      return <Routes {...block} />
    case 'steps':
      return <Steps {...block} />
    case 'split':
      return <Split {...block} />
    case 'metrics':
      return <Metrics {...block} />
    case 'router':
      return <Router {...block} />
    case 'figure':
      return <FigureView figure={block.figure} />
    case 'figureTabs':
      return <FigureTabs items={block.items} />
    case 'rows':
      return <Rows {...block} />
    case 'counters':
      return <Counters {...block} />
    case 'hardNegatives':
      return <HardNegativeField caption={block.caption} className="is-inline" />
    case 'chart':
      return <ResultsChart views={block.views} />
    case 'crowdsec':
      return <CrowdSecFlow />
  }
}
