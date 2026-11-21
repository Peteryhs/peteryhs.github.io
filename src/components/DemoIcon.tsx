import type { ReactNode } from 'react'
import { CategoryIcon, getIconDirection, type IconKind } from './CategoryIcon'

export type { IconKind } from './CategoryIcon'

/** Keep the final word and its illustration together when a sentence wraps. */
export function IconLabel({ kind, children }: { kind: IconKind; children: ReactNode }) {
  return <span className="intro-icon-label">{children}<DemoIcon kind={kind} /></span>
}

/** Existing call sites keep their API while drawing from the shared category family. */
export function DemoIcon({ kind }: { kind: IconKind }) {
  return <CategoryIcon kind={kind} direction={getIconDirection()} className={`demo-icon demo-icon-${kind}`} />
}
