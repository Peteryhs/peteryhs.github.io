import { useEffect, useRef, useState } from 'react'
import { discover } from '../hooks/secrets'

const CHEERS = ['HIGH FIVE!', 'UP TOP!', 'NICE!', 'HEY!']

/** Font-independent greeting with the same warm ink-and-paper feel as the icons. */
export function WavingHand() {
  const [clap, setClap] = useState<{ id: number; text: string } | null>(null)
  const count = useRef(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onHighFive = () => {
    discover('highfive')
    const id = ++count.current
    setClap({ id, text: CHEERS[(id - 1) % CHEERS.length] })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setClap(null), 820)
  }

  return (
    <button
      type="button"
      className={`wave-btn ${clap ? 'is-clapping' : ''}`.trim()}
      aria-label="Waving hand. Click to high-five."
      onClick={onHighFive}
    >
      <svg className="intro-wave-hand" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g fill="none" stroke="#65503b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10 12-3-2M16 7l-1-4M6 19H2" stroke="#cc9650" />
          <path
            d="m16 28-5-9a3 3 0 0 1 5-3l5 8-7-15a3 3 0 0 1 5-2l7 15-5-16a3 3 0 0 1 6-1l5 16-2-12a3 3 0 0 1 6-1l3 19 2-5a3 3 0 0 1 6 2l-4 12c-2 7-8 11-15 9-6-1-9-5-12-10l-4-6a3 3 0 0 1 4-4Z"
            fill="#f5c65c"
            transform="translate(-1 0)"
          />
          <path d="M29 29c-4 1-6 5-5 9" />
          <path d="m16 31 4 6c2 3 4 4 7 5" stroke="#fff2c8" strokeWidth="2.5" />
        </g>
      </svg>
      {clap && (
        <span key={clap.id} className="wave-fx" aria-hidden="true">
          <span className="wave-chip">{clap.text}</span>
          <i className="wave-spark wave-spark-1" />
          <i className="wave-spark wave-spark-2" />
          <i className="wave-spark wave-spark-3" />
          <i className="wave-spark wave-spark-4" />
          <i className="wave-spark wave-spark-5" />
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {clap ? clap.text : ''}
      </span>
    </button>
  )
}
