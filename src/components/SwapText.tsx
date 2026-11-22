import { useState, type ReactNode } from 'react'

/**
 * Two lines of copy sharing one grid cell, like the hero blocks: the second
 * rises in on hover, focus or tap, and nothing around it reflows.
 */
export function SwapText({
  rest,
  alt,
  className = '',
}: {
  rest: ReactNode
  alt: ReactNode
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button
      type="button"
      className={`swap ${className}`.trim()}
      data-flipped={flipped}
      onClick={(e) => {
        e.stopPropagation()
        setFlipped((f) => !f)
      }}
      onBlur={() => setFlipped(false)}
      onMouseLeave={() => setFlipped(false)}
    >
      <span className="swap-face swap-rest">{rest}</span>
      <span className="swap-face swap-alt">{alt}</span>
    </button>
  )
}
