import { useId, type CSSProperties } from 'react'
import './category-icons.css'

/** The category vocabulary is shared by inline labels, cards and the review studio. */
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
export const ICON_DIRECTIONS = ['workshop', 'pals', 'press'] as const
export type IconDirection = typeof ICON_DIRECTIONS[number]
export const DEFAULT_ICON_DIRECTION: IconDirection = 'workshop'

/** Reads a shareable preview choice, falling back to the shipped family. */
export function getIconDirection(): IconDirection {
  if (typeof window === 'undefined') return DEFAULT_ICON_DIRECTION
  const choice = new URLSearchParams(window.location.search).get('icons')
  return ICON_DIRECTIONS.find(direction => direction === choice) ?? DEFAULT_ICON_DIRECTION
}

const c = 'var(--ci-color)'
const shade = 'var(--ci-shade)'
const paper = 'var(--ci-paper)'
const ink = 'var(--ci-ink)'
const pop = 'var(--ci-pop)'

function Spark({ x = 51, y = 11 }: { x?: number; y?: number }) {
  return <path d={`M${x} ${y - 5}q0 5-5 5 5 0 5 5 0-5 5-5-5 0-5-5Z`} fill={pop} strokeWidth="1.8" />
}

/** Round 01: analogue objects, warm stock, ink outlines and visible sidewalls. */
function Workshop({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'engineering': return <>
      <path d="m17 30-8 17a6 6 0 0 0 10 6l12-16c11 1 21-9 17-21l-8 9-9-2-3-9 9-8C24 3 14 15 17 30Z" fill={shade} transform="translate(2 2)" />
      <path d="m17 28-8 17a6 6 0 0 0 10 6l12-16c11 1 21-9 17-21l-8 9-9-2-3-9 9-8C24 1 14 13 17 28Z" fill={c} />
      <path d="m16 43 8-13M21 15q-4 6-1 11" stroke={paper} strokeWidth="3" />
      <circle cx="15" cy="47" r="2" fill={ink} stroke="none" /><Spark />
    </>
    case 'systems': return <>
      <path d="m13 12 8-6h31v44l-8 7H13Z" fill={shade} />
      <path d="m13 12 8-6h31l-8 6Z" fill={paper} />
      <rect x="10" y="12" width="34" height="43" rx="4" fill={c} />
      {[19, 30, 41].map(y => <g key={y}><rect x="15" y={y} width="24" height="8" rx="2" fill={paper} /><circle cx="20" cy={y + 4} r="1.5" fill={pop} stroke="none" /><path d={`M26 ${y + 4}h8`} strokeWidth="1.8" /></g>)}
    </>
    case 'machine-learning': return <>
      <path d="M26 49v7m12-7v7M8 25H4m4 13H4m52-13h4m-4 13h4" />
      <rect x="9" y="14" width="48" height="37" rx="10" fill={shade} />
      <rect x="7" y="11" width="48" height="37" rx="10" fill={c} />
      <path d="M31 11V6" /><circle cx="31" cy="5" r="3" fill={pop} />
      <rect x="14" y="19" width="34" height="20" rx="5" fill={ink} />
      <path d="m20 29 4-4 4 4m7 0 4-4 4 4" stroke={paper} />
      <path d="M26 43h10" stroke={shade} /><Spark x={55} y={8} />
    </>
    case 'electronics': return <>
      <path d="m8 16 5-5h40l4 4v35l-5 5H8Z" fill={shade} />
      <rect x="7" y="11" width="45" height="40" rx="4" fill={c} />
      <path d="M12 21h9m-9 21h8v-7m23 7h4V21h-8M29 16v6m0 19v5" stroke={paper} />
      <path d="M23 20v5m9-5v5m9 5h-5m5 8h-5M19 30h5m-5 8h5m0 3v5m8-5v5" stroke={pop} strokeWidth="3" />
      <rect x="23" y="25" width="14" height="16" rx="2" fill={ink} />
      <path d="m30 28-3 6h5l-3 4" stroke={pop} strokeWidth="1.8" />
    </>
    case 'projects': return <>
      <path d="M10 19v-8h17l6 6h21v35H10Z" fill={shade} />
      <path d="M7 21V10h17l6 7h20v33H7Z" fill={paper} />
      <path d="M13 21h30v23H13Z" fill={pop} /><path d="M18 26h17m-17 5h12" strokeWidth="1.8" />
      <path d="M5 29h49l-5 24H9Z" fill={c} /><path d="M11 34h35" stroke={paper} />
      <rect x="22" y="38" width="13" height="7" rx="2" fill={paper} /><Spark x={56} y={10} />
    </>
    case 'utilities': return <>
      <path d="M23 17v-7h18v7" fill="none" strokeWidth="5" />
      <rect x="8" y="19" width="49" height="34" rx="5" fill={shade} />
      <rect x="6" y="16" width="49" height="34" rx="5" fill={c} />
      <path d="M6 30q24 10 49 0" fill="none" /><rect x="25" y="29" width="11" height="12" rx="2" fill={pop} />
      <path d="M12 22h14" stroke={paper} /><path d="M30 33v4" />
    </>
    case 'infrastructure': return <>
      <path d="M15 33H9a8 8 0 0 1-1-16 11 11 0 0 1 18-8 13 13 0 0 1 23 8 8 8 0 0 1 2 16H15Z" fill={shade} transform="translate(1 3)" />
      <path d="M15 30H9a8 8 0 0 1-1-16 11 11 0 0 1 18-8 13 13 0 0 1 23 8 8 8 0 0 1 2 16H15Z" fill={c} />
      <path d="M14 17a6 6 0 0 1 9-5" stroke={paper} fill="none" />
      <path d="M31 31v10M12 48v-7h39v7" fill="none" />
      {[12, 31, 51].map(x => <rect key={x} x={x - 6} y="46" width="12" height="10" rx="2" fill={paper} />)}
      <path d="m29 15-4 6h7l-2 5 9-10h-7l2-5" fill={pop} strokeWidth="1.6" />
    </>
    case 'research': return <>
      <path d="M19 9h17m-13 0v18L10 46a6 6 0 0 0 5 9h31a6 6 0 0 0 5-9L36 27V9" fill={shade} />
      <path d="M18 7h17m-13 0v18L9 44a6 6 0 0 0 5 9h31a6 6 0 0 0 5-9L35 25V7" fill={paper} />
      <path d="m16 35-7 11q-1 6 5 7h31q6-1 5-7l-7-11q-7 5-14 0t-13 0Z" fill={c} />
      <circle cx="23" cy="43" r="3" fill={pop} /><circle cx="36" cy="46" r="2" fill={paper} stroke="none" />
      <path d="M26 14v13l-7 11" stroke={paper} strokeWidth="3" /><Spark x={50} y={17} />
    </>
    case 'minecraft': return <>
      <path d="m7 20 25-13 25 13v28L32 61 7 48Z" fill={shade} />
      <path d="m7 18 25 13v27L7 45Z" fill="#c88d5b" /><path d="m57 18-25 13v27l25-13Z" fill="#936141" />
      <path d="m7 18 25-13 25 13-25 13Z" fill={c} />
      <path d="m7 18 25 13 25-13v9l-9 5v5l-8 4v-5l-8 4-8-4v-5l-8-4v5l-9-5Z" fill={c} />
      <path d="m15 18 17-9 8 4m-25 25 5 3m5 6 4 2m11-2 5-3m3-6 5-3" stroke={paper} strokeWidth="2" />
    </>
    case 'photography': return <>
      <rect x="7" y="20" width="52" height="33" rx="6" fill={shade} />
      <path d="m20 17 4-9h15l5 9" fill={paper} /><rect x="5" y="17" width="52" height="33" rx="6" fill={c} />
      <path d="M6 29h50" /><circle cx="31" cy="34" r="14" fill={paper} /><circle cx="31" cy="34" r="9" fill={shade} />
      <path d="M26 34a5 5 0 0 1 5-5" stroke={paper} strokeWidth="3" fill="none" /><rect x="45" y="22" width="6" height="4" rx="1" fill={pop} strokeWidth="1.5" />
    </>
    case 'hackathon': return <>
      <path d="M8 49 25 19l11 17 8-10 15 23Z" fill={shade} />
      <path d="M5 46 22 16l11 17 8-10 15 23Z" fill={c} />
      <path d="m16 27 6-11 7 12-7-3Z" fill={paper} />
      <path d="M14 30h36v21H14Z" fill={paper} /><path d="m23 36-5 5 5 4m17-9 5 5-5 4m-9-10-3 11" fill="none" strokeWidth="2" />
      <path d="M10 54h44" strokeWidth="4" /><Spark x={51} y={11} />
    </>
  }
}

function Face({ y = 33 }: { y?: number }) {
  return <g fill="none"><path d={`M25 ${y - 3}v3m14-3v3m-11 5q4 4 8 0`} stroke={ink} strokeWidth="2.6" /><g stroke="none" fill={pop}><ellipse cx="20" cy={y + 3} rx="3" ry="1.8" /><ellipse cx="44" cy={y + 3} rx="3" ry="1.8" /></g></g>
}

/** Round 02: new silhouettes, expressive faces and round Saturday-morning shapes. */
function Pals({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'engineering': return <>
      <path d="M22 52v6m20-6v6M11 34l-6 5m48-5 6 5" />
      <path d="M16 25 13 14l6-7 6 8h14l6-8 6 7-3 11a14 14 0 0 1 3 9v8a11 11 0 0 1-11 11H24a11 11 0 0 1-11-11v-8a14 14 0 0 1 3-9Z" fill={c} />
      <path d="M24 47h16" stroke={paper} /><Face y={34} /><Spark x={55} y={12} />
    </>
    case 'systems': return <>
      <path d="M23 51v6m18-6v6M11 30l-6 5m48-5 6 5" />
      <rect x="11" y="8" width="42" height="45" rx="12" fill={c} /><rect x="17" y="13" width="30" height="9" rx="4" fill={paper} />
      <path d="M23 17h13" strokeWidth="2" /><circle cx="42" cy="17" r="1.5" fill={pop} stroke="none" /><Face y={33} /><path d="M24 47h16" stroke={shade} />
    </>
    case 'machine-learning': return <>
      <path d="m17 49-4 8m34-8 4 8M8 30l-5-3m53 3 5-3M32 12V8" />
      <circle cx="32" cy="6" r="3" fill={pop} /><rect x="8" y="12" width="48" height="39" rx="16" fill={c} />
      <rect x="14" y="21" width="36" height="23" rx="10" fill={paper} /><Face y={30} /><path d="M19 17h8" stroke={paper} /><Spark x={56} y={9} />
    </>
    case 'electronics': return <>
      <path d="M22 13V7m10 6V7m10 6V7M22 51v6m10-6v6m10-6v6M13 22H7m6 10H7m6 10H7m44-20h6m-6 10h6m-6 10h6" strokeWidth="4" />
      <rect x="13" y="13" width="38" height="38" rx="11" fill={c} /><Face y={31} /><path d="m25 19-5 6" stroke={paper} />
    </>
    case 'projects': return <>
      <path d="m18 48-5 8m31-8 6 8M8 33l-5 5m53-5 5 5" />
      <path d="M8 22v-6q0-6 6-6h12l7 7h17q6 0 6 6v23q0 7-7 7H15q-7 0-7-7Z" fill={c} />
      <path d="M9 24h46" stroke={shade} /><Face y={34} /><path d="M16 16h7" stroke={paper} />
    </>
    case 'utilities': return <>
      <path d="M22 17v-5q10-10 20 0v5M9 34l-6 4m52-4 6 4M23 52v5m18-5v5" />
      <rect x="9" y="17" width="46" height="35" rx="12" fill={c} /><path d="M10 27h44" stroke={shade} /><Face y={36} />
      <path d="M17 22h9" stroke={paper} />
    </>
    case 'infrastructure': return <>
      <path d="m19 46-5 9m29-9 6 9M5 30l-3-3m59 3 3-3" />
      <path d="M17 48C-2 48 0 23 15 24c-3-18 23-23 27-6 18-3 25 30 5 30Z" fill={c} />
      <Face y={32} /><path d="M18 21q1-7 8-7" stroke={paper} fill="none" /><Spark x={54} y={12} />
    </>
    case 'research': return <>
      <path d="m19 54-4 5m29-5 5 5M8 39l-5 3m53-3 5 3" />
      <path d="M23 11v15L11 43q-6 11 8 11h26q14 0 8-11L41 26V11Z" fill={paper} />
      <path d="M15 37q8-6 17 0t17 0l4 6q6 11-8 11H19Q5 54 11 43Z" fill={c} /><Face y={43} />
      <rect x="20" y="5" width="24" height="7" rx="3" fill={pop} /><circle cx="30" cy="27" r="3" fill={c} stroke="none" />
    </>
    case 'minecraft': return <>
      <path d="m18 51-5 6m33-6 5 6M10 32l-6 5m50-5 6 5" />
      <rect x="10" y="10" width="44" height="41" rx="6" fill="#c88d5b" />
      <path d="M10 16q0-6 6-6h32q6 0 6 6v10h-9v6h-9v-6H23v6h-8v-6h-5Z" fill={c} /><Face y={39} />
      <path d="M18 16h12" stroke={paper} /><Spark x={57} y={8} />
    </>
    case 'photography': return <>
      <path d="m18 51-5 6m33-6 5 6M7 32l-4 4m54-4 4 4" />
      <path d="m21 18 4-8h14l4 8" fill={pop} /><rect x="7" y="18" width="50" height="33" rx="12" fill={c} />
      <circle cx="32" cy="34" r="14" fill={paper} /><circle cx="32" cy="34" r="8" fill={shade} /><path d="M28 32q0-3 3-3" stroke={paper} />
      <path d="M12 28v4m39-4v4" /><path d="M15 23h4" stroke={paper} />
    </>
    case 'hackathon': return <>
      <path d="m17 54-4 5m35-5 4 5M8 31l-5 5m53-5 5 5" />
      <path d="M8 44 22 12q2-4 5 0l7 13 5-8q2-4 5 0l13 27q4 10-7 10H15Q3 54 8 44Z" fill={c} />
      <path d="m17 23 7-13 7 13-7-4Z" fill={paper} /><Face y={39} /><Spark x={53} y={8} />
    </>
  }
}

/** Round 03: screen-print silhouettes, two-ink palette and halftone grain. */
function Press({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'engineering': return <>
      <path d="m12 45 16-18a14 14 0 0 1 18-18L35 20l9 9 11-11a14 14 0 0 1-18 18L20 53Z" fill={c} />
      <path d="m15 48 19-20m3-14-6 7 8 8" fill="none" /><circle cx="17" cy="48" r="2" fill={paper} stroke="none" />
    </>
    case 'systems': return <>
      <rect x="10" y="9" width="44" height="13" rx="3" fill={c} /><rect x="10" y="26" width="44" height="13" rx="3" fill={paper} /><rect x="10" y="43" width="44" height="13" rx="3" fill={c} />
      {[15, 32, 49].map(y => <g key={y}><circle cx="18" cy={y + 1} r="2" fill={ink} stroke="none" /><path d={`M28 ${y + 1}h17`} /></g>)}
    </>
    case 'machine-learning': return <>
      <path d="M31 14c-3-9-15-7-16 1-9 0-13 12-6 17-7 9 2 20 11 17 3 8 12 7 12 0V17Zm2 0c3-9 15-7 16 1 9 0 13 12 6 17 7 9-2 20-11 17-3 8-12 7-12 0V17Z" fill={c} />
      <path d="M15 17q10 1 9 9m-11 8q9-5 11 3m-3 10v-5m28-25q-10 1-9 9m11 8q-9-5-11 3m3 10v-5" fill="none" stroke={paper} strokeWidth="3" />
    </>
    case 'electronics': return <>
      <path d="M20 14V6m12 8V6m12 8V6M20 50v8m12-8v8m12-8v8M14 20H6m8 12H6m8 12H6m44-24h8m-8 12h8m-8 12h8" />
      <rect x="14" y="14" width="36" height="36" rx="2" fill={c} /><path d="m35 21-11 14h9l-3 10 13-16H32Z" fill={paper} strokeWidth="1.8" />
    </>
    case 'projects': return <>
      <path d="M10 28V12h18l7 7h17v34H10Z" fill={paper} /><path d="M6 30h50l-6 23H12Z" fill={c} />
      <path d="M18 24h24M18 17h7" /><path d="m25 39 4 4 9-9" fill="none" stroke={paper} strokeWidth="3" />
    </>
    case 'utilities': return <>
      <path d="M23 19V9h18v10" fill="none" /><rect x="7" y="19" width="50" height="34" rx="3" fill={c} /><path d="M7 32h50" />
      <rect x="26" y="28" width="12" height="11" rx="1" fill={paper} /><path d="M14 45h8" stroke={paper} />
    </>
    case 'infrastructure': return <>
      <path d="M15 35C-1 35 1 14 16 15c1-15 23-17 27-2 18-2 23 22 6 22Z" fill={c} />
      <path d="M32 35v12M12 54v-7h40v7" fill="none" /><circle cx="12" cy="54" r="4" fill={paper} /><circle cx="32" cy="52" r="4" fill={c} /><circle cx="52" cy="54" r="4" fill={paper} />
      <path d="m23 22 6 6 12-12" stroke={paper} strokeWidth="3" fill="none" />
    </>
    case 'research': return <>
      <path d="M12 50h40v6H12Z" fill={c} />
      <path d="M35 20a14 14 0 0 1 4 28H24v-6h14a8 8 0 0 0-3-16Z" fill={c} />
      <path d="m22 10 11 5-8 19-11-5Z" fill={paper} /><path d="M17 40h18" />
    </>
    case 'minecraft': return <>
      <path d="m8 19 24-13 24 13v27L32 59 8 46Z" fill={c} /><path d="m8 19 24 13 24-13M32 32v27" fill="none" />
      <path d="m8 29 8 4v7l8 4v-7l8 4 9-5v7l8-5v-6l7-4M19 19l13-7 12 7-12 6Z" fill={paper} />
    </>
    case 'photography': return <>
      <path d="m20 19 5-9h14l5 9" fill={paper} /><rect x="5" y="19" width="54" height="32" rx="3" fill={c} /><path d="M6 28h52" />
      <circle cx="32" cy="35" r="13" fill={paper} /><circle cx="32" cy="35" r="7" fill={ink} /><path d="m28 33 4-3" stroke={paper} /><path d="M46 24h6" />
    </>
    case 'hackathon': return <>
      <path d="M5 47 23 12l10 20 9-12 17 27Z" fill={c} /><path d="m17 25 6-13 7 14-7-4Z" fill={paper} />
      <path d="m18 38-5 4 5 4m26-8 5 4-5 4m-10-9-5 11" stroke={paper} strokeWidth="3" fill="none" /><path d="M8 54h48" />
    </>
  }
}

export interface CategoryIconProps {
  kind: IconKind
  direction?: IconDirection
  size?: number | string
  /** Omit beside a visible label; supply when the illustration stands alone. */
  title?: string
  className?: string
}

/** 64-unit optical grid with round 2.4-unit ink and theme-safe CSS colours. */
export function CategoryIcon({ kind, direction = DEFAULT_ICON_DIRECTION, size, title, className = '' }: CategoryIconProps) {
  const titleId = useId()
  const style: CSSProperties | undefined = size === undefined ? undefined : { width: size, height: size }
  return (
    <svg className={`category-icon category-icon-${kind} ${className}`.trim()} data-direction={direction}
      viewBox="0 0 64 64" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={style} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined} focusable="false">
      {title && <title id={titleId}>{title}</title>}
      {direction === 'press' && <g stroke="none" fill={c} opacity=".2">
        {[12, 18, 24, 30, 36, 42, 48].map(x => [12, 18, 24, 30, 36, 42, 48].map(y => <circle key={`${x}-${y}`} cx={x + 3} cy={y + 4} r="1.15" />))}
      </g>}
      {direction === 'workshop' ? <Workshop kind={kind} /> : direction === 'pals' ? <Pals kind={kind} /> : <Press kind={kind} />}
    </svg>
  )
}
