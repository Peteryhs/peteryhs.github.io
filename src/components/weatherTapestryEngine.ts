import {
  birdXForLane,
  getGateGeometry,
  PIPE_GAP,
  PIPE_WIDTH,
  type AmbientFlight,
} from './flappyBirdEngine'

export const TAPESTRY_CELL = 20
export const MORPH_DURATION_MS = 560

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
  white: [number, number, number]
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

type BlobShape = 'square' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'rectangle'

interface ShapeBlob {
  cx: number
  cy: number
  r: number
  cos: number
  sin: number
  from: BlobShape
  to: BlobShape
  mix: number
}

export interface TapestryRuntime {
  wake: BirdWakeDot[]
  mouseX: number
  mouseY: number
  mouseActive: boolean
  blobs: ShapeBlob[]
}

const WEATHER_CACHE_KEY = 'peter-waterloo-weather-v1'
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const

// Sampled directly from Peter's profile photo (peter-photo.jpg):
// lots of vibrant cobalt blue + lots of golden yellow + a little crisp white + a touch of diner-basket red.
// Each weather mood shifts motion, shear, rigidity, and subtle hue temperature while staying faithful to the photo.
const WEATHER_PROFILES: Record<WeatherMood, WeatherProfile> = {
  clear: {
    vx: 0.16,
    vy: -0.07,
    sx: 0.17,
    sy: 0.17,
    shear: 0.14,
    threshold: 0.55,
    rigidity: 0.54,
    coreLight: [26, 118, 226],    // diner-table cobalt blue
    rimLight: [246, 188, 38],     // golden crisp yellow
    accentLight: [226, 56, 56],   // diner-basket red touch
    coreDark: [56, 146, 252],
    rimDark: [252, 200, 62],
    accentDark: [244, 80, 76],
  },
  rain: {
    vx: -0.32,
    vy: 0.85,
    sx: 0.25,
    sy: 0.1,
    shear: 0.45,
    threshold: 0.54,
    rigidity: 0.64,
    coreLight: [22, 108, 220],    // deep cobalt blue
    rimLight: [242, 184, 42],     // warm golden yellow
    accentLight: [220, 58, 62],   // red accent
    coreDark: [52, 138, 248],
    rimDark: [250, 198, 66],
    accentDark: [240, 82, 82],
  },
  fog: {
    vx: 0.1,
    vy: 0.03,
    sx: 0.13,
    sy: 0.14,
    shear: 0.08,
    threshold: 0.5,
    rigidity: 0.46,
    coreLight: [46, 132, 230],    // airy cobalt blue
    rimLight: [248, 196, 54],     // soft golden yellow
    accentLight: [228, 66, 66],   // red accent
    coreDark: [72, 156, 252],
    rimDark: [254, 208, 78],
    accentDark: [246, 88, 86],
  },
  wind: {
    vx: 0.86,
    vy: -0.1,
    sx: 0.11,
    sy: 0.24,
    shear: -0.26,
    threshold: 0.55,
    rigidity: 0.68,
    coreLight: [30, 124, 232],    // breezy royal blue
    rimLight: [248, 190, 36],     // bright yellow
    accentLight: [232, 54, 54],   // punchy red touch
    coreDark: [60, 152, 255],
    rimDark: [255, 204, 60],
    accentDark: [248, 78, 74],
  },
  snow: {
    vx: 0.11,
    vy: 0.3,
    sx: 0.21,
    sy: 0.2,
    shear: 0.16,
    threshold: 0.58,
    rigidity: 0.58,
    coreLight: [42, 136, 234],    // crisp winter cobalt
    rimLight: [250, 200, 62],     // pale sunlit yellow
    accentLight: [226, 60, 64],   // berry red touch
    coreDark: [72, 162, 255],
    rimDark: [255, 212, 84],
    accentDark: [244, 84, 84],
  },
  dusk: {
    vx: 0.14,
    vy: -0.06,
    sx: 0.16,
    sy: 0.17,
    shear: 0.14,
    threshold: 0.55,
    rigidity: 0.54,
    coreLight: [28, 110, 222],    // evening cobalt blue
    rimLight: [244, 182, 34],     // rich amber-yellow
    accentLight: [224, 54, 58],   // red accent
    coreDark: [58, 140, 248],
    rimDark: [252, 196, 56],
    accentDark: [244, 76, 78],
  },
}

export function createTapestryRuntime(): TapestryRuntime {
  return {
    wake: [],
    mouseX: -9999,
    mouseY: -9999,
    mouseActive: false,
    blobs: [],
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
    white: isDark ? [246, 248, 252] : [255, 255, 255],
    birdBody: isDark ? [252, 200, 62] : [246, 188, 38],
    birdBeak: isDark ? [244, 80, 76] : [226, 56, 56],
    paper: isDark ? '#161618' : '#fbfaf7',
  }
}

function rgba(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

const BLOB_SHAPES: BlobShape[] = ['square', 'triangle', 'diamond', 'hexagon', 'star', 'rectangle']

function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function smoothstep(a: number, b: number, v: number): number {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

// Normalized distance: < 1 inside the shape, 1 on its edge
function shapeDistance(shape: BlobShape, x: number, y: number, r: number): number {
  const ax = Math.abs(x)
  const ay = Math.abs(y)
  switch (shape) {
    case 'square':
      return Math.max(ax, ay) / (r * 0.86)
    case 'rectangle':
      return Math.max(ax / (r * 1.25), ay / (r * 0.62))
    case 'diamond':
      return (ax + ay) / (r * 1.2)
    case 'hexagon':
      return Math.max(ax * 0.866 + ay * 0.5, ay) / (r * 0.92)
    case 'triangle':
      return Math.max(ax * 0.866 - y * 0.5, y) / (r * 0.6)
    case 'star': {
      const theta = Math.atan2(y, x) + Math.PI / 2
      const frac = ((theta / ((Math.PI * 2) / 5)) % 1 + 1) % 1
      const tip = Math.abs(frac - 0.5) * 2
      return Math.hypot(x, y) / (r * 1.1 * (0.48 + 0.52 * tip * tip))
    }
  }
}

// Randomly seeded geometric blobs that drift with the weather flow and slowly morph between shapes
function updateShapeBlobs(
  runtime: TapestryRuntime,
  cols: number,
  rows: number,
  t: number,
  profile: WeatherProfile
): void {
  const count = Math.max(6, Math.min(16, Math.round((cols * rows) / 220)))
  const pad = 8
  const spanX = cols + pad * 2
  const spanY = rows + pad * 2
  const flowX = profile.vx / profile.sx
  const flowY = profile.vy / profile.sy
  const blobs: ShapeBlob[] = []

  for (let i = 0; i < count; i++) {
    const h1 = hash01(i + 1)
    const h2 = hash01(i + 17)
    const h3 = hash01(i + 43)
    const h4 = hash01(i + 71)
    const speed = 0.7 + h3 * 0.6
    const rawX = h1 * spanX + t * flowX * speed + Math.sin(t * 0.21 + h4 * 9) * 1.6
    const rawY = h2 * spanY + t * flowY * speed + Math.cos(t * 0.17 + h1 * 9) * 1.6
    const cx = (((rawX % spanX) + spanX) % spanX) - pad
    const cy = (((rawY % spanY) + spanY) % spanY) - pad

    const period = 7 + h4 * 5
    const phase = t / period + h3 * 6
    const step = Math.floor(phase)
    const offset = Math.floor(h2 * BLOB_SHAPES.length)
    const rot = Math.sin(t * 0.14 + h1 * 6) * 0.38

    blobs.push({
      cx,
      cy,
      r: 3.4 + h4 * 3 + Math.sin(t * 0.3 + h2 * 7) * 0.4,
      cos: Math.cos(rot),
      sin: Math.sin(rot),
      from: BLOB_SHAPES[(step + offset) % BLOB_SHAPES.length],
      to: BLOB_SHAPES[(step + offset + 1) % BLOB_SHAPES.length],
      mix: smoothstep(0.62, 1, phase - step),
    })
  }
  runtime.blobs = blobs
}

function sampleFieldValue(
  gx: number,
  gy: number,
  t: number,
  profile: WeatherProfile,
  runtime: TapestryRuntime
): number {
  const px = gx * profile.sx + gy * profile.shear * 0.06 - t * profile.vx
  const py = gy * profile.sy - t * profile.vy

  // Low-amplitude organic noise keeps the blob edges feeling hand-made rather than stamped
  const organic =
    Math.sin(px * 1.05 + Math.cos(py * 0.85 + t * 0.2)) * 0.45 +
    Math.cos(py * 1.15 - Math.sin(px * 0.78 - t * 0.16)) * 0.35 +
    Math.sin((px + py) * 0.7 + t * 0.26) * 0.2
  const edgeNoise = organic * (0.03 + (1 - profile.rigidity) * 0.1)

  let best = 0
  for (const b of runtime.blobs) {
    const dx = gx + 0.5 - b.cx
    const dy = gy + 0.5 - b.cy
    const reach = b.r * 1.8
    if (dx > reach || dx < -reach || dy > reach || dy < -reach) continue
    const lx = dx * b.cos + dy * b.sin
    const ly = -dx * b.sin + dy * b.cos
    const dA = shapeDistance(b.from, lx, ly, b.r)
    const d = b.mix > 0 ? dA + (shapeDistance(b.to, lx, ly, b.r) - dA) * b.mix : dA
    const inside = 1 - (d + edgeNoise)
    if (inside > best) best = inside
  }

  let f = best > 0 ? profile.threshold - 0.09 + best * 0.55 : 0

  if (runtime.mouseActive) {
    const mx = gx * TAPESTRY_CELL + TAPESTRY_CELL * 0.5 - runtime.mouseX
    const my = gy * TAPESTRY_CELL + TAPESTRY_CELL * 0.5 - runtime.mouseY
    const dist = Math.hypot(mx, my)
    if (dist < 140 && f > 0) {
      f += Math.sin(dist * 0.09 - t * 4.5) * (1 - dist / 140) * 0.17
    }
  }

  return clamp01(f)
}

// Render the unified 20px Crisp + Soft Aura live-weather tapestry across the ENTIRE grid.
// Never carves a rectangular hole — when Flappy is active, softly dims uniformly so the game
// integrates directly onto the same living 20px canvas.
export function renderWeatherTapestry(
  bloomCtx: CanvasRenderingContext2D,
  pixelCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mood: WeatherMood,
  pal: TapestryPalette,
  timeMs: number,
  runtime: TapestryRuntime,
  dimFactor = 1
): void {
  bloomCtx.clearRect(0, 0, width, height)
  pixelCtx.clearRect(0, 0, width, height)

  const cols = Math.ceil(width / TAPESTRY_CELL)
  const rows = Math.ceil(height / TAPESTRY_CELL)
  const profile = WEATHER_PROFILES[mood]
  const t = timeMs * 0.001
  updateShapeBlobs(runtime, cols, rows, t, profile)

  // Generous balance of blue (core) & yellow (rim), plus a little crisp white & a sparse touch of red
  const rimStart = profile.threshold - 0.09
  const coreStart = profile.threshold + 0.05
  const coreFull = profile.threshold + 0.26

  for (let gy = 0; gy < rows; gy++) {
    const y = gy * TAPESTRY_CELL
    for (let gx = 0; gx < cols; gx++) {
      const val = sampleFieldValue(gx, gy, t, profile, runtime)
      if (val <= rimStart) continue

      const density = clamp01((val - rimStart) / (coreFull - rimStart))
      const bayerVal = (BAYER4[gy & 3][gx & 3] + 0.5) / 16
      if (density <= bayerVal * 0.88) continue

      const x = gx * TAPESTRY_CELL
      const coreMix = clamp01((val - coreStart) / (coreFull - coreStart))
      const isCore = coreMix > bayerVal * 0.85
      const hash = ((gx * 17 + gy * 31) & 31)
      const isRedAccent = val > coreStart + 0.06 && hash === 0
      const isWhiteTile = !isRedAccent && val > rimStart + 0.06 && (hash === 7 || hash === 19 || hash === 27)

      const rgb = isRedAccent
        ? pal.accent
        : isWhiteTile
          ? pal.white
          : isCore
            ? pal.core
            : pal.rim

      const baseAlpha = isRedAccent
        ? pal.isDark
          ? 0.58
          : 0.48
        : isWhiteTile
          ? pal.isDark
            ? 0.42
            : 0.86
          : isCore
            ? pal.isDark
              ? 0.36 + coreMix * 0.34
              : 0.28 + coreMix * 0.34
            : pal.isDark
              ? 0.32 + density * 0.28
              : 0.3 + density * 0.28

      const finalAlpha = baseAlpha * dimFactor

      if (isCore || isRedAccent || (!isWhiteTile && density > 0.55)) {
        bloomCtx.fillStyle = rgba(rgb, finalAlpha * 0.62)
        bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
      }

      // Crisp 18x18 tile centered in the 20px grid cell
      pixelCtx.fillStyle = rgba(rgb, finalAlpha)
      pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)

      // Subtle crisp rim on white tiles in light mode so they read cleanly on warm paper
      if (isWhiteTile && !pal.isDark) {
        pixelCtx.strokeStyle = rgba(pal.core, 0.22 * dimFactor)
        pixelCtx.lineWidth = 1
        pixelCtx.strokeRect(x + 1.5, y + 1.5, TAPESTRY_CELL - 3, TAPESTRY_CELL - 3)
      }
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
    const gxEnd = Math.max(gxStart + 2, Math.ceil((lane.left + gate.x + PIPE_WIDTH) / TAPESTRY_CELL))
    const gapTopRow = Math.floor((lane.top + gate.center - PIPE_GAP / 2) / TAPESTRY_CELL)
    const gapBotRow = Math.ceil((lane.top + gate.center + PIPE_GAP / 2) / TAPESTRY_CELL)

    for (let gx = Math.max(startCol, gxStart); gx < Math.min(endCol, gxEnd); gx++) {
      for (let gy = startRow; gy < endRow; gy++) {
        if (gy < gapTopRow || gy >= gapBotRow) {
          const isCap = gy === gapTopRow - 1 || gy === gapBotRow
          targets.push({
            x: gx * TAPESTRY_CELL,
            y: gy * TAPESTRY_CELL,
            kind: isCap ? 'cap' : 'pipe',
          })
        }
      }
    }
  }

  const bx = Math.floor((lane.left + birdXForLane(lane.width)) / TAPESTRY_CELL)
  const by = Math.floor((lane.top + flight.y) / TAPESTRY_CELL)
  const birdOffsets = [
    [0, 0],
    [-1, 0],
    [0, -1],
    [1, 0],
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
  const rimStart = profile.threshold - 0.05
  const coreFull = profile.threshold + 0.24

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
      if (density > bayerVal * 0.88) {
        sources.push({ x: gx * TAPESTRY_CELL, y: gy * TAPESTRY_CELL })
      }
    }
  }

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
    const perpScale = (i % 2 === 0 ? 1 : -1) * Math.min(48, Math.hypot(dx, dy) * 0.22)
    const len = Math.max(1, Math.hypot(dx, dy))

    particles.push({
      sx: src.x,
      sy: src.y,
      tx: tgt.x,
      ty: tgt.y,
      arcX: (-dy / len) * perpScale,
      arcY: (dx / len) * perpScale,
      delay: Math.min(0.22, (i / Math.max(1, targets.length)) * 0.2),
      kind: tgt.kind,
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

    const rgb =
      p.kind === 'bird'
        ? pal.birdBody
        : p.kind === 'cap'
          ? pal.rim
          : pal.core
    const alpha = p.kind === 'bird' ? 0.94 : p.kind === 'cap' ? 0.82 : 0.62

    bloomCtx.fillStyle = rgba(rgb, alpha * 0.62)
    bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
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

  // 1. Keep the tiled texture, but clip boundary cells to the actual hitboxes.
  for (const gate of flight.gates) {
    const geometry = getGateGeometry(gate)
    const left = lane.left + geometry.left
    const right = lane.left + geometry.right
    const gxStart = Math.floor(left / TAPESTRY_CELL)
    const gxEnd = Math.ceil(right / TAPESTRY_CELL)
    const dim = gate.passed ? 0.42 : 1

    const pipes = [
      { top: lane.top, bottom: lane.top + geometry.gapTop, upper: true },
      { top: lane.top + geometry.gapBottom, bottom: lane.top + lane.height, upper: false },
    ]
    for (const pipe of pipes) {
      const firstRow = Math.floor(pipe.top / TAPESTRY_CELL)
      const lastRow = Math.ceil(pipe.bottom / TAPESTRY_CELL) - 1
      for (let gx = Math.max(startCol, gxStart); gx < Math.min(endCol, gxEnd); gx++) {
        const x = Math.max(left, gx * TAPESTRY_CELL + (gx === gxStart ? 0 : 1))
        const width = Math.min(right, (gx + 1) * TAPESTRY_CELL - (gx === gxEnd - 1 ? 0 : 1)) - x
        for (let gy = Math.max(startRow, firstRow); gy <= Math.min(endRow - 1, lastRow); gy++) {
          const y = Math.max(pipe.top, gy * TAPESTRY_CELL + (gy === firstRow ? 0 : 1))
          const height = Math.min(pipe.bottom, (gy + 1) * TAPESTRY_CELL - (gy === lastRow ? 0 : 1)) - y
          if (width <= 0 || height <= 0) continue
          const isCap = gy === (pipe.upper ? lastRow : firstRow)
          const rgb = isCap ? pal.rim : pal.core
          const alpha = (isCap ? 0.88 : 0.64) * dim

          if (isCap) {
            bloomCtx.fillStyle = rgba(rgb, alpha * 0.72)
            bloomCtx.fillRect(x, y, width, height)
          }
          pixelCtx.fillStyle = rgba(rgb, alpha)
          pixelCtx.fillRect(x, y, width, height)
        }
      }
    }

    // Pulsing milestone beacon in gap center
    if (!gate.passed) {
      const cx = lane.left + gate.x + PIPE_WIDTH * 0.5
      const cy = lane.top + gate.center
      if (cx > lane.left + 12 && cx < lane.left + lane.width - 12) {
        const bx = Math.floor(cx / TAPESTRY_CELL) * TAPESTRY_CELL
        const by = Math.floor(cy / TAPESTRY_CELL) * TAPESTRY_CELL
        const pulse = 0.45 + 0.35 * Math.sin(timeMs * 0.005 + gate.id)
        bloomCtx.fillStyle = rgba(pal.accent, pulse * 0.85)
        bloomCtx.fillRect(bx, by, TAPESTRY_CELL, TAPESTRY_CELL)
        pixelCtx.fillStyle = rgba(pal.accent, pulse)
        pixelCtx.fillRect(bx + 4, by + 4, TAPESTRY_CELL - 8, TAPESTRY_CELL - 8)
      }
    }
  }

  // 2. Subtle cellular wake trail (floor picks the 20px cell containing the physics center)
  const birdGx = Math.floor((lane.left + birdXForLane(lane.width)) / TAPESTRY_CELL)
  const birdGy = Math.floor((lane.top + flight.y) / TAPESTRY_CELL)

  if (!isCrashed) {
    const last = runtime.wake[runtime.wake.length - 1]
    if (!last || last.gx !== birdGx - 1 || last.gy !== birdGy) {
      runtime.wake.push({ gx: birdGx - 1, gy: birdGy, life: 1 })
      if (runtime.wake.length > 9) runtime.wake.shift()
    }
  }

  const nextWake: BirdWakeDot[] = []
  for (const d of runtime.wake) {
    const nextLife = d.life - dtSeconds * 2.1
    if (nextLife > 0.05) {
      d.life = nextLife
      d.gx -= dtSeconds * 4.2
      nextWake.push(d)
      const wx = Math.round(d.gx) * TAPESTRY_CELL
      const wy = Math.round(d.gy) * TAPESTRY_CELL
      if (wx >= lane.left && wx < lane.left + lane.width) {
        pixelCtx.fillStyle = rgba(pal.accent, nextLife * 0.45)
        pixelCtx.fillRect(wx + 3, wy + 3, TAPESTRY_CELL - 6, TAPESTRY_CELL - 6)
      }
    }
  }
  runtime.wake = nextWake

  // 3. Center the pixel-art body on the physics circle, not a neighboring cell.
  const flashOff = isCrashed && Math.floor(timeMs / 110) % 2 === 0
  if (flashOff) return

  const wingDy = flight.velocity < -20 ? -1 : 0
  const bx = lane.left + birdXForLane(lane.width) - TAPESTRY_CELL / 2
  const by = lane.top + flight.y - TAPESTRY_CELL / 2

  // Tail / wing tile
  pixelCtx.fillStyle = rgba(pal.rim, 0.86)
  pixelCtx.fillRect(bx - TAPESTRY_CELL + 2, by + wingDy * TAPESTRY_CELL + 2, TAPESTRY_CELL - 4, TAPESTRY_CELL - 4)

  // Main bird body tile (full 20px cell)
  bloomCtx.fillStyle = rgba(pal.birdBody, 0.85)
  bloomCtx.fillRect(bx, by, TAPESTRY_CELL, TAPESTRY_CELL)
  pixelCtx.fillStyle = rgba(pal.birdBody, 0.96)
  pixelCtx.fillRect(bx + 1, by + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)

  // Beak accent on right edge
  pixelCtx.fillStyle = rgba(pal.birdBeak, 0.96)
  pixelCtx.fillRect(bx + TAPESTRY_CELL + 1, by + 5, 8, 9)

  // Crisp paper eye dot
  pixelCtx.fillStyle = pal.paper
  pixelCtx.fillRect(bx + 11, by + 4, 4, 4)
}
