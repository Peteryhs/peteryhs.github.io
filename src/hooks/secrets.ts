import { useSyncExternalStore } from 'react'

/**
 * The small hidden details scattered around the page. Finding one is remembered
 * in localStorage, and the footer quietly keeps count. Nothing announces a find:
 * the count is there for whoever scrolls to the end and wonders what they missed.
 */
export const SECRETS = [
  { id: 'flappy', name: 'Flew through the weather', where: 'About' },
  { id: 'streak', name: 'Lit the streak', where: 'About' },
  { id: 'derez', name: 'De-rezzed Peter', where: 'About' },
  { id: 'crossref', name: 'Traced a tool', where: 'Experience' },
  { id: 'miner', name: 'Mined a block', where: 'Hobbies' },
  { id: 'diamonds', name: 'Diamonds!', where: 'Hobbies' },
  { id: 'honk', name: 'Got honked at', where: 'Footer' },
  { id: 'bounce', name: 'Pulled past the end', where: 'The very bottom' },
  { id: 'palette', name: 'Found the palette', where: 'Anywhere' },
] as const

export type SecretId = (typeof SECRETS)[number]['id']

interface SecretsState {
  found: ReadonlySet<SecretId>
}

const KEY = 'peter-site-secrets-v1'

function load(): Set<SecretId> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    const valid = new Set<string>(SECRETS.map((s) => s.id))
    return new Set(Array.isArray(raw) ? (raw.filter((id) => valid.has(id)) as SecretId[]) : [])
  } catch {
    return new Set()
  }
}

let state: SecretsState = { found: typeof window === 'undefined' ? new Set() : load() }
const listeners = new Set<() => void>()

function commit(next: SecretsState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify([...next.found]))
  } catch {
    // Storage is unavailable; keep the count for this visit only.
  }
  listeners.forEach((listener) => listener())
}

export function discover(id: SecretId) {
  if (state.found.has(id)) return
  commit({ found: new Set(state.found).add(id) })
}

export function resetSecrets() {
  commit({ found: new Set() })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSecrets(): SecretsState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
