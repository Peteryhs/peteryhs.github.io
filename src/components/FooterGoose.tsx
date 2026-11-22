import { useEffect, useRef, useState } from 'react'
import { discover } from '../hooks/secrets'

// 14 x 12 pixel Canada goose, facing left. K black, W white, B brown, T tan, L leg.
const GOOSE = [
  '..KK..........',
  'kKWK..........',
  '..KK..........',
  '..KK..........',
  '..KK..BBBBB...',
  '..KKBBBBBBBB..',
  '...BBBBBBBBBK.',
  '...TBBBBBBWWKK',
  '....TTTTTTW...',
  '.....L..L.....',
  '.....L..L.....',
  '....LL.LL.....',
]
const HONKS = ['HONK', 'HONK!', 'honk?', 'HONK!!']
const SPOTS = [12, 30, 48, 66, 84]

/** A Waterloo goose standing on the footer rule. It honks, then waddles off somewhere else. */
export function FooterGoose() {
  const [spot, setSpot] = useState(3)
  const [facingRight, setFacingRight] = useState(false)
  const [honk, setHonk] = useState<{ text: string; id: number } | null>(null)
  const count = useRef(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onHonk = () => {
    discover('honk')
    const id = ++count.current
    setHonk({ text: HONKS[(id - 1) % HONKS.length], id })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setHonk(null)
      setSpot((current) => {
        const next = (current + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length
        setFacingRight(next > current)
        return next
      })
    }, 700)
  }

  return (
    <button
      type="button"
      className="footer-goose"
      style={{ left: `${SPOTS[spot]}%` }}
      aria-label="A goose. Click to honk."
      onClick={onHonk}
    >
      {honk && (
        <span key={honk.id} className="footer-goose-honk" aria-hidden="true">
          {honk.text}
        </span>
      )}
      <svg
        className={`footer-goose-svg ${honk ? 'is-honking' : ''}`}
        data-facing={facingRight ? 'right' : 'left'}
        viewBox="0 0 14 12"
        shapeRendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        {GOOSE.flatMap((row, y) =>
          Array.from(row).map((cell, x) =>
            cell === '.' ? null : <rect key={`${x}-${y}`} className={`goose-${cell}`} x={x} y={y} width="1" height="1" />,
          ),
        )}
      </svg>
      <span className="sr-only" role="status" aria-live="polite">
        {honk ? 'Honk' : ''}
      </span>
    </button>
  )
}
