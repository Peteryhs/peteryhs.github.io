import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EMAIL_ADDRESS, GITHUB_URL, LINKEDIN_URL } from './blocks'
import { writeClipboard } from '../../hooks/clipboard'

const COPIED_MS = 1800

function ArrowGlyph() {
  return (
    <svg className="sl-glyph sl-arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" />
    </svg>
  )
}

function CopyGlyph({ copied }: { copied: boolean }) {
  return (
    <svg className="sl-glyph" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {copied ? (
        <path d="m2.5 6.4 2.4 2.4 4.6-5" />
      ) : (
        <>
          <rect x="4.2" y="4.2" width="5.6" height="5.6" rx="1.2" />
          <path d="M7.8 2.6A1.2 1.2 0 0 0 6.6 1.8H3.2a1.4 1.4 0 0 0-1.4 1.4v3.4a1.2 1.2 0 0 0 .8 1.2" />
        </>
      )}
    </svg>
  )
}

interface SlotProps {
  label: string
  hoverLabel: string
  /** Optional glyph shown only in the resting state. */
  restGlyph?: ReactNode
  /** Longest alternate copy; reserves width so the swap never reflows. */
  sizer?: string
}

function Slot({ label, hoverLabel, restGlyph, sizer }: SlotProps) {
  return (
    <span className="tb-slot" aria-hidden="true">
      <span className="tb-rest">
        <span className="tb-label">{label}</span>
        {restGlyph}
      </span>
      <span className="tb-hover">{hoverLabel}</span>
      {sizer && <span className="tb-sizer">{sizer}</span>}
    </span>
  )
}

export function ExternalLink({ kind }: { kind: 'github' | 'linkedin' }) {
  const isGithub = kind === 'github'
  return (
    <a
      className="tb sl social-link"
      data-social={kind}
      data-magnetic
      data-frame="default"
      href={isGithub ? GITHUB_URL : LINKEDIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isGithub ? 'GitHub, opens in a new tab' : 'LinkedIn, opens in a new tab'}
    >
      <Slot
        label={isGithub ? 'GitHub' : 'LinkedIn'}
        hoverLabel={isGithub ? '@Peteryhs' : 'Connect'}
        restGlyph={<ArrowGlyph />}
      />
    </a>
  )
}

export function EmailLink() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    const ok = await writeClipboard(EMAIL_ADDRESS)
    if (!ok) {
      window.location.href = `mailto:${EMAIL_ADDRESS}`
      return
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }, [])

  return (
    <>
      <button
        type="button"
        className="tb sl social-link"
        data-social="email"
        data-magnetic
        data-frame="default"
        data-copied={copied}
        aria-label="Email, copy address"
        onClick={copy}
      >
        <Slot label="Email" hoverLabel={copied ? 'Copied!' : 'Copy'} sizer="Copied!" />
        <CopyGlyph copied={copied} />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Email address copied to clipboard' : ''}
      </span>
    </>
  )
}
