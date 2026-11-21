import {
  birdXForLane,
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
  holdMs: number
  morphMs: number
  driftX: number
  driftY: number
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

type ShapeName = 'square' | 'triangle' | 'rectangle' | 'star' | 'diamond' | 'cross' | 'ring' | 'hexagon'
type CellRole = 'blue' | 'yellow' | 'white' | 'red'

interface ShapeCell {
  dx: number
  dy: number
  role: CellRole
}

interface ClusterState {
  fromShape: ShapeName
  toShape: ShapeName
  phaseStartMs: number
  morphing: boolean
  holdDurationMs: number
  seed: number
}

export interface TapestryRuntime {
  wake: BirdWakeDot[]
  mouseX: number
  mouseY: number
  mouseActive: boolean
  clusters: [ClusterState, ClusterState]
}

const WEATHER_CACHE_KEY = 'peter-waterloo-weather-v1'
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000

const SHAPE_NAMES: ShapeName[] = ['square', 'triangle', 'rectangle', 'star', 'diamond', 'cross', 'ring', 'hexagon']

// Sampled directly from Peter's profile photo (peter-photo.jpg):
// lots of vibrant cobalt blue + lots of golden yellow + a little crisp white + a touch of diner-basket red.
// Each weather mood shifts motion, shear, rigidity, and subtle hue temperature while staying faithful to the photo.
const WEATHER_PROFILES: Record<WeatherMood, WeatherProfile> = {
  clear: {
    holdMs: 3400,
    morphMs: 1150,
    driftX: 14,
    driftY: 12,
    coreLight: [26, 118, 226],    // diner-table cobalt blue
    rimLight: [246, 188, 38],     // golden crisp yellow
    accentLight: [226, 56, 56],   // diner-basket red touch
    coreDark: [56, 146, 252],
    rimDark: [252, 200, 62],
    accentDark: [244, 80, 76],
  },
  rain: {
    holdMs: 2800,
    morphMs: 980,
    driftX: 8,
    driftY: 22,
    coreLight: [22, 108, 220],    // deep cobalt blue
    rimLight: [242, 184, 42],     // warm golden yellow
    accentLight: [220, 58, 62],   // red accent
    coreDark: [52, 138, 248],
    rimDark: [250, 198, 66],
    accentDark: [240, 82, 82],
  },
  fog: {
    holdMs: 4200,
    morphMs: 1400,
    driftX: 10,
    driftY: 8,
    coreLight: [46, 132, 230],    // airy cobalt blue
    rimLight: [248, 196, 54],     // soft golden yellow
    accentLight: [228, 66, 66],   // red accent
    coreDark: [72, 156, 252],
    rimDark: [254, 208, 78],
    accentDark: [246, 88, 86],
  },
  wind: {
    holdMs: 2500,
    morphMs: 880,
    driftX: 26,
    driftY: 10,
    coreLight: [30, 124, 232],    // breezy royal blue
    rimLight: [248, 190, 36],     // bright yellow
    accentLight: [232, 54, 54],   // punchy red touch
    coreDark: [60, 152, 255],
    rimDark: [255, 204, 60],
    accentDark: [248, 78, 74],
  },
  snow: {
    holdMs: 4400,
    morphMs: 1450,
    driftX: 10,
    driftY: 16,
    coreLight: [42, 136, 234],    // crisp winter cobalt
    rimLight: [250, 200, 62],     // pale sunlit yellow
    accentLight: [226, 60, 64],   // berry red touch
    coreDark: [72, 162, 255],
    rimDark: [255, 212, 84],
    accentDark: [244, 84, 84],
  },
  dusk: {
    holdMs: 3600,
    morphMs: 1200,
    driftX: 12,
    driftY: 10,
    coreLight: [28, 110, 222],    // evening cobalt blue
    rimLight: [244, 182, 34],     // rich amber-yellow
    accentLight: [224, 54, 58],   // red accent
    coreDark: [58, 140, 248],
    rimDark: [252, 196, 56],
    accentDark: [244, 76, 78],
  },
}

function shapeCoords(name: ShapeName): Array<[number, number]> {
  const coords: Array<[number, number]> = []
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      const ax = Math.abs(x)
      const ay = Math.abs(y)
      let inside = false
      if (name === 'square') inside = x >= -3 && x <= 2 && y >= -3 && y <= 2
      else if (name === 'rectangle') inside = x >= -4 && x <= 3 && y >= -2 && y <= 1
      else if (name === 'triangle') inside = y >= -3 && y <= 2 && ax <= y + 3
      else if (name === 'diamond') inside = ax + ay <= 4
      else if (name === 'star')
        inside = (ax <= 1 && ay <= 1) || (ax === 0 && ay <= 4) || (ay === 0 && ax <= 4) || (ax === 2 && ay === 2)
      else if (name === 'cross') inside = ax <= 3 && ay <= 3 && (ax <= 1 || ay <= 1)
      else if (name === 'ring') inside = Math.max(ax, ay) >= 2 && Math.max(ax, ay) <= 3 && ax + ay <= 5
      else inside = ax <= 3 && ay <= 3 && ax + ay <= 5
      if (inside) coords.push([x, y])
    }
  }
  // Angular sort so blocks fan cleanly between shapes instead of crossing chaotically
  coords.sort((a, b) => {
    const d = Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])
    return Math.abs(d) > 0.01 ? d : Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1])
  })
  return coords
}

// Structured color grammar, lit from the top-left:
// White specular bevel on the leading edge -> Yellow sunlit band -> one Red hinge where yellow meets blue -> Blue body.
function buildShapeCells(name: ShapeName): ShapeCell[] {
  const coords = shapeCoords(name)
  const key = (x: number, y: number) => x + ',' + y
  const set = new Set(coords.map(([x, y]) => key(x, y)))
  let minD = Infinity
  let maxD = -Infinity
  for (const [x, y] of coords) {
    minD = Math.min(minD, x + y)
    maxD = Math.max(maxD, x + y)
  }
  const span = Math.max(1, maxD - minD)

  const cells: ShapeCell[] = coords.map(([dx, dy]) => {
    const n = (dx + dy - minD) / span
    const leading = !set.has(key(dx - 1, dy)) || !set.has(key(dx, dy - 1))
    let role: CellRole = 'blue'
    if (n < 0.2 && leading) role = 'white'
    else if (n < 0.48) role = 'yellow'
    return { dx, dy, role }
  })

  // Exactly one red hinge: the top-right-most outer yellow cell bordering blue
  let best = -1
  let bestScore = -Infinity
  cells.forEach((c, i) => {
    if (c.role !== 'yellow') return
    const outer = !set.has(key(c.dx + 1, c.dy)) || !set.has(key(c.dx, c.dy - 1))
    if (!outer) return
    const score = c.dx - c.dy * 0.5
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  })
  if (best >= 0) cells[best].role = 'red'
  return cells
}

const SHAPE_LIBRARY = Object.fromEntries(SHAPE_NAMES.map((n) => [n, buildShapeCells(n)])) as Record<
  ShapeName,
  ShapeCell[]
>

function nextRandomShape(current: ShapeName, other: ShapeName): ShapeName {
  const candidates = SHAPE_NAMES.filter((s) => s !== current && s !== other)
  return candidates[Math.floor(Math.random() * candidates.length)] ?? 'star'
}

export function createTapestryRuntime(): TapestryRuntime {
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  return {
    wake: [],
    mouseX: -9999,
    mouseY: -9999,
    mouseActive: false,
    clusters: [
      { fromShape: 'diamond', toShape: 'diamond', phaseStartMs: now - 1200, morphing: false, holdDurationMs: 3200, seed: 11 },
      { fromShape: 'square', toShape: 'square', phaseStartMs: now - 2600, morphing: false, holdDurationMs: 3700, seed: 47 },
    ],
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

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function roleToRgb(role: CellRole, pal: TapestryPalette): [number, number, number] {
  if (role === 'blue') return pal.core
  if (role === 'yellow') return pal.rim
  if (role === 'white') return pal.white
  return pal.accent
}

function roleAlpha(role: CellRole, isDark: boolean): number {
  if (role === 'red') return isDark ? 0.84 : 0.78
  if (role === 'white') return isDark ? 0.68 : 0.94
  if (role === 'yellow') return isDark ? 0.74 : 0.68
  return isDark ? 0.72 : 0.64
}

function advanceClusters(runtime: TapestryRuntime, timeMs: number, profile: WeatherProfile): void {
  runtime.clusters.forEach((c, i) => {
    const other = runtime.clusters[1 - i]
    const elapsed = timeMs - c.phaseStartMs
    if (!c.morphing && elapsed >= c.holdDurationMs) {
      c.fromShape = c.toShape
      c.toShape = nextRandomShape(c.toShape, other.toShape)
      c.morphing = true
      c.phaseStartMs = timeMs
    } else if (c.morphing && elapsed >= profile.morphMs) {
      c.fromShape = c.toShape
      c.morphing = false
      c.phaseStartMs = timeMs
      c.seed += 1
      c.holdDurationMs = profile.holdMs + Math.random() * 900
    }
  })
}

interface LiveBlock {
  x: number
  y: number
  rgb: [number, number, number]
  isWhite: boolean
  alpha: number
}

function sampleLiveClusterBlocks(
  lane: LaneRect,
  mood: WeatherMood,
  pal: TapestryPalette,
  timeMs: number,
  runtime: TapestryRuntime
): LiveBlock[] {
  const profile = WEATHER_PROFILES[mood]
  advanceClusters(runtime, timeMs, profile)
  const t = timeMs * 0.001
  const dX = profile.driftX / TAPESTRY_CELL
  const dY = profile.driftY / TAPESTRY_CELL

  // Both sculptures stay centered in the open right-side lane, never behind the About cards
  const anchors = [
    {
      gx: Math.round((lane.left + lane.width * 0.5) / TAPESTRY_CELL + Math.sin(t * 0.42) * dX),
      gy: Math.round((lane.top + lane.height * 0.3) / TAPESTRY_CELL + Math.cos(t * 0.34) * dY),
    },
    {
      gx: Math.round((lane.left + lane.width * 0.5) / TAPESTRY_CELL + Math.cos(t * 0.38 + 1.4) * dX),
      gy: Math.round((lane.top + lane.height * 0.7) / TAPESTRY_CELL + Math.sin(t * 0.31 + 0.9) * dY),
    },
  ]

  const blocks: LiveBlock[] = []
  runtime.clusters.forEach((cluster, i) => {
    const anchor = anchors[i]
    const from = SHAPE_LIBRARY[cluster.fromShape]
    const to = SHAPE_LIBRARY[cluster.toShape]
    const count = Math.max(from.length, to.length)
    const raw = cluster.morphing ? clamp01((timeMs - cluster.phaseStartMs) / profile.morphMs) : 1

    for (let k = 0; k < count; k++) {
      const a = from[k % from.length]
      const b = to[k % to.length]
      const delay = (k / count) * 0.24
      const local = cluster.morphing ? clamp01((raw - delay) / (1 - delay)) : 1
      const ease = 1 - Math.pow(1 - local, 3)

      // Extra blocks fade in/out so resting shapes never stack duplicate tiles
      const inFrom = k < from.length
      const inTo = k < to.length
      const presence = inFrom && inTo ? 1 : inTo ? ease : 1 - ease
      if (presence <= 0.01) continue

      const sx = (anchor.gx + a.dx) * TAPESTRY_CELL
      const sy = (anchor.gy + a.dy) * TAPESTRY_CELL
      const tx = (anchor.gx + b.dx) * TAPESTRY_CELL
      const ty = (anchor.gy + b.dy) * TAPESTRY_CELL
      let x = sx + (tx - sx) * ease
      let y = sy + (ty - sy) * ease

      if (local > 0 && local < 1) {
        const arc = Math.sin(ease * Math.PI) * 14 * (k % 2 === 0 ? 1 : -1)
        const len = Math.max(1, Math.hypot(tx - sx, ty - sy))
        x += (-(ty - sy) / len) * arc
        y += ((tx - sx) / len) * arc
      }

      if (runtime.mouseActive) {
        const mdx = x + TAPESTRY_CELL * 0.5 - runtime.mouseX
        const mdy = y + TAPESTRY_CELL * 0.5 - runtime.mouseY
        const dist = Math.hypot(mdx, mdy)
        if (dist < 110 && dist > 1) {
          const push = (1 - dist / 110) * 12
          x += (mdx / dist) * push
          y += (mdy / dist) * push
        }
      }

      const role = ease > 0.5 ? b.role : a.role
      const rgb = cluster.morphing ? lerpRgb(roleToRgb(a.role, pal), roleToRgb(b.role, pal), ease) : roleToRgb(b.role, pal)
      const breathe = 0.92 + 0.08 * Math.sin(t * 1.4 + k * 0.25 + i * 2)
      blocks.push({ x, y, rgb, isWhite: role === 'white', alpha: roleAlpha(role, pal.isDark) * breathe * presence })
    }
  })
  return blocks
}

// Two floating 20px-block geometric sculptures in the open right-side lane that morph at random between
// square, triangle, rectangle, star, diamond, cross, ring and hexagon. Live weather sets cadence and drift.
export function renderWeatherTapestry(
  bloomCtx: CanvasRenderingContext2D,
  pixelCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mood: WeatherMood,
  pal: TapestryPalette,
  timeMs: number,
  runtime: TapestryRuntime,
  dimFactor = 1,
  lane: LaneRect | null = null
): void {
  bloomCtx.clearRect(0, 0, width, height)
  pixelCtx.clearRect(0, 0, width, height)
  if (!lane) return

  for (const b of sampleLiveClusterBlocks(lane, mood, pal, timeMs, runtime)) {
    const alpha = b.alpha * dimFactor
    if (alpha <= 0.015) continue
    if (!b.isWhite) {
      bloomCtx.fillStyle = rgba(b.rgb, alpha * 0.62)
      bloomCtx.fillRect(b.x, b.y, TAPESTRY_CELL, TAPESTRY_CELL)
    }
    pixelCtx.fillStyle = rgba(b.rgb, alpha)
    pixelCtx.fillRect(b.x + 1, b.y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
    if (b.isWhite && !pal.isDark) {
      pixelCtx.strokeStyle = rgba(pal.core, 0.24 * dimFactor)
      pixelCtx.lineWidth = 1
      pixelCtx.strokeRect(b.x + 1.5, b.y + 1.5, TAPESTRY_CELL - 3, TAPESTRY_CELL - 3)
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
  const sources = sampleLiveClusterBlocks(lane, mood, getTapestryPalette(mood), timeMs, runtime).map((b) => ({
    x: b.x,
    y: b.y,
  }))

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

  // 1. Vibrant 20px grid-locked pixel pillars spanning the full right-side height
  for (const gate of flight.gates) {
    const gxStart = Math.floor((lane.left + gate.x) / TAPESTRY_CELL)
    const gxEnd = Math.max(gxStart + 2, Math.ceil((lane.left + gate.x + PIPE_WIDTH) / TAPESTRY_CELL))
    const gapTopRow = Math.floor((lane.top + gate.center - PIPE_GAP / 2) / TAPESTRY_CELL)
    const gapBotRow = Math.ceil((lane.top + gate.center + PIPE_GAP / 2) / TAPESTRY_CELL)
    const dim = gate.passed ? 0.42 : 1

    for (let gx = Math.max(startCol, gxStart); gx < Math.min(endCol, gxEnd); gx++) {
      for (let gy = startRow; gy < endRow; gy++) {
        if (gy >= gapTopRow && gy < gapBotRow) continue
        const isCap = gy === gapTopRow - 1 || gy === gapBotRow
        const x = gx * TAPESTRY_CELL
        const y = gy * TAPESTRY_CELL
        const rgb = isCap ? pal.rim : pal.core
        const alpha = (isCap ? 0.88 : 0.64) * dim

        if (isCap) {
          bloomCtx.fillStyle = rgba(rgb, alpha * 0.72)
          bloomCtx.fillRect(x, y, TAPESTRY_CELL, TAPESTRY_CELL)
        }
        pixelCtx.fillStyle = rgba(rgb, alpha)
        pixelCtx.fillRect(x + 1, y + 1, TAPESTRY_CELL - 2, TAPESTRY_CELL - 2)
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

  // 3. Crisp 20px grid-locked pixel bird with warm glow
  const flashOff = isCrashed && Math.floor(timeMs / 110) % 2 === 0
  if (flashOff) return

  const wingDy = flight.velocity < -20 ? -1 : 0
  const bx = birdGx * TAPESTRY_CELL
  const by = birdGy * TAPESTRY_CELL

  // Tail / wing tile
  pixelCtx.fillStyle = rgba(pal.rim, 0.86)
  pixelCtx.fillRect((birdGx - 1) * TAPESTRY_CELL + 2, (birdGy + wingDy) * TAPESTRY_CELL + 2, TAPESTRY_CELL - 4, TAPESTRY_CELL - 4)

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
