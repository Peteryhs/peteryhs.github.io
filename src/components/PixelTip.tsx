import { useId, useRef, useState, type ReactNode } from 'react'

const EDGE = 12

/**
 * A control that carries one extra line of detail in a notched pixel tooltip.
 * It opens on hover, on keyboard focus, and on tap.
 */
export function PixelTip({
  tip,
  children,
  className = '',
}: {
  tip: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const tipRef = useRef<HTMLSpanElement>(null)

  // Keep the tooltip inside the viewport and inside any card that clips its
  // overflow; the arrow stays over the control.
  const place = (host: HTMLElement) => {
    const tipEl = tipRef.current
    if (!tipEl) return
    let min = EDGE
    let max = document.documentElement.clientWidth - EDGE
    for (let el = host.parentElement; el; el = el.parentElement) {
      if (getComputedStyle(el).overflowX === 'visible') continue
      const bounds = el.getBoundingClientRect()
      min = Math.max(min, bounds.left + EDGE)
      max = Math.min(max, bounds.right - EDGE)
    }
    const rect = host.getBoundingClientRect()
    const width = tipEl.offsetWidth
    const wanted = rect.left + rect.width / 2 - width / 2
    const clamped = Math.max(min, Math.min(max - width, wanted))
    const limit = Math.max(0, width / 2 - 12)
    const shift = Math.max(-limit, Math.min(limit, clamped - wanted))
    tipEl.style.setProperty('--tip-shift', `${Math.round(shift)}px`)
  }

  return (
    <button
      type="button"
      className={`px-tip-host ${className}`.trim()}
      data-open={open}
      aria-describedby={id}
      onMouseEnter={(e) => place(e.currentTarget)}
      onFocus={(e) => place(e.currentTarget)}
      onClick={(e) => {
        e.stopPropagation()
        place(e.currentTarget)
        setOpen((o) => !o)
      }}
      onBlur={() => setOpen(false)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      <span ref={tipRef} className="px-tip" role="tooltip" id={id}>
        {tip}
      </span>
    </button>
  )
}
