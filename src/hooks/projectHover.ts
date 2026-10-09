import { useSyncExternalStore } from 'react'

// Which project card is hovered, kept outside React state so hovering a card
// re-renders only the backdrop that reacts to it, never the whole grid.
// A short hover-intent delay means sweeping the mouse across a card (or rapidly
// on and off it) doesn't flip the full-page backdrops on every pass.
const ENTER_DELAY = 60
const LEAVE_DELAY = 90

let active: string | null = null
let timer = 0
const listeners = new Set<() => void>()

export function setProjectHover(slug: string, hovered: boolean) {
  window.clearTimeout(timer)
  const next = hovered ? slug : null
  if (next === active) return
  timer = window.setTimeout(() => {
    active = next
    listeners.forEach((listener) => listener())
  }, hovered ? ENTER_DELAY : LEAVE_DELAY)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useIsProjectHovered(slug: string) {
  return useSyncExternalStore(subscribe, () => active === slug, () => false)
}

/** Drop any hover immediately, e.g. when the page under the pointer goes away. */
export function clearProjectHover() {
  window.clearTimeout(timer)
  if (active === null) return
  active = null
  listeners.forEach((listener) => listener())
}
