import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { projectsData } from '../content/projects'
import { topicById, type TopicId } from '../content/site'
import { getRoute, navigate, openProject } from '../hooks/useRoute'

const EMAIL = 'contact@mail.peteryhs.com'
const ease = [0.16, 1, 0.3, 1] as const

type Group = 'Jump to' | 'Intro' | 'Projects' | 'Elsewhere' | 'Actions'

interface Command {
  id: string
  group: Group
  label: string
  hint?: string
  keywords?: string
  icon: ReactNode
  external?: boolean
  run: () => void
}

const isMac = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

/** Run a home-page action, leaving a case study first if one is open. */
const onHome = (action: () => void) => {
  if (getRoute().name === 'home') action()
  else void navigate({ name: 'home' }).then(() => requestAnimationFrame(action))
}

const scrollToId = (id: string) => onHome(() => scrollToIdNow(id))

const scrollToIdNow = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

const openExternal = (url: string) => {
  if (url.startsWith('mailto:')) window.location.href = url
  else window.open(url, '_blank', 'noopener,noreferrer')
}

/* Small stroke icons in the same style as the theme toggle. */
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const icons = {
  hash: <Icon d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" />,
  spark: <Icon d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  box: <Icon d="M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8" />,
  arrow: <Icon d="M7 17 17 7M8 7h9v9" />,
  mail: <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  copy: <Icon d="M9 9h11v11H9zM5 15H4V4h11v1" />,
  link: <Icon d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />,
  moon: <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  up: <Icon d="M12 19V5M5 12l7-7 7 7" />,
}

/** Subsequence match with bonuses for word starts and contiguous runs. */
function score(query: string, text: string) {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  const direct = t.indexOf(q)
  if (direct !== -1) return 100 - direct + (direct === 0 || t[direct - 1] === ' ' ? 50 : 0)
  let s = 0
  let ti = 0
  let run = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    run = found === ti ? run + 1 : 0
    s += 1 + run * 2 + (found === 0 || t[found - 1] === ' ' ? 3 : 0)
    ti = found + 1
  }
  return s
}

interface CommandPaletteProps {
  onOpenTopic: (id: TopicId) => void
}

export function CommandPalette({ onOpenTopic }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const mac = useMemo(isMac, [])

  const close = useCallback(() => setOpen(false), [])

  const flash = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 1600)
  }, [])

  const commands = useMemo<Command[]>(() => {
    const introTopics: TopicId[] = ['about', 'waterloo', 'compeng', 'systems', 'ml', 'electronics', 'projects', 'minecraft', 'photography']
    return [
      { id: 'top', group: 'Jump to', label: 'Top', keywords: 'home intro start', icon: icons.up, run: () => onHome(() => window.scrollTo({ top: 0, behavior: 'smooth' })) },
      { id: 'sec-about', group: 'Jump to', label: 'About', keywords: 'bento profile', icon: icons.hash, run: () => scrollToId('about') },
      { id: 'sec-truenorth', group: 'Jump to', label: 'True North', keywords: 'timeline focus', icon: icons.hash, run: () => scrollToId('truenorth') },
      { id: 'sec-projects', group: 'Jump to', label: 'Projects', keywords: 'work', icon: icons.hash, run: () => scrollToId('projects') },
      { id: 'sec-passions', group: 'Jump to', label: 'Hobbies', keywords: 'passions photography minecraft', icon: icons.hash, run: () => scrollToId('passions') },
      { id: 'sec-contact', group: 'Jump to', label: 'Contact', keywords: 'reach socials', icon: icons.hash, run: () => scrollToId('contact') },

      ...introTopics.map<Command>((id) => ({
        id: `topic-${id}`,
        group: 'Intro',
        label: topicById[id].title,
        hint: 'Expand',
        keywords: `${topicById[id].shortTitle} ${topicById[id].preview}`,
        icon: icons.spark,
        run: () => onHome(() => onOpenTopic(id)),
      })),

      ...projectsData.map<Command>((p) => ({
        id: `project-${p.slug}`,
        group: 'Projects',
        label: p.name,
        hint: 'Case study',
        keywords: `${p.tagline} ${p.repo} github repo`,
        icon: icons.box,
        run: () => openProject(p.slug),
      })),

      { id: 'gh', group: 'Elsewhere', label: 'GitHub', hint: '@Peteryhs', keywords: 'code repos', icon: icons.arrow, external: true, run: () => openExternal('https://github.com/Peteryhs') },
      { id: 'gh2', group: 'Elsewhere', label: 'GitHub (projects)', hint: '@ShaoRou459', keywords: 'code repos', icon: icons.arrow, external: true, run: () => openExternal('https://github.com/ShaoRou459') },
      { id: 'li', group: 'Elsewhere', label: 'LinkedIn', keywords: 'resume work', icon: icons.arrow, external: true, run: () => openExternal('https://www.linkedin.com/in/peter-shao-ysh/') },
      { id: 'mail', group: 'Elsewhere', label: 'Send an email', hint: EMAIL, keywords: 'contact mail', icon: icons.mail, run: () => openExternal(`mailto:${EMAIL}`) },

      {
        id: 'theme', group: 'Actions', label: 'Toggle theme', keywords: 'dark light mode', icon: icons.moon,
        // Let the palette fade out first so the circular reveal starts from a clean frame.
        run: () => window.setTimeout(() => document.querySelector<HTMLButtonElement>('.theme-toggle-btn')?.click(), 180),
      },
      {
        id: 'copy-email', group: 'Actions', label: 'Copy email', hint: EMAIL, keywords: 'clipboard contact', icon: icons.copy,
        run: () => navigator.clipboard?.writeText(EMAIL).then(() => flash('Email copied')),
      },
      {
        id: 'copy-link', group: 'Actions', label: 'Copy link to this site', keywords: 'share url clipboard', icon: icons.link,
        run: () => navigator.clipboard?.writeText('https://peteryhs.com').then(() => flash('Link copied')),
      },
    ]
  }, [onOpenTopic, flash])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return commands
    return commands
      .map((c) => ({ c, s: Math.max(score(q, c.label) * 2, score(q, `${c.group} ${c.hint ?? ''} ${c.keywords ?? ''}`)) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c)
  }, [commands, query])

  // Global shortcut: ⌘K / Ctrl+K toggles, "/" opens when not typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpenEvent)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      restoreFocus.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  useEffect(() => setIndex(0), [query])

  // Keep the selected row in view.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const runCommand = (cmd: Command | undefined) => {
    if (!cmd) return
    close()
    cmd.run()
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      setIndex((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(results[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  if (typeof document === 'undefined') return null

  // Render grouped, preserving the ranked order within the flat index.
  let lastGroup: Group | null = null
  const rows: ReactNode[] = []
  results.forEach((cmd, i) => {
    if (!query.trim() && cmd.group !== lastGroup) {
      rows.push(<div key={`g-${cmd.group}`} className="cmdk-group" role="presentation">{cmd.group}</div>)
      lastGroup = cmd.group
    }
    rows.push(
      <div
        key={cmd.id}
        id={`cmdk-item-${cmd.id}`}
        role="option"
        aria-selected={i === index}
        data-index={i}
        className={`cmdk-item${i === index ? ' is-selected' : ''}`}
        onPointerMove={() => i !== index && setIndex(i)}
        onClick={() => runCommand(cmd)}
      >
        <span className="cmdk-item-icon">{cmd.icon}</span>
        <span className="cmdk-item-label">{cmd.label}</span>
        {cmd.hint && <span className="cmdk-item-hint">{cmd.hint}</span>}
        {cmd.external && <span className="cmdk-item-ext" aria-label="opens in a new tab">↗</span>}
      </div>,
    )
  })

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="cmdk-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            onPointerDown={(e) => e.target === e.currentTarget && close()}
            onWheel={(e) => e.target === e.currentTarget && e.preventDefault()}
          >
            <motion.div
              className="cmdk-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }}
              transition={{ duration: 0.22, ease }}
            >
              <div className="cmdk-search">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={inputRef}
                  className="cmdk-input"
                  placeholder="Jump to a section, project, or link…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKey}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="cmdk-list"
                  aria-activedescendant={results[index] ? `cmdk-item-${results[index].id}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="cmdk-kbd">esc</kbd>
              </div>

              <div ref={listRef} id="cmdk-list" className="cmdk-list" role="listbox">
                {rows.length ? rows : <div className="cmdk-empty">Nothing matches “{query}”</div>}
              </div>

              <div className="cmdk-footer" aria-hidden="true">
                <span><kbd className="cmdk-kbd">↑</kbd><kbd className="cmdk-kbd">↓</kbd> navigate</span>
                <span><kbd className="cmdk-kbd">↵</kbd> open</span>
                <span className="cmdk-footer-brand"><kbd className="cmdk-kbd">{mac ? '⌘' : 'Ctrl'}</kbd><kbd className="cmdk-kbd">K</kbd></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="cmdk-toast"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}

/** Small pill beside the theme toggle that opens the palette (hover devices only). */
export function CommandPaletteTrigger() {
  const mac = useMemo(isMac, [])
  return (
    <button
      type="button"
      className="cmdk-trigger"
      onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      aria-label="Open command palette"
      title="Command palette"
    >
      <kbd>{mac ? '⌘' : 'Ctrl'}</kbd>
      <kbd>K</kbd>
    </button>
  )
}
