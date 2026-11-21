import { useId, type CSSProperties } from 'react'
import './category-icons.css'

export const ICON_CATEGORIES = [
  { kind: 'engineering', label: 'Computer engineering' },
  { kind: 'infrastructure', label: 'WATonomous' },
  { kind: 'hackathon', label: 'Hack the Ridge' },
  { kind: 'systems', label: 'Distributed systems' },
  { kind: 'machine-learning', label: 'Machine learning' },
  { kind: 'electronics', label: 'Electronics' },
  { kind: 'projects', label: 'Projects' },
  { kind: 'minecraft', label: 'Minecraft' },
  { kind: 'photography', label: 'Photography' },
  { kind: 'utilities', label: 'Utilities' },
  { kind: 'research', label: 'Research' },
] as const

export type IconKind = typeof ICON_CATEGORIES[number]['kind']

const ink = 'var(--ci-ink)'
const paper = 'var(--ci-paper)'
const c = 'var(--ci-color)'
const shade = 'var(--ci-shade)'
const pop = 'var(--ci-pop)'

const Spark = ({ x, y }: { x: number; y: number }) => (
  <path d={'M' + x + ' ' + (y - 4.5) + 'v9M' + (x - 4.5) + ' ' + y + 'h9'} stroke={ink} strokeWidth="2" />
)

function WorkshopArtwork({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'engineering':
      return (
        <>
          <path d="m14 45 17-17a13 13 0 0 1 17-16l-8 8 6 6 8-8a13 13 0 0 1-16 17L21 52a5 5 0 0 1-7-7Z" fill={shade} transform="translate(2 3)" />
          <path d="m14 45 17-17a13 13 0 0 1 17-16l-8 8 6 6 8-8a13 13 0 0 1-16 17L21 52a5 5 0 0 1-7-7Z" fill={c} />
          <circle cx="18" cy="48" r="2.2" fill={paper} /><path d="m24 41 11-11" stroke={paper} strokeWidth="2.1" />
        </>
      )
    case 'systems':
      return (
        <>
          <path d="M46 11h6v42l-6 4V11Z" fill={shade} /><rect x="12" y="10" width="35" height="45" rx="4" fill={c} />
          {[16, 28, 40].map(y => (
            <g key={y}>
              <rect x="17" y={y} width="25" height="8" rx="2" fill={paper} />
              <circle cx="22" cy={y + 4} r="1.5" fill={y === 16 ? pop : shade} stroke="none" />
              <path d={'M27 ' + (y + 4) + 'h10'} strokeWidth="2" />
            </g>
          ))}
        </>
      )
    case 'machine-learning':
      return (
        <>
          <path d="M32 16v-6" /><circle cx="32" cy="8" r="3.4" fill={pop} />
          <rect x="11" y="18" width="44" height="34" rx="10" fill={shade} transform="translate(0 3)" />
          <rect x="11" y="17" width="44" height="33" rx="10" fill={c} />
          <rect x="18" y="23" width="30" height="16" rx="5" fill={ink} />
          <path d="m24 32 3-3 3 3m6 0 3-3 3 3" stroke={paper} strokeWidth="2.3" />
          <path d="M26 44h12" stroke={paper} strokeWidth="2.2" /><Spark x={56} y={13} />
        </>
      )
    case 'electronics':
      return (
        <>
          {[19, 32, 45].map(v => <path key={v} d={'M' + v + ' 7v7M' + v + ' 50v7M7 ' + v + 'h7M50 ' + v + 'h7'} />)}
          <rect x="14" y="14" width="36" height="36" rx="5" fill={c} /><rect x="20" y="20" width="24" height="24" rx="2" fill={shade} />
          <rect x="23" y="23" width="18" height="18" rx="2" fill={paper} />
          <path d="M33 25 28 33h5l-2 7 6-9h-5Z" fill={pop} strokeWidth="1.9" />
        </>
      )
    case 'projects':
      return (
        <>
          <path d="M10 19h17l4 5h23v28H10Z" fill={shade} />
          <rect x="16" y="14" width="32" height="15" rx="2" fill={paper} /><path d="M22 20h15" strokeWidth="2" />
          <path d="M9 26h46l-3 26H12Z" fill={c} /><rect x="25" y="34" width="14" height="7" rx="2" fill={paper} /><Spark x={54} y={14} />
        </>
      )
    case 'utilities':
      return (
        <>
          <path d="M23 21v-5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v5" fill="none" strokeWidth="3.2" />
          <rect x="10" y="21" width="44" height="31" rx="6" fill={shade} transform="translate(0 2)" />
          <rect x="10" y="21" width="44" height="30" rx="6" fill={c} /><path d="M10 34h44" />
          <rect x="28" y="30" width="8" height="9" rx="2" fill={paper} /><circle cx="32" cy="35" r="1.4" fill={ink} stroke="none" />
        </>
      )
    case 'infrastructure':
      return (
        <>
          <path d="M32 39v9M19 44h26M19 44v4M45 44v4" />
          {[15, 28, 41].map(x => <rect key={x} x={x} y="48" width="8" height="7" rx="2" fill={paper} />)}
          <path d="M17 39h30a9 9 0 0 0 1-18 14 14 0 0 0-27-3 10 10 0 0 0-4 21Z" fill={shade} transform="translate(0 2)" />
          <path d="M17 39h30a9 9 0 0 0 1-18 14 14 0 0 0-27-3 10 10 0 0 0-4 21Z" fill={c} />
          <path d="M33 21 28 28h5l-2 6 6-8h-5Z" fill={pop} strokeWidth="1.8" />
        </>
      )
    case 'research':
      return (
        <>
          <path d="M24 12h16M27 12v13L14 48a5 5 0 0 0 4 7h28a5 5 0 0 0 4-7L37 25V12" fill={paper} />
          <path d="M19 39h26l5 9a5 5 0 0 1-4 7H18a5 5 0 0 1-4-7Z" fill={c} />
          <circle cx="28" cy="46" r="2.2" fill={paper} /><circle cx="38" cy="43" r="1.8" fill={pop} stroke="none" /><Spark x={50} y={17} />
        </>
      )
    case 'minecraft':
      return (
        <>
          <path d="M32 32v23L11 44V21Z" fill={shade} /><path d="M32 32v23l21-11V21Z" fill={pop} />
          <path d="m32 10 21 11-21 11-21-11Z" fill={c} />
          <path d="M11 21v8l6 3v-3l5 3v4l5 2v-4l5 2v-4l-21-11Z" fill={c} />
          <path d="M53 21v7l-6 3v4l-5 2v-3l-5 3v-4l-5 3v-4l21-11Z" fill={c} />
        </>
      )
    case 'photography':
      return (
        <>
          <path d="M21 20 25 14h14l4 6Z" fill={shade} />
          <rect x="9" y="20" width="46" height="32" rx="7" fill={shade} transform="translate(0 2)" />
          <rect x="9" y="20" width="46" height="31" rx="7" fill={c} />
          <rect x="14" y="16" width="8" height="4" rx="1.5" fill={pop} />
          <circle cx="33" cy="36" r="11" fill={paper} /><circle cx="33" cy="36" r="6.5" fill={ink} />
          <circle cx="30.5" cy="33.5" r="2" fill={paper} stroke="none" /><circle cx="48" cy="27" r="2" fill={pop} stroke="none" />
        </>
      )
    case 'hackathon':
      return (
        <>
          <path d="M11 48 25 22l12 26Z" fill={shade} /><path d="M24 48 39 18l15 30Z" fill={c} />
          <path d="m39 18 5 10-5-2-5 2Z" fill={paper} />
          <rect x="17" y="34" width="30" height="15" rx="3" fill={paper} />
          <path d="m25 39-3 2.5 3 2.5m14-5 3 2.5-3 2.5m-6-6-2 7" strokeWidth="2.1" /><Spark x={52} y={14} />
        </>
      )
  }
}

export interface CategoryIconProps {
  kind: IconKind
  size?: number | string
  /** Omit beside a visible label; supply when the illustration stands alone. */
  title?: string
  className?: string
}

export function CategoryIcon({ kind, size, title, className = '' }: CategoryIconProps) {
  const titleId = useId()
  const style: CSSProperties | undefined =
    size === undefined ? undefined : { width: size, height: size }

  return (
    <svg
      className={'category-icon category-icon-' + kind + (className ? ' ' + className : '')}
      viewBox="0 0 64 64"
      fill="none"
      stroke={ink}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      focusable="false"
    >
      {title && <title id={titleId}>{title}</title>}
      <WorkshopArtwork kind={kind} />
    </svg>
  )
}
