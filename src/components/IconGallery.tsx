import { useState } from 'react'
import {
  CategoryIcon,
  ICON_CATEGORIES,
  type IconDirection,
  type IconKind,
} from './CategoryIcon'
import { goHome } from '../hooks/useRoute'
import './icon-gallery.css'

const ROUNDS: {
  id: IconDirection
  round: string
  name: string
  badge?: string
  summary: string
}[] = [
  {
    id: 'workshop',
    round: 'Round 01',
    name: 'Sunday Workshop',
    badge: 'Active default',
    summary: 'Warm hand-inked objects with cel-shaded sidewalls and bright specular pops — matches the tactile keycap blocks at small and large sizes.',
  },
  {
    id: 'pals',
    round: 'Round 02',
    name: 'Sticker Pals',
    summary: 'Saturday-morning cartoon mascots with expressive faces, rosy cheeks and playful stubby limbs for maximum personality.',
  },
  {
    id: 'press',
    round: 'Round 03',
    name: 'Risograph Press',
    summary: 'Bold retro screen-print silhouettes with crisp paper cutouts and subtle halftone dots for an editorial zine feel.',
  },
]

const SAMPLE_PILLS: { kind: IconKind; label: string }[] = [
  { kind: 'engineering', label: 'CompEng' },
  { kind: 'infrastructure', label: 'WATonomous' },
  { kind: 'hackathon', label: 'Hack the Ridge' },
  { kind: 'systems', label: 'distributed systems' },
  { kind: 'machine-learning', label: 'machine learning' },
  { kind: 'electronics', label: 'electronics' },
  { kind: 'projects', label: 'projects' },
  { kind: 'minecraft', label: 'Minecraft' },
  { kind: 'photography', label: 'Photography' },
]

export function IconGallery() {
  const [surface, setSurface] = useState<'light' | 'dark'>('light')

  return (
    <main className="icon-studio" data-icon-theme={surface}>
      <div className="icon-studio-inner">
        <header className="icon-studio-header">
          <div>
            <p className="icon-studio-eyebrow">Category Icon System · 3 Directions</p>
            <h1 className="icon-studio-title">Semi-Retro Cartoon Icon Choices</h1>
            <p className="icon-studio-lead">
              Every round shares the same 11-category vocabulary, 64×64 optical grid and CSS colour tokens so any chosen direction drops into hero pills, cards and future pages without rework.
            </p>
          </div>
          <div className="icon-studio-actions">
            <button
              type="button"
              className="icon-studio-btn"
              onClick={() => setSurface((s) => (s === 'light' ? 'dark' : 'light'))}
            >
              Preview: {surface === 'light' ? 'Light paper' : 'Dark charcoal'}
            </button>
            <button type="button" className="icon-studio-btn icon-studio-btn-primary" onClick={goHome}>
              ← Back to site
            </button>
          </div>
        </header>

        <div className="icon-studio-rounds">
          {ROUNDS.map((round) => (
            <section key={round.id} className="icon-round-card" aria-labelledby={`round-${round.id}`}>
              <div className="icon-round-head">
                <div>
                  <span className="icon-round-tag">{round.round}</span>
                  {round.badge && <span className="icon-round-badge">{round.badge}</span>}
                  <h2 id={`round-${round.id}`} className="icon-round-title">{round.name}</h2>
                  <p className="icon-round-summary">{round.summary}</p>
                </div>
                <a className="icon-studio-btn" href={`?icons=${round.id}`}>
                  Preview live on home →
                </a>
              </div>

              <div className="icon-round-pills" aria-label={`${round.name} inline keycap preview`}>
                {SAMPLE_PILLS.map((pill) => (
                  <span key={pill.kind} className="icon-pill-sample">
                    <CategoryIcon kind={pill.kind} direction={round.id} size={20} />
                    <span>{pill.label}</span>
                  </span>
                ))}
              </div>

              <div className="icon-round-grid">
                {ICON_CATEGORIES.map((cat) => (
                  <div key={cat.kind} className="icon-swatch">
                    <div className="icon-swatch-stage">
                      <CategoryIcon kind={cat.kind} direction={round.id} size={52} />
                    </div>
                    <div className="icon-swatch-scales" aria-hidden="true">
                      <CategoryIcon kind={cat.kind} direction={round.id} size={18} />
                      <CategoryIcon kind={cat.kind} direction={round.id} size={28} />
                    </div>
                    <div className="icon-swatch-label">{cat.label}</div>
                    <code className="icon-swatch-kind">{cat.kind}</code>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
