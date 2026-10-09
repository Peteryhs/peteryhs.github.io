import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { projectsData } from '../content/projects'
import { clearProjectHover } from './projectHover'

/**
 * Tiny hash router for project case studies (#/work/<slug>).
 * Hash URLs keep GitHub Pages happy (no 404 fallback needed) and every case
 * study stays shareable. Navigation runs through the View Transitions API
 * when it's available, so the project card morphs into the page header.
 */
export type Route = { name: 'home' } | { name: 'project'; slug: string }

const HOME: Route = { name: 'home' }
const HOME_SCROLL_KEY = 'peter_home_scroll'

export const projectHref = (slug: string) => `#/work/${slug}`

function parse(hash: string): Route {
  const match = /^#\/work\/([\w-]+)\/?$/.exec(hash)
  if (match && projectsData.some((p) => p.slug === match[1])) {
    return { name: 'project', slug: match[1] }
  }
  return HOME
}

const sameRoute = (a: Route, b: Route) =>
  a.name === b.name && (a.name === 'home' || a.slug === (b as { slug: string }).slug)

let current: Route = typeof window === 'undefined' ? HOME : parse(window.location.hash)
const listeners = new Set<() => void>()
let pendingSource: HTMLElement | null = null

const emit = () => listeners.forEach((listener) => listener())

/* ---------- view transition helpers ---------- */

type ViewTransitionLike = { finished: Promise<void>; ready: Promise<void> }
type DocWithVT = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike
}

const NAMES = {
  surface: 'case-surface',
  title: 'case-title',
  content: 'case-content',
} as const

const named = new Set<HTMLElement>()
let titleFont = { old: 0, new: 0 }

const fontSizeOf = (el: Element | null | undefined) =>
  el ? parseFloat(getComputedStyle(el).fontSize) || 0 : 0

function nameEl(el: Element | null | undefined, name: string) {
  if (!(el instanceof HTMLElement)) return
  el.style.viewTransitionName = name
  named.add(el)
}

function clearNames() {
  named.forEach((el) => {
    el.style.viewTransitionName = ''
  })
  named.clear()
}

const inViewport = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < window.innerHeight && r.width > 0
}

/** Find the home-page card for a project, preferring one on screen. */
function findCard(slug: string): HTMLElement | null {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(`[data-project-card="${slug}"]`))
  return cards.find(inViewport) ?? null
}

/** Name the case study header, if it's on screen. */
function nameHero(): number {
  const hero = document.querySelector<HTMLElement>('.case-hero')
  if (!hero || !inViewport(hero)) return 0
  nameEl(hero, NAMES.surface)
  nameEl(hero.querySelector('.case-hero-inner'), NAMES.content)
  const title = hero.querySelector('.case-title-text')
  nameEl(title, NAMES.title)
  return fontSizeOf(title)
}

/** Give a card the same transition names as the case study header. */
function nameCard(card: HTMLElement | null): number {
  if (!card) return 0
  nameEl(card, NAMES.surface)
  nameEl(card.querySelector('.project-card-inner'), NAMES.content)
  const title = card.querySelector('.project-title-text')
  nameEl(title, NAMES.title)
  return fontSizeOf(title)
}

/** Scale the two title snapshots by the real font-size ratio. */
function animateTitle() {
  const { old: a, new: b } = titleFont
  if (!a || !b) return
  const ratio = b / a
  const timing = { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' as const }
  const root = document.documentElement
  titleAnims = [
    root.animate({ transform: ['scale(1)', `scale(${ratio})`] }, { ...timing, pseudoElement: '::view-transition-old(case-title)' }),
    root.animate({ transform: [`scale(${1 / ratio})`, 'scale(1)'] }, { ...timing, pseudoElement: '::view-transition-new(case-title)' }),
  ]
}
let titleAnims: Animation[] = []

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function restoreScroll(next: Route) {
  if (next.name === 'home') {
    const saved = Number(sessionStorage.getItem(HOME_SCROLL_KEY) ?? 0)
    // 'instant' overrides the site's scroll-behavior: smooth, which would
    // otherwise glide across the whole page mid-transition.
    window.scrollTo({ top: Number.isFinite(saved) ? saved : 0, behavior: 'instant' })
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}

// The route a running transition is heading to. popstate and hashchange both
// fire for one back press, and the second must not restart the transition.
let target: Route | null = null

function transitionTo(next: Route): Promise<void> {
  if (sameRoute(next, target ?? current)) return Promise.resolve()
  const from = current
  target = next

  if (from.name === 'home') {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))
  }

  const commit = () => {
    target = null
    // The hovered card is about to vanish without a mouseleave; drop its
    // full-page backdrop so it doesn't follow us onto the case study.
    clearProjectHover()
    current = next
    flushSync(emit)
    restoreScroll(next)
  }

  const doc = document as DocWithVT
  if (!doc.startViewTransition || prefersReducedMotion() || document.visibilityState !== 'visible') {
    pendingSource = null
    commit()
    return Promise.resolve()
  }

  const root = document.documentElement
  root.dataset.vt =
    from.name === 'home' ? 'open' : next.name === 'home' ? 'close' : 'swap'

  // Old state: the card (opening) or the header (closing) that will morph.
  // Project → project just slides, with nothing named.
  titleFont = { old: 0, new: 0 }
  if (from.name === 'home' && next.name === 'project') {
    const source = pendingSource && inViewport(pendingSource) ? pendingSource : findCard(next.slug)
    titleFont.old = nameCard(source)
  } else if (from.name === 'project' && next.name === 'home') {
    titleFont.old = nameHero()
  }
  pendingSource = null

  let committed: () => void = () => {}
  const done = new Promise<void>((resolve) => (committed = resolve))
  const transition = doc.startViewTransition(() => {
    clearNames()
    commit()
    committed()
    // New state: the header (opening) or the card we land on (closing).
    if (from.name === 'home' && next.name === 'project') {
      titleFont.new = nameHero()
    } else if (from.name === 'project' && next.name === 'home') {
      titleFont.new = nameCard(findCard(from.slug))
    }
  })

  transition.ready.then(animateTitle).catch(() => {})
  transition.finished.finally(() => {
    titleAnims.forEach((a) => a.cancel())
    titleAnims = []
    clearNames()
    delete root.dataset.vt
    committed()
  })
  return done
}

/* ---------- public API ---------- */

/** Resolves once the new route is on screen (before any animation ends). */
export function navigate(route: Route, source?: HTMLElement | null): Promise<void> {
  if (sameRoute(route, current)) return Promise.resolve()
  pendingSource = source ?? null
  const url = route.name === 'home' ? window.location.pathname + window.location.search : projectHref(route.slug)
  // depth = how many case-study entries sit above the home entry we came from.
  const prevDepth = (history.state as { depth?: number } | null)?.depth
  const depth =
    route.name === 'home' ? 0 : current.name === 'home' ? 1 : prevDepth ? prevDepth + 1 : 0
  history.pushState(depth ? { depth } : null, '', url)
  return transitionTo(route)
}

export const openProject = (slug: string, source?: HTMLElement | null) =>
  navigate({ name: 'project', slug }, source)

export const getRoute = () => current

export const goHome = () => {
  // Opened from the home page in this tab: pop back to it, so the browser's
  // own back button and ours agree and the home scroll position comes back.
  const depth = (history.state as { depth?: number } | null)?.depth ?? 0
  if (depth > 0) {
    history.go(-depth)
    return
  }
  navigate(HOME)
}

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  const sync = () => transitionTo(parse(window.location.hash))
  window.addEventListener('popstate', sync)
  window.addEventListener('hashchange', sync)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => current, () => HOME)
}
