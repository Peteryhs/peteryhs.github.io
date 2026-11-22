import { useEffect, useRef, useState, type ReactNode } from 'react'
import { writeClipboard } from '../hooks/clipboard'

const COPIED_MS = 1800

/** Copies `value` on click and swaps its label in place, the way the hero's Email block does. */
export function CopyChip({
  value,
  rest,
  done = 'Copied!',
  label,
  className = '',
}: {
  value: string
  rest: ReactNode
  done?: ReactNode
  /** Accessible name, e.g. "Copy Minecraft username". */
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <>
      <button
        type="button"
        className={`swap copy-chip ${className}`.trim()}
        data-flipped={copied}
        aria-label={label}
        onClick={async (e) => {
          e.stopPropagation()
          if (!(await writeClipboard(value))) return
          setCopied(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
        }}
      >
        <span className="swap-face swap-rest">{rest}</span>
        <span className="swap-face swap-alt">{done}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  )
}
