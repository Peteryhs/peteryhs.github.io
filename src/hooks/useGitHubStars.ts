import { useEffect, useState } from 'react'

interface StarCount {
  count: number | null
  status: 'loading' | 'live' | 'cached' | 'unavailable'
  updatedAt: number | null
}

interface CachedCount {
  count: number
  updatedAt: number
}

const FRESH_FOR = 15 * 60 * 1000
const KEEP_FOR = 24 * 60 * 60 * 1000
const PREFIX = 'peter:github-stars:v1:'
const memory = new Map<string, CachedCount>()
const pending = new Map<string, Promise<StarCount>>()
const retryAt = new Map<string, number>()
const loading: StarCount = { count: null, status: 'loading', updatedAt: null }

function readCache(repo: string): CachedCount | null {
  let cached = memory.get(repo)
  if (!cached && typeof window !== 'undefined') {
    try {
      const value = JSON.parse(localStorage.getItem(PREFIX + repo) || 'null')
      if (value && Number.isSafeInteger(value.count) && value.count >= 0 &&
        Number.isFinite(value.updatedAt) && value.updatedAt <= Date.now()) {
        cached = value
        memory.set(repo, value)
      }
    } catch { /* Storage may be disabled; the memory cache still works. */ }
  }
  return cached && Date.now() - cached.updatedAt < KEEP_FOR ? cached : null
}

function fallback(repo: string): StarCount {
  const cached = readCache(repo)
  return cached ? { ...cached, status: 'cached' } : { count: null, status: 'unavailable', updatedAt: null }
}

async function fetchStars(repo: string): Promise<StarCount> {
  const cached = readCache(repo)
  if (cached && Date.now() - cached.updatedAt < FRESH_FOR) return { ...cached, status: 'cached' }
  const existing = pending.get(repo)
  if (existing) return existing
  if (Date.now() < (retryAt.get(repo) || 0)) return fallback(repo)

  const request = (async (): Promise<StarCount> => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    try {
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Invalid repository')
      const response = await fetch(`https://api.github.com/repos/${repo.split('/').map(encodeURIComponent).join('/')}`, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) {
        const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000
        const retry = Number(response.headers.get('retry-after')) * 1000
        retryAt.set(repo, Math.max(Date.now() + 60000, reset || 0, Date.now() + (retry || 0)))
        throw new Error('GitHub unavailable')
      }
      const data = await response.json()
      if (!Number.isSafeInteger(data.stargazers_count) || data.stargazers_count < 0) throw new Error('Invalid star count')
      const value = { count: data.stargazers_count as number, updatedAt: Date.now() }
      memory.set(repo, value)
      retryAt.delete(repo)
      try { localStorage.setItem(PREFIX + repo, JSON.stringify(value)) } catch { /* Use memory only. */ }
      return { ...value, status: 'live' }
    } catch {
      if (!retryAt.has(repo)) retryAt.set(repo, Date.now() + 60000)
      return fallback(repo)
    } finally {
      window.clearTimeout(timeout)
    }
  })()
  pending.set(repo, request)
  try { return await request } finally { pending.delete(repo) }
}

export function useGitHubStars(repo: string): StarCount {
  const [stars, setStars] = useState<StarCount>(() => {
    const cached = readCache(repo)
    return cached ? { ...cached, status: 'cached' } : loading
  })

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      if (document.hidden) return
      const next = await fetchStars(repo)
      if (!cancelled) setStars(next)
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, FRESH_FOR)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [repo])

  return stars
}
