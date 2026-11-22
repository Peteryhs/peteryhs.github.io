import { useEffect, useRef, useState } from 'react'
import { resetSecrets, SECRETS, useSecrets } from '../hooks/secrets'

function PixelGem() {
  return (
    <svg className="px-gem" viewBox="0 0 8 6" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path className="px-gem-body" d="M2 0h4v1h1v1h1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h1v-1h1z" />
      <path className="px-gem-shine" d="M2 1h2v1h-2zM1 2h1v1h-1z" />
    </svg>
  )
}

/** Footer counter. Opens a list of what has been found and where the rest hide. */
export function SecretsTracker() {
  const { found } = useSecrets()
  const [open, setOpen] = useState(false)
  // On a phone the footer wraps and the chip sits at the left edge, so the panel opens rightwards.
  const [alignLeft, setAlignLeft] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="secrets" ref={rootRef}>
      <button
        type="button"
        className="secrets-chip"
        aria-expanded={open}
        aria-controls="secrets-panel"
        aria-label={`${found.size} of ${SECRETS.length} hidden details found`}
        onClick={(e) => {
          setAlignLeft(e.currentTarget.getBoundingClientRect().right - 260 < 12)
          setOpen((o) => !o)
        }}
      >
        <PixelGem />
        <span className="secrets-count" aria-hidden="true">
          {found.size}/{SECRETS.length}
        </span>
      </button>

      {open && (
        <div className="secrets-panel" data-align={alignLeft ? 'left' : 'right'} id="secrets-panel" role="group" aria-label="Hidden details">
          <p className="secrets-title">Hidden details</p>
          <ul className="secrets-list">
            {SECRETS.map((secret) => {
              const got = found.has(secret.id)
              return (
                <li key={secret.id} className={got ? 'is-found' : undefined}>
                  <span className="secrets-mark" aria-hidden="true" />
                  {got ? (
                    <span>{secret.name}</span>
                  ) : (
                    <span>
                      ??? <span className="secrets-where">{secret.where}</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {found.size > 0 && (
            <button type="button" className="secrets-reset" onClick={resetSecrets}>
              Start over
            </button>
          )}
        </div>
      )}
    </div>
  )
}
