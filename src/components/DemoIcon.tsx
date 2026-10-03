import { useId, type ReactNode } from 'react'

type IconKind =
  | 'engineering'
  | 'systems'
  | 'machine-learning'
  | 'electronics'
  | 'projects'
  | 'utilities'
  | 'infrastructure'
  | 'research'

/** Keep the final word and its illustration together when a sentence wraps. */
export function IconLabel({ kind, children }: { kind: IconKind; children: ReactNode }) {
  return <span className="intro-icon-label">{children}<DemoIcon kind={kind} /></span>
}

/** Small, hand-drawn hardware objects with bevels and offset faces. */
export function DemoIcon({ kind }: { kind: IconKind }) {
  const id = useId()
  const metal = `url(#${id}-metal)`
  const accent = `url(#${id}-accent)`
  const inset = `url(#${id}-inset)`
  const side = 'var(--icon-side)'
  const edge = 'var(--icon-edge)'

  const drawing = {
    engineering: <>
      <path d="M20 5a7 7 0 0 0-8 8L4 21a3.2 3.2 0 0 0 4.5 4.5l8-8a7 7 0 0 0 8-8l-4.5 4-4-1-1-4Z" fill={side} transform="translate(1 2)" />
      <path d="M20 4a7 7 0 0 0-8 8L4 20a3.2 3.2 0 0 0 4.5 4.5l8-8a7 7 0 0 0 8-8l-4.5 4-4-1-1-4Z" fill={metal} />
      <path d="m8 19 5-5" stroke={edge} opacity=".55" />
      <circle cx="6.5" cy="22" r="1.1" fill={accent} />
      <path d="m17 5-3 3 1 4" stroke="#fff" opacity=".7" />
    </>,
    systems: <>
      <path d="m7 7 5-4 15 3-5 4Z" fill={metal} />
      <path d="m22 10 5-4v18l-5 4Z" fill={side} />
      <path d="m7 7 15 3v18L7 25Z" fill={accent} />
      <path d="m9 10 11 2v3L9 13Zm0 6 11 2v3L9 19Zm0 6 11 2v2L9 24Z" fill={inset} strokeWidth=".7" />
      <path d="m14 12 4 .7m-4 5.3 4 .7m-4 5.3 4 .7" stroke="#d9d2c4" strokeWidth=".8" />
      <path d="M10.5 11.4v.2m0 5.8v.2m0 5.8v.2" stroke="#d9ba6a" strokeWidth="1.8" />
      <path d="m8 8 13 2.5" stroke="#fff" opacity=".45" />
    </>,
    'machine-learning': <>
      <path d="m5 8 6-4 16 4-6 4Z" fill={metal} />
      <path d="m21 12 6-4v15l-6 5Z" fill={side} />
      <path d="m5 8 16 4v16L5 24Z" fill={accent} />
      <path d="m8 12 10 2.5v9L8 21Z" fill={inset} strokeWidth=".8" />
      <path d="m10 15 5 1.2-2 3.3-3-4.5m3 4.5 3 1" stroke="#c6d5be" strokeWidth=".8" />
      <g fill="#e2ca80" strokeWidth=".6">
        <circle cx="10" cy="15" r="1.1" /><circle cx="15" cy="16.2" r="1.1" />
        <circle cx="13" cy="19.5" r="1.1" /><circle cx="16" cy="20.5" r="1.1" />
      </g>
      <path d="m23 13 2-1.5m-2 4 2-1.5m-2 4 2-1.5" opacity=".55" />
    </>,
    electronics: <>
      <path d="m4 13 14-7 11 6v4l-14 8-11-7Z" fill={side} />
      <path d="m4 13 14-8 11 7-14 8Z" fill={accent} />
      <path d="m7 13 7 4 3-2m3-6 6 3-5 3" fill="none" stroke="#d1bc75" strokeWidth=".9" />
      <path d="m11 11 7-4 7 4v4l-7 4-7-4Z" fill={inset} />
      <path d="m11 11 7-4 7 4-7 4Z" fill={metal} />
      <path d="m14 13-2 1m5 1-2 1m5 1-2 1m-3-7 2 1m1-3 2 1m1-3 2 1" stroke="#eadfc5" strokeWidth="1.3" />
      <path d="m16 10 3-1.5 3 1.5-3 1.5Z" fill={inset} strokeWidth=".6" />
      <circle cx="8" cy="13" r=".8" fill="#e6d18f" stroke="none" />
    </>,
    projects: <>
      <path d="M7 9V5h7l3 3h11v15l-5 4H7Z" fill={side} />
      <path d="M4 11V7h8l3 3h9v17H4Z" fill={metal} />
      <path d="M4 13h20l-2 14H2Z" fill={accent} />
      <path d="M5 14h17" stroke="#fff" opacity=".6" />
      <path d="M8 19h9v4H8Z" fill={metal} strokeWidth=".7" />
      <path d="M10 21h5" opacity=".5" />
      <path d="m24 13 4-3v13l-6 4Z" fill={side} />
    </>,
    utilities: <>
      <path d="m4 13 5-4 19 2-4 5Z" fill={metal} />
      <path d="m24 16 4-5v12l-4 5Z" fill={side} />
      <path d="m4 13 20 3v12L4 25Z" fill={accent} />
      <path d="m4 18 20 3" stroke={edge} />
      <path d="M11 10V6l7 1v4" fill="none" strokeWidth="2.1" />
      <path d="m13 18 4 .6v4l-4-.6Z" fill={metal} strokeWidth=".7" />
      <path d="m6 14 16 2.5" stroke="#fff" opacity=".5" />
    </>,
    infrastructure: <>
      <path d="M6 9v7l10 5m10-12v7l-10 5v5" fill="none" stroke={side} strokeWidth="2.5" />
      <path d="M6 8v7l10 5m10-12v7l-10 5v5" fill="none" stroke="#b5ac96" strokeWidth="1.1" />
      <path d="m2 5 4-2 5 2-4 3Z" fill={metal} />
      <path d="m2 5 5 3v5l-5-3Z" fill={accent} /><path d="m7 8 4-3v5l-4 3Z" fill={side} />
      <path d="m21 5 4-2 5 2-4 3Z" fill={metal} />
      <path d="m21 5 5 3v5l-5-3Z" fill={accent} /><path d="m26 8 4-3v5l-4 3Z" fill={side} />
      <path d="m10 23 5-3 7 3-5 4Z" fill={metal} />
      <path d="m10 23 7 4v4l-7-4Z" fill={accent} /><path d="m17 27 5-4v4l-5 4Z" fill={side} />
      <path d="m4 8 1 .6m19-1.1 1 .6m-12 18 2 1" stroke="#eedb9c" strokeWidth="1.4" />
    </>,
    research: <>
      <path d="m6 26 5-3 16 2-4 4H6Z" fill={side} />
      <path d="m6 23 5-3 16 2-4 4H6Z" fill={metal} />
      <path d="M19 23c6-3 5-11 0-14l-3 4c3 2 3 6 0 8Z" fill={accent} />
      <path d="m7 7 4-3 10 11-4 3Z" fill={side} />
      <path d="m7 5 4-3 10 11-4 3Z" fill={metal} />
      <path d="m7 5 4-3 2 2-4 3Z" fill={inset} />
      <path d="m16 16 4-3 2 2-4 3Z" fill={inset} />
      <path d="m8 18 13 1v2L8 20Z" fill={side} />
      <circle cx="21" cy="14" r="2" fill={metal} /><circle cx="21" cy="14" r=".65" fill={inset} stroke="none" />
      <path d="m7 24 14 1.5" stroke="#fff" opacity=".6" />
    </>,
  }[kind]

  return (
    <svg className={`demo-icon demo-icon-${kind}`} viewBox="0 0 32 34" fill="none"
      stroke={edge} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".65" y2="1">
          <stop stopColor="#fff8e9" /><stop offset="1" stopColor="#b9b3a3" />
        </linearGradient>
        <linearGradient id={`${id}-accent`} x1="0" y1="0" x2=".45" y2="1">
          <stop stopColor="var(--icon-light)" /><stop offset="1" stopColor="var(--icon-base)" />
        </linearGradient>
        <linearGradient id={`${id}-inset`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#333f3d" /><stop offset="1" stopColor="#5a6359" />
        </linearGradient>
      </defs>
      {drawing}
    </svg>
  )
}
