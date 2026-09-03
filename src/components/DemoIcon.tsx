type IconKind =
  | 'wave'
  | 'university'
  | 'engineering'
  | 'systems'
  | 'machine-learning'
  | 'electronics'
  | 'projects'
  | 'utilities'
  | 'infrastructure'
  | 'research'

export function DemoIcon({ kind }: { kind: IconKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 }

  const drawing = {
    wave: <><path {...common} d="M5 13V6.8a1.4 1.4 0 0 1 2.8 0v3.4-5a1.4 1.4 0 0 1 2.8 0v5-4.3a1.4 1.4 0 0 1 2.8 0v4.3l.3-2.5a1.35 1.35 0 0 1 2.7.3l-.8 7a4.3 4.3 0 0 1-4.3 3.8h-1.7A4.6 4.6 0 0 1 5 14.2Z" /><path {...common} d="M3.2 4.5 1.8 3.2M19.8 4.5l1.4-1.3M12 2.5v-1" /></>,
    university: <><path {...common} d="m12 2 8 4.1v1.4H4V6.1Z" /><path {...common} d="M6 9v7m4-7v7m4-7v7m4-7v7M3.5 20h17" /><path {...common} d="M4.5 17h15" /></>,
    engineering: <><path {...common} d="M14.3 4.1a5.1 5.1 0 0 0-5.5 6.2L3 16.1a2.3 2.3 0 1 0 3.2 3.2l5.8-5.8a5.1 5.1 0 0 0 6.2-5.5l-3.1 3.1-3.3-1  -1-3.3Z" /><circle cx="4.6" cy="17.7" r=".65" fill="currentColor" /></>,
    systems: <><rect {...common} x="3" y="3" width="18" height="5" rx="1" /><rect {...common} x="3" y="10" width="18" height="5" rx="1" /><rect {...common} x="3" y="17" width="18" height="4" rx="1" /><path {...common} d="M6 5.5h.01M6 12.5h.01M6 19h.01M10 5.5h7M10 12.5h7M10 19h7" /></>,
    'machine-learning': <><circle {...common} cx="5" cy="6" r="2" /><circle {...common} cx="18" cy="5" r="2" /><circle {...common} cx="12" cy="12" r="2.4" /><circle {...common} cx="5" cy="18" r="2" /><circle {...common} cx="19" cy="18" r="2" /><path {...common} d="m6.6 7.2 3.7 3.2m3.5-3.4 2.5-1m-2.6 7.4 3.6 3.2m-7.1-1.1-3.8 2.1" /></>,
    electronics: <><rect {...common} x="6" y="6" width="12" height="12" rx="1.7" /><path {...common} d="M9 2v4m3-4v4m3-4v4M9 18v4m3-4v4m3-4v4M2 9h4m-4 3h4m-4 3h4m12-6h4m-4 3h4m-4 3h4" /><rect x="9.2" y="9.2" width="5.6" height="5.6" rx=".7" fill="currentColor" /></>,
    projects: <><path {...common} d="M8.5 18.5c-4 1.2-4-2-5.6-2.5m11.3 4.8v-3.1a2.7 2.7 0 0 0-.8-2.1c2.7-.3 5.6-1.3 5.6-6a4.7 4.7 0 0 0-1.2-3.2 4.4 4.4 0 0 0-.1-3.1s-1-.3-3.2 1.2a11 11 0 0 0-5.8 0C6.5 2.9 5.5 3.2 5.5 3.2a4.4 4.4 0 0 0-.1 3.1 4.7 4.7 0 0 0-1.2 3.2c0 4.7 2.9 5.7 5.6 6a2.7 2.7 0 0 0-.8 2.1v3.1" /></>,
    utilities: <><path {...common} d="M4 9h16v11H4zM9 9V6.5h6V9M4 13h16" /><path {...common} d="M10 15h4" /></>,
    infrastructure: <><circle {...common} cx="4.5" cy="6" r="2" /><circle {...common} cx="19.5" cy="6" r="2" /><circle {...common} cx="12" cy="18" r="2" /><path {...common} d="M6.2 7.1 10.4 16m7.4-8.9L13.6 16M6.5 6h11" /></>,
    research: <><path {...common} d="m8 3 3 3-2 2 3 3 3-3 2 2-3-3 2-2-3-3zM10 11l-5 5.2M5 16.2 3 20h10" /><path {...common} d="M14 9.5 18.5 14M12.5 12.2h6" /></>,
  }[kind]

  return <svg className={`demo-icon demo-icon-${kind}`} viewBox="0 0 24 24" aria-hidden="true">{drawing}</svg>
}
