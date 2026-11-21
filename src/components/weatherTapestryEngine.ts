import {
  birdXForLane,
  PIPE_GAP,
  PIPE_WIDTH,
  type AmbientFlight,
} from './flappyBirdEngine'

export const TAPESTRY_CELL = 8
export const MORPH_DURATION_MS = 580

export type StageMode = 'tapestry' | 'morphing' | 'playing' | 'crashed'
export type WeatherMood = 'clear' | 'rain' | 'fog' | 'wind' | 'snow' | 'dusk'

export interface WeatherInfo {
  mood: WeatherMood
  label: string
  tempC: number | null
}

export interface LaneRect {
  left: number
  top: number
  width: number
  height: number
}

export interface TapestryPalette {
  isDark: boolean
  core: [number, number, number]
  rim: [number, number, number]
  accent: [number, number, number]
  birdBody: [number, number, number]
  birdBeak: [number, number, number]
  paper: string
}

interface WeatherProfile {
  vx: number
  vy: number
  sx: number
  sy: number
  shear: number
  threshold: number
  rigidity: number
  coreLight: [number, number, number]
  rimLight: [number, number, number]
  accentLight: [number, number, number]
  coreDark: [number, number, number]
  rimDark: [number, number, number]
  accentDark: [number, number, number]
}

export interface MorphParticle {
  sx: number
  sy: number
  tx: number
  ty: number
  arcX: number
  arcY: number
  delay: number
  kind: 'pipe' | 'cap' | 'bird' | 'dust'
}

interface BirdWakeDot {
  gx: number
  gy: number
  life: number
}

export interface TapestryRuntime {
  wake: BirdWakeDot[]
  mouseX: number
  mouseY: number
  mouseActive: boolean
}

const WEATHER_CACHE_KEY = 'peter-waterloo-weather-v1'
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const

const WEATHER_PROFILES: Record<WeatherMood, WeatherProfile> = {
  clear: {
    vx: 0.24,
    vy: -0.1,
    sx: 0.082,
    sy: 0.082,
    shear: 0.12,
    threshold: 0.55,
    rigidity: 0.52,
    coreLight: [142, 158, 204],
    rimLight: [208, 172, 124],
    accentLight: [96, 120, 186],
    coreDark: [128, 150, 224],
    rimDark: [212, 162, 94],
    accentDark: [152, 174, 240],
  },
  rain: {
    vx: -0.48,
    vy: 1.35,
    sx: 0.135,
    sy: 0.045,
    shear: 0.48,
    threshold: 0.52,
    rigidity: 0.64,
    coreLight: [108, 134, 186],
    rimLight: [154, 174, 190],
    accentLight: [82, 108, 172],
    coreDark: [104, 140, 212],
    rimDark: [124, 166, 186],
    accentDark: [138, 172, 236],
  },
  fog: {
    vx: 0.14,
    vy: 0.04,
    sx: 0.06,
    sy: 0.068,
    shear: 0.08,
    threshold: 0.47,
    rigidity: 0.42,
    coreLight: [148, 164, 174],
    rimLight: [176, 184, 166],
    accentLight: [110, 136, 148],
    coreDark: [132, 148, 164],
    rimDark: [140, 162, 146],
    accentDark: [164, 182, 198],
  },
  wind: {
    vx: 1.35,
    vy: -0.14,
    sx: 0.052,
    sy: 0.13,
    shear: -0.28,
    threshold: 0.55,
    rigidity: 0.68,
    coreLight: [132, 152, 198],
    rimLight: [204, 164, 114],
    accentLight: [90, 114, 178],
    coreDark: [126, 150, 220],
    rimDark: [212, 156, 88],
    accentDark: [150, 174, 238],
  },
  snow: {
    vx: 0.16,
    vy: 0.46,
    sx: 0.115,
    sy: 0.105,
    shear: 0.16,
    threshold: 0.6,
    rigidity: 0.58,
    coreLight: [154, 172, 204],
    rimLight: [202, 194, 180],
    accentLight: [112, 138, 188],
    coreDark: [162, 184, 224],
    rimDark: [202, 194, 180],
    accentDark: [186, 204, 238],
  },
  dusk: {
    vx: 0.2,
    vy: -0.08,
    sx: 0.076,
    sy: 0.082,
    shear: 0.14,
    threshold: 0.54,
    rigidity: 0.54,
    coreLight: [116, 128, 184],
    rimLight: [210, 148, 102],
    accentLight: [88, 104, 168],
    coreDark: [124, 136, 214],
    rimDark: [222, 150, 94],
    accentDark: [154, 168, 236],
  },
}

export function createTapestryRuntime(): TapestryRuntime {
  return {
    wake: [],
    mouseX: -9999,
    mouseY: -9999,
    mouseActive: false,
  }
}

export function getDefaultWeather(): WeatherInfo {
  const hour = new Date().getHours()
  if (hour >= 18 || hour < 6) {
    return { mood: 'dusk', label: 'Waterloo · Dusk', tempC: null }
  }
  return { mood: 'clear', label: 'Waterloo · Clear', tempC: null }
}

function classifyWmoWeather(code: number, windKmh: number, isDay: number): { mood: WeatherMood; desc: string } {
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { mood: 'snow', desc: 'Snow' }
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return { mood: 'rain', desc: 'Rain' }
  }
  if ([45, 48].includes(code)) {
    return { mood: 'fog', desc: 'Mist' }
  }
  if (windKmh >= 24) {
    return { mood: 'wind', desc: 'Windy' }
  }
  if (code === 3) {
    return { mood: 'fog', desc: 'Overcast' }
  }
  if (!isDay) {
    return { mood: 'dusk', desc: 'Clear Night' }
  }
  return { mood: 'clear', desc: code === 0 ? 'Clear' : 'Partly Cloudy' }
}

export async function fetchWaterlooWeather(signal?: AbortSignal): Promise<WeatherInfo> {
  try {
    const cachedRaw = sessionStorage.getItem(WEATHER_CACHE_KEY)
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { ts: number; info: WeatherInfo }
      if (Date.now() - cached.ts < WEATHER_CACHE_TTL_MS && cached.info?.mood) {
        return cached.info
      }
    }
  } catch {
    // ignore storage failures
  }

  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=43.4643&longitude=-80.5204&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=America%2FToronto'
    const res = await fetch(url, { signal })
    if (!res.ok) return getDefaultWeather()
    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number
        weather_code?: number
        wind_speed_10m?: number
        is_day?: number
      }
    }
    const cur = data.current
    if (!cur || typeof cur.weather_code !== 'number') return getDefaultWeather()

    const tempC = typeof cur.temperature_2m === 'number' ? Math.round(cur.temperature_2m) : null
    const windKmh = typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : 0
    const isDay = typeof cur.is_day === 'number' ? cur.is_day : 1
    const { mood, desc } = classifyWmoWeather(cur.weather_code, windKmh, isDay)
    const label = tempC !== null ? `Waterloo · ${tempC}°C · ${desc}` : `Waterloo · ${desc}`
    const info: WeatherInfo = { mood, label, tempC }

    try {
      sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ts: Date.now(), info }))
    } catch {
      // ignore storage failures
    }
    return info
  } catch {
    return getDefaultWeather()
  }
}

export function getTapestryPalette(mood: WeatherMood): TapestryPalette {
  const html = document.documentElement
  const isDark =
    html.classList.contains('dark') ||
    (!html.classList.contains('light') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  const p = WEATHER_PROFILES[mood]

  return {
    isDark,
    core: isDark ? p.coreDark : p.coreLight,
    rim: isDark ? p.rimDark : p.rimLight,
    accent: isDark ? p.accentDark : p.accentLight,
    birdBody: isDark ? [216, 166, 92] : [192, 140, 66],
    birdBeak: isDark ? [220, 126, 86] : [196, 106, 70],
    paper: isDark ? '#161618' : '#fbfaf7',
  }
}

function rgba(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

// Structured architectural triangle wave (sharper facets than pure sine blobs)
function triWave(v: number): number {
  const m = ((v / (Math.PI * 2)) % 1 + 1) % 1
  return 1 - 4 * Math.abs(m - 0.5)
}

// Evaluate structured abstract weather scalar [0..1] at grid cell (gx, gy)
function sampleFieldValue(
  gx: number,
  gy: number,
  t: number,
  profile: WeatherProfile,
  runtime: TapestryRuntime
): number {
  const px = gx * profile.sx + gy * profile.shear * 0.055 - t * profile.vx
  const py = gy * profile.sy - t * profile.vy

  // Blend crisp faceted diamond/diagonal bands with gentle harmonic wave so shapes feel structured
  const faceted =
    triWave(px * 0.92 + py * 0.34 + t * 0.14) * 0.44 +
    triWave(py * 0.98 - px * 0.42 - t * 0.11) * 0.34 +
    triWave((px - py) * 0.62 + t * 0.18) * 0.22

  const organic =
    Math.sin(px * 1.05 + Math.cos(py * 0.85 + t * 0.2)) * 0.45 +
    Math.cos(py * 1.15 - Math.sin(px * 0.78 - t * 0.16)) * 0.35 +
    Math.sin((px + py) * 0.7 + t * 0.26) * 0.2

  let f = organic * (1 - profile.rigidity) + faceted * profile.rigidity

  // Subtle architectural terracing for crisp edge definition
  const terrace = Math.round(f * 5) / 5
  f = f * 0.68 + terrace * 0.32

  // Gentle cursor ripple across the grid
  if (runtime.mouseActive) {
    const dx = gx * TAPESTRY_CELL + TAPESTRY_CELL * 0.5 - runtime.mouseX
    const dy = gy * TAPESTRY_CELL + TAPESTRY_CELL * 0.5 - runtime.mouseY
    const dist = Math.hypot(dx, dy)
    if (dist < 115) {
      f += Math.sin(dist * 0.11 - t * 4.8) * (1 - dist / 115) * 0.34
    }
  }

  return clamp01((f + 1) * 0.5)
}

// Render the full-bleed 8px Crisp + Soft Aura abstract weather tapestry across the ENTIRE grid
// (zero edge-box fade, zero white gap between outer rim and inner core!)
export function renderWeatherTapestry(
  bloomCtx: CanvasRenderingContext2D,
  pixelCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mood: WeatherMood,
  pal: TapestryPalette,
  timeMs: number,
  runtime: TapestryRuntime,
  excludeLane?: LaneRect | null
): void {
  bloomCtx.clearRect(0, 0, width, height)
  pixelCtx.clearRect(0, 0, width, height)

  const cols = Math.ceil(width / TAPESTRY_CELL)
  const rows = Math.ceil(height / TAPESTRY_CELL)
  const profile = WEATHER_PROFILES[mood]
  const t = timeMs * 0.001

  const rimStart = profile.threshold - 0.07
  const coreStart = profile.threshold + 0.06
  const coreFull = profile.threshold + 0.28

  const exLeft = excludeLane ? Math.floor(excludeLane.left / TAPESTRY_CELL) : -1
  const exRight = excludeLane ? Math.ceil((excludeLane.left + excludeLane.width) / TAPESTRY_CELL) : -1
  const exTop = excludeLane ? Math.floor(excludeLane.top / TAPESTRY_CELL) : -1
  const exBottom = excludeLane ? Math.ceil((excludeLane.top + excludeLane.height) / TAPESTRY_CELL) : -1

  for (let gy = 0; gy < rows; gy++) {
    const y = gy * TAPESTRY_CELL
    for (let gx = 0; gx < cols; gx++) {
      if (
        excludeLane &&
        gx >= exLeft &&
        gx < exRight &&
        gy >= exTop &&
        gy < exBottom
      ) {
        continue
      }

      const val = sampleFieldValue(gx, gy, t, profile, runtime)
      if (val <= rimStart) continue

      // ONE continuous silhouette density -> eliminates any white moat between rim and core!
      const density = clamp01((val - rimStart) / (coreFull - rimStart))
      const bayerVal = (BAYER4[gy & 3][gx & 3] + 0.5) / 16
      if (density <= bayerVal * 0.9) continue

      const x = gx * TAPESTRY_CELL

      // Seamless ordered-dither transition from warm rim -> cool core
      const coreMix = clamp01((val - coreStart) / (coreFull - coreStart))
      const isCore = coreMix > bayerVal * 0.85

      const rgb = isCore ? pal.core : pal.rim
      const baseAlpha = isCore
        ? pal.isDark
          ? 0.4 + coreMix * 0.36
          : 0.34 + coreMix * 0.36
        : pal.isDark
          ? 0.28 + density * 0.28
          : 0.26 + density * 0.28

      // Dim subtly outside the active Flappy lane while playing so gameplay reads crisply
      const finalAlpha = excludeLane ? baseAlpha * 0.55 : baseAlpha

      // Soft Gaussian aura behind core clusters
      if (isCore) {
        bloomCtx.fillStyle = rgba(rgb, finalAlpha * 0.72)
        bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
      }

      // Crisp 8px grid-locked pixel tile (1px hairline grout aligned with the 8px sub-grid)
      pixelCtx.fillStyle = rgba(rgb, finalAlpha)
      pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
    }
  }
}

interface TargetPixel {
  x: number
  y: number
  kind: 'pipe' | 'cap' | 'bird'
}

function collectFlappyTargets(flight: AmbientFlight, lane: LaneRect): TargetPixel[] {
  const targets: TargetPixel[] = []
  const startCol = Math.floor(lane.left / TAPESTRY_CELL)
  const endCol = Math.floor((lane.left + lane.width) / TAPESTRY_CELL)
  const startRow = Math.floor(lane.top / TAPESTRY_CELL)
  const endRow = Math.floor((lane.top + lane.height) / TAPESTRY_CELL)

  for (const gate of flight.gates) {
    const gxStart = Math.floor((lane.left + gate.x) / TAPESTRY_CELL)
    const gxEnd = Math.ceil((lane.left + gate.x + PIPE_WIDTH) / TAPESTRY_CELL)
    const gapTopRow = Math.floor((lane.top + gate.center - PIPE_GAP / 2) / TAPESTRY_CELL)
    const gapBotRow = Math.ceil((lane.top + gate.center + PIPE_GAP / 2) / TAPESTRY_CELL)

    for (let gx = Math.max(startCol, gxStart); gx < Math.min(endCol, gxEnd); gx++) {
      for (let gy = startRow; gy < endRow; gy++) {
        if (gy < gapTopRow || gy >= gapBotRow) {
          const isCap = gy === gapTopRow - 1 || gy === gapBotRow
          const isEdge = gx === gxStart || gx === gxEnd - 1
          targets.push({
            x: gx * TAPESTRY_CELL,
            y: gy * TAPESTRY_CELL,
            kind: isCap || isEdge ? 'cap' : 'pipe',
          })
        }
      }
    }
  }

  // Pixel bird cluster
  const bx = Math.round((lane.left + birdXForLane(lane.width)) / TAPESTRY_CELL)
  const by = Math.round((lane.top + flight.y) / TAPESTRY_CELL)
  const birdOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],  [0, 0],  [1, 0], [2, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ]
  for (const [dx, dy] of birdOffsets) {
    targets.push({
      x: (bx + dx) * TAPESTRY_CELL,
      y: (by + dy) * TAPESTRY_CELL,
      kind: 'bird',
    })
  }

  return targets
}

export function buildWeatherMorphParticles(
  mood: WeatherMood,
  timeMs: number,
  runtime: TapestryRuntime,
  flight: AmbientFlight,
  lane: LaneRect
): MorphParticle[] {
  const profile = WEATHER_PROFILES[mood]
  const t = timeMs * 0.001
  const rimStart = profile.threshold - 0.07
  const coreFull = profile.threshold + 0.28

  const sources: Array<{ x: number; y: number }> = []
  const startCol = Math.floor(lane.left / TAPESTRY_CELL)
  const endCol = Math.floor((lane.left + lane.width) / TAPESTRY_CELL)
  const startRow = Math.floor(lane.top / TAPESTRY_CELL)
  const endRow = Math.floor((lane.top + lane.height) / TAPESTRY_CELL)

  for (let gy = startRow; gy < endRow; gy++) {
    for (let gx = startCol; gx < endCol; gx++) {
      const val = sampleFieldValue(gx, gy, t, profile, runtime)
      if (val <= rimStart) continue
      const density = clamp01((val - rimStart) / (coreFull - rimStart))
      const bayerVal = (BAYER4[gy & 3][gx & 3] + 0.5) / 16
      if (density > bayerVal * 0.9) {
        sources.push({ x: gx * TAPESTRY_CELL, y: gy * TAPESTRY_CELL })
      }
    }
  }

  // Deterministic Fisher-Yates shuffle
  for (let i = sources.length - 1; i > 0; i--) {
    const j = Math.floor(((Math.sin(i * 19.31 + 0.7) + 1) * 0.5) * (i + 1))
    const tmp = sources[i]
    sources[i] = sources[j]
    sources[j] = tmp
  }

  const targets = collectFlappyTargets(flight, lane)
  const particles: MorphParticle[] = []

  for (let i = 0; i < targets.length; i++) {
    const tgt = targets[i]
    const src =
      sources.length > 0
        ? sources[i % sources.length]
        : {
            x: lane.left + lane.width * (0.2 + ((i * 37) % 60) / 100),
            y: lane.top + lane.height * (0.2 + ((i * 53) % 60) / 100),
          }

    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const perpScale = (i % 2 === 0 ? 1 : -1) * Math.min(44, Math.hypot(dx, dy) * 0.22)
    const len = Math.max(1, Math.hypot(dx, dy))

    particles.push({
      sx: src.x,
      sy: src.y,
      tx: tgt.x,
      ty: tgt.y,
      arcX: (-dy / len) * perpScale,
      arcY: (dx / len) * perpScale,
      delay: Math.min(0.24, (i / Math.max(1, targets.length)) * 0.22),
      kind: tgt.kind,
    })
  }

  // Extra weather pixels drift softly away as dust
  const extraCount = Math.min(48, Math.max(0, sources.length - targets.length))
  for (let i = 0; i < extraCount; i++) {
    const src = sources[targets.length + i]
    if (!src) break
    particles.push({
      sx: src.x,
      sy: src.y,
      tx: src.x + (i % 2 === 0 ? 18 : -18),
      ty: src.y - 22,
      arcX: 0,
      arcY: -8,
      delay: (i / Math.max(1, extraCount)) * 0.28,
      kind: 'dust',
    })
  }

  return particles
}

export function renderMorphOverlay(
  bloomCtx: CanvasRenderingContext2D,
  pixelCtx: CanvasRenderingContext2D,
  particles: MorphParticle[],
  progress: number,
  pal: TapestryPalette
): void {
  for (const p of particles) {
    const local = clamp01((progress - p.delay) / (1 - p.delay))
    const ease = 1 - Math.pow(1 - local, 3)
    const arc = Math.sin(ease * Math.PI)
    const x = p.sx + (p.tx - p.sx) * ease + p.arcX * arc
    const y = p.sy + (p.ty - p.sy) * ease + p.arcY * arc

    if (p.kind === 'dust') {
      const a = (1 - ease) * 0.4
      if (a > 0.02) {
        pixelCtx.fillStyle = rgba(pal.rim, a)
        pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
      }
      continue
    }

    const rgb =
      p.kind === 'bird'
        ? pal.birdBody
        : p.kind === 'cap'
          ? pal.rim
          : pal.core
    const alpha = p.kind === 'bird' ? 0.92 : p.kind === 'cap' ? 0.78 : 0.56

    if (p.kind !== 'pipe') {
      bloomCtx.fillStyle = rgba(rgb, alpha * 0.65)
      bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
    }
    pixelCtx.fillStyle = rgba(rgb, alpha)
    pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
  }
}

export function renderFlappyInLane(
  bloomCtx: CanvasRenderingContext2D,
  pixelCtx: CanvasRenderingContext2D,
  runtime: TapestryRuntime,
  flight: AmbientFlight,
  lane: LaneRect,
  pal: TapestryPalette,
  timeMs: number,
  isCrashed: boolean,
  dtSeconds: number
): void {
  const startCol = Math.floor(lane.left / TAPESTRY_CELL)
  const endCol = Math.floor((lane.left + lane.width) / TAPESTRY_CELL)
  const startRow = Math.floor(lane.top / TAPESTRY_CELL)
  const endRow = Math.floor((lane.top + lane.height) / TAPESTRY_CELL)
  const shimmer = Math.floor(timeMs / 170)

  // 1. Grid-locked 8px pixel-block pillars
  for (const gate of flight.gates) {
    const gxStart = Math.floor((lane.left + gate.x) / TAPESTRY_CELL)
    const gxEnd = Math.ceil((lane.left + gate.x + PIPE_WIDTH) / TAPESTRY_CELL)
    const gapTopRow = Math.floor((lane.top + gate.center - PIPE_GAP / 2) / TAPESTRY_CELL)
    const gapBotRow = Math.ceil((lane.top + gate.center + PIPE_GAP / 2) / TAPESTRY_CELL)
    const dim = gate.passed ? 0.45 : 1

    for (let gx = Math.max(startCol, gxStart); gx < Math.min(endCol, gxEnd); gx++) {
      for (let gy = startRow; gy < endRow; gy++) {
        if (gy >= gapTopRow && gy < gapBotRow) continue
        const isCap = gy === gapTopRow - 1 || gy === gapBotRow
        const isEdge = gx === gxStart || gx === gxEnd - 1
        const cellHash = (gx * 31 + gy * 17 + gate.id * 13 + shimmer) & 15
        if (!isCap && !isEdge && cellHash === 0) continue

        const x = gx * TAPESTRY_CELL
        const y = gy * TAPESTRY_CELL
        const rgb = isCap ? pal.rim : pal.core
        const alpha = (isCap ? 0.84 : isEdge ? 0.64 : 0.46) * dim

        if (isCap) {
          bloomCtx.fillStyle = rgba(rgb, alpha * 0.65)
          bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
        }
        pixelCtx.fillStyle = rgba(rgb, alpha)
        pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
      }
    }

    // Subtle pulsing milestone beacon in gap center
    if (!gate.passed) {
      const cx = lane.left + gate.x + PIPE_WIDTH * 0.5
      const cy = lane.top + gate.center
      if (cx > lane.left + 8 && cx < lane.left + lane.width - 8) {
        const bx = Math.floor(cx / TAPESTRY_CELL) * TAPESTRY_CELL
        const by = Math.floor(cy / TAPESTRY_CELL) * TAPESTRY_CELL
        const pulse = 0.45 + 0.35 * Math.sin(timeMs * 0.005 + gate.id)
        bloomCtx.fillStyle = rgba(pal.accent, pulse * 0.85)
        bloomCtx.fillRect(bx, by, TAPESTRY_CELL, TAPESTRY_CELL)
        pixelCtx.fillStyle = rgba(pal.accent, pulse)
        pixelCtx.fillRect(bx + 1, by + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
      }
    }
  }

  // 2. Bird cellular wake trail
  const birdGx = Math.round((lane.left + birdXForLane(lane.width)) / TAPESTRY_CELL)
  const birdGy = Math.round((lane.top + flight.y) / TAPESTRY_CELL)

  if (!isCrashed) {
    const last = runtime.wake[runtime.wake.length - 1]
    if (!last || last.gx !== birdGx - 2 || last.gy !== birdGy) {
      runtime.wake.push({ gx: birdGx - 2, gy: birdGy, life: 1 })
      if (runtime.wake.length > 14) runtime.wake.shift()
    }
  }

  const nextWake: BirdWakeDot[] = []
  for (const d of runtime.wake) {
    const nextLife = d.life - dtSeconds * 1.9
    if (nextLife > 0.04) {
      d.life = nextLife
      d.gx -= dtSeconds * 8.5
      nextWake.push(d)
      const wx = Math.round(d.gx) * TAPESTRY_CELL
      const wy = Math.round(d.gy) * TAPESTRY_CELL
      if (wx >= lane.left && wx < lane.left + lane.width) {
        pixelCtx.fillStyle = rgba(pal.rim, nextLife * 0.5)
        pixelCtx.fillRect(wx + 1, wy + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
      }
    }
  }
  runtime.wake = nextWake

  // 3. Crisp 8px grid-locked pixel bird with soft aura
  const flashOff = isCrashed && Math.floor(timeMs / 110) % 2 === 0
  if (flashOff) return

  const wingY = flight.velocity < -20 ? -1 : 1
  const birdCells: Array<[number, number, [number, number, number], number]> = [
    [-1, -1, pal.birdBody, 0.82],
    [0, -1, pal.birdBody, 0.94],
    [1, -1, pal.birdBody, 0.94],
    [-1, 0, pal.accent, 0.88],
    [0, 0, pal.birdBody, 0.98],
    [1, 0, pal.birdBody, 0.98],
    [2, 0, pal.birdBeak, 0.96],
    [-1, wingY, pal.accent, 0.78],
    [0, 1, pal.birdBody, 0.9],
    [1, 1, pal.birdBody, 0.86],
  ]

  for (const [dx, dy, rgb, a] of birdCells) {
    const px = (birdGx + dx) * TAPESTRY_CELL
    const py = (birdGy + dy) * TAPESTRY_CELL
    bloomCtx.fillStyle = rgba(rgb, a * 0.75)
    bloomCtx.fillRect(px, py, TAPESTRY_CELL, TAPESTRY_CELL)
    pixelCtx.fillStyle = rgba(rgb, a)
    pixelCtx.fillRect(px + 1, py + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
  }

  // Crisp paper eye dot
  pixelCtx.fillStyle = pal.paper
  pixelCtx.fillRect((birdGx + 1) * TAPESTRY_CELL + 2, (birdGy - 1) * TAPESTRY_CELL + 2, 3, 3)
}
