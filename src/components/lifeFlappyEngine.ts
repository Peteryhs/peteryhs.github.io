import {
  birdXForLane,
  PIPE_GAP,
  PIPE_WIDTH,
  type AmbientFlight,
} from './flappyBirdEngine'

export const LIFE_CELL = 10
export const MORPH_DURATION_MS = 560

export type StageMode = 'life' | 'morphing' | 'playing' | 'crashed'

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

export interface BirdTrailDot {
  x: number
  y: number
  life: number
}

export interface LifeBoard {
  cols: number
  rows: number
  width: number
  height: number
  alive: Uint8Array
  next: Uint8Array
  age: Uint16Array
  trail: Float32Array
  stepAccum: number
  generation: number
  stagnantTicks: number
  lastHash: number
  trailDots: BirdTrailDot[]
}

export interface Palette {
  isDark: boolean
  paper: string
  ink: string
  ochre: [number, number, number]
  slate: [number, number, number]
  sage: [number, number, number]
  warmInk: [number, number, number]
}

export function getThemePalette(): Palette {
  const root = document.documentElement
  const isDark =
    root.classList.contains('dark') ||
    (!root.classList.contains('light') &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    return {
      isDark: true,
      paper: '#161618',
      ink: '#f2eee8',
      ochre: [212, 162, 88],
      slate: [130, 152, 232],
      sage: [108, 180, 142],
      warmInk: [216, 206, 192],
    }
  }
  return {
    isDark: false,
    paper: '#fbfaf7',
    ink: '#222222',
    ochre: [176, 128, 58],
    slate: [74, 96, 174],
    sage: [68, 126, 98],
    warmInk: [88, 82, 74],
  }
}

function rgba(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`
}

// Curated artistic Life motifs (gliders, R-pentomino, lightweight spaceship, acorn, toad)
const PATTERNS: Array<Array<[number, number]>> = [
  // R-pentomino (organic blooms)
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  // Glider SE
  [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // Glider SW
  [
    [1, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // Lightweight spaceship
  [
    [1, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
  ],
  // Acorn (long artistic evolution)
  [
    [1, 0],
    [3, 1],
    [0, 2],
    [1, 2],
    [4, 2],
    [5, 2],
    [6, 2],
  ],
]

function stampPattern(
  board: LifeBoard,
  pattern: Array<[number, number]>,
  ox: number,
  oy: number,
  initialTrail = 0.72
): void {
  for (const [dx, dy] of pattern) {
    const c = ox + dx
    const r = oy + dy
    if (c >= 2 && c < board.cols - 2 && r >= 2 && r < board.rows - 2) {
      const idx = r * board.cols + c
      board.alive[idx] = 1
      board.age[idx] = 1
      board.trail[idx] = Math.max(board.trail[idx], initialTrail)
    }
  }
}

export function createLifeBoard(width: number, height: number): LifeBoard {
  const cols = Math.max(16, Math.floor(width / LIFE_CELL))
  const rows = Math.max(18, Math.floor(height / LIFE_CELL))
  const size = cols * rows
  const board: LifeBoard = {
    cols,
    rows,
    width,
    height,
    alive: new Uint8Array(size),
    next: new Uint8Array(size),
    age: new Uint16Array(size),
    trail: new Float32Array(size),
    stepAccum: 0,
    generation: 0,
    stagnantTicks: 0,
    lastHash: 0,
    trailDots: [],
  }

  // Seed 4-5 graceful clusters inside the safe center area so frame 1 looks rich & calm
  const midC = Math.floor(cols * 0.5)
  const midR = Math.floor(rows * 0.5)
  stampPattern(board, PATTERNS[0], midC - 2, midR - 2, 0.85)
  stampPattern(board, PATTERNS[1], Math.max(3, Math.floor(cols * 0.22)), Math.max(3, Math.floor(rows * 0.24)), 0.75)
  stampPattern(board, PATTERNS[2], Math.min(cols - 8, Math.floor(cols * 0.72)), Math.max(3, Math.floor(rows * 0.28)), 0.75)
  stampPattern(board, PATTERNS[3], Math.max(3, Math.floor(cols * 0.28)), Math.min(rows - 8, Math.floor(rows * 0.72)), 0.75)
  stampPattern(board, PATTERNS[4], Math.min(cols - 10, Math.floor(cols * 0.62)), Math.min(rows - 7, Math.floor(rows * 0.64)), 0.75)

  // Warm up 6 generations so the initial composition has painterly trails already
  for (let i = 0; i < 6; i++) {
    stepLifeGeneration(board)
  }

  return board
}

export function seedLifeAtPixel(board: LifeBoard, px: number, py: number): void {
  const c0 = Math.floor(px / LIFE_CELL)
  const r0 = Math.floor(py / LIFE_CELL)
  const offsets: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [0, 1],
    [-1, 1],
    [1, -1],
  ]
  for (const [dc, dr] of offsets) {
    if (Math.random() > 0.62) continue
    const c = c0 + dc
    const r = r0 + dr
    if (c >= 1 && c < board.cols - 1 && r >= 1 && r < board.rows - 1) {
      const idx = r * board.cols + c
      board.alive[idx] = 1
      board.age[idx] = 1
      board.trail[idx] = 0.92
    }
  }
}

export function stepLifeGeneration(board: LifeBoard): void {
  const { cols, rows, alive, next, age, trail } = board
  let liveCount = 0
  let hash = 2166136261

  for (let r = 0; r < rows; r++) {
    const rUp = (r - 1 + rows) % rows
    const rDn = (r + 1) % rows
    const rowOff = r * cols
    const upOff = rUp * cols
    const dnOff = rDn * cols

    for (let c = 0; c < cols; c++) {
      const cL = (c - 1 + cols) % cols
      const cR = (c + 1) % cols

      const neighbors =
        alive[upOff + cL] +
        alive[upOff + c] +
        alive[upOff + cR] +
        alive[rowOff + cL] +
        alive[rowOff + cR] +
        alive[dnOff + cL] +
        alive[dnOff + c] +
        alive[dnOff + cR]

      const idx = rowOff + c
      const wasAlive = alive[idx] === 1
      const willLive = wasAlive ? neighbors === 2 || neighbors === 3 : neighbors === 3

      next[idx] = willLive ? 1 : 0
      if (willLive) {
        liveCount++
        age[idx] = Math.min(255, wasAlive ? age[idx] + 1 : 1)
        trail[idx] = 1
        hash = Math.imul(hash ^ idx, 16777619)
      } else {
        age[idx] = 0
        trail[idx] = trail[idx] * 0.84
        if (trail[idx] < 0.025) trail[idx] = 0
      }
    }
  }

  alive.set(next)
  board.generation++

  if (hash === board.lastHash) {
    board.stagnantTicks++
  } else {
    board.stagnantTicks = 0
    board.lastHash = hash
  }

  // Quiet self-cultivation so the artistic tapestry never dies out or freezes
  const minDesired = Math.max(18, Math.floor(cols * rows * 0.045))
  if (liveCount < minDesired || board.stagnantTicks > 12) {
    const pat = PATTERNS[board.generation % PATTERNS.length]
    const ox = 3 + Math.floor(Math.random() * Math.max(1, cols - 10))
    const oy = 3 + Math.floor(Math.random() * Math.max(1, rows - 8))
    stampPattern(board, pat, ox, oy, 0.85)
    board.stagnantTicks = 0
  }
}

export function advanceLifeBoard(board: LifeBoard, dtSeconds: number): void {
  // Smooth continuous trail decay every frame for painterly feel
  const decay = Math.pow(0.42, dtSeconds)
  for (let i = 0; i < board.trail.length; i++) {
    if (board.alive[i] === 0 && board.trail[i] > 0) {
      board.trail[i] *= decay
      if (board.trail[i] < 0.02) board.trail[i] = 0
    }
  }

  // Advance Conway generation at a calm, hypnotic rhythm (~4.2 gen/sec)
  board.stepAccum += dtSeconds
  const stepInterval = 0.24
  if (board.stepAccum >= stepInterval) {
    board.stepAccum -= stepInterval
    stepLifeGeneration(board)
  }
}

function collectCourseTargets(
  flight: AmbientFlight,
  laneWidth: number,
  laneHeight: number
): Array<{ x: number; y: number; kind: 'pipe' | 'cap' | 'bird' }> {
  const targets: Array<{ x: number; y: number; kind: 'pipe' | 'cap' | 'bird' }> = []
  const pipeCols = Math.max(2, Math.round(PIPE_WIDTH / LIFE_CELL))

  for (const gate of flight.gates) {
    if (gate.x + PIPE_WIDTH < -LIFE_CELL || gate.x > laneWidth + LIFE_CELL) continue
    const gx = Math.round(gate.x / LIFE_CELL) * LIFE_CELL
    const topEnd = Math.max(0, Math.floor((gate.center - PIPE_GAP / 2) / LIFE_CELL) * LIFE_CELL)
    const botStart = Math.min(laneHeight, Math.ceil((gate.center + PIPE_GAP / 2) / LIFE_CELL) * LIFE_CELL)

    for (let py = 0; py < topEnd; py += LIFE_CELL) {
      const isCap = py >= topEnd - LIFE_CELL
      for (let k = 0; k < pipeCols; k++) {
        targets.push({ x: gx + k * LIFE_CELL, y: py, kind: isCap ? 'cap' : 'pipe' })
      }
    }
    for (let py = botStart; py < laneHeight; py += LIFE_CELL) {
      const isCap = py < botStart + LIFE_CELL
      for (let k = 0; k < pipeCols; k++) {
        targets.push({ x: gx + k * LIFE_CELL, y: py, kind: isCap ? 'cap' : 'pipe' })
      }
    }
  }

  // Pixel bird cluster (3x2 cells centered at birdX, flight.y)
  const bx = Math.round(birdXForLane(laneWidth) / LIFE_CELL) * LIFE_CELL
  const by = Math.round(flight.y / LIFE_CELL) * LIFE_CELL
  const birdCells: Array<[number, number]> = [
    [-1, -1],
    [0, -1],
    [-1, 0],
    [0, 0],
    [1, 0],
  ]
  for (const [dx, dy] of birdCells) {
    targets.push({ x: bx + dx * LIFE_CELL, y: by + dy * LIFE_CELL, kind: 'bird' })
  }

  return targets
}

// Build smooth rearrange particles from live Game of Life cells -> Flappy Bird course blocks
export function buildMorphParticles(
  board: LifeBoard,
  flight: AmbientFlight,
  laneWidth: number,
  laneHeight: number
): MorphParticle[] {
  const sources: Array<{ x: number; y: number }> = []
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const idx = r * board.cols + c
      if (board.alive[idx] === 1 || board.trail[idx] > 0.35) {
        sources.push({ x: c * LIFE_CELL, y: r * LIFE_CELL })
      }
    }
  }
  if (sources.length === 0) {
    sources.push({ x: laneWidth * 0.5, y: laneHeight * 0.5 })
  }

  const targets = collectCourseTargets(flight, laneWidth, laneHeight)
  const particles: MorphParticle[] = []

  // Shuffle sources deterministically-ish for organic swirl
  for (let i = sources.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = sources[i]
    sources[i] = sources[j]
    sources[j] = tmp
  }

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const s = sources[i % sources.length]
    const midAngle = Math.atan2(t.y - s.y, t.x - s.x) + (i % 2 === 0 ? 1 : -1) * 0.65
    const arcMag = 14 + (i % 5) * 7
    particles.push({
      sx: s.x,
      sy: s.y,
      tx: t.x,
      ty: t.y,
      arcX: Math.cos(midAngle) * arcMag,
      arcY: Math.sin(midAngle) * arcMag,
      delay: Math.min(0.24, (i / Math.max(1, targets.length)) * 0.22),
      kind: t.kind,
    })
  }

  // Surplus live cells gently scatter as fading dust
  for (let i = targets.length; i < sources.length; i++) {
    const s = sources[i]
    const angle = Math.random() * Math.PI * 2
    particles.push({
      sx: s.x,
      sy: s.y,
      tx: s.x + Math.cos(angle) * 28,
      ty: s.y + Math.sin(angle) * 28,
      arcX: 0,
      arcY: 0,
      delay: 0,
      kind: 'dust',
    })
  }

  return particles
}

// Dissolve the current Flappy Bird course back into live Game of Life cells!
export function seedLifeFromFlight(
  board: LifeBoard,
  flight: AmbientFlight,
  laneWidth: number,
  laneHeight: number
): void {
  board.alive.fill(0)
  board.age.fill(0)
  // Keep a faint ghost of existing trails
  for (let i = 0; i < board.trail.length; i++) {
    board.trail[i] *= 0.3
  }
  board.trailDots = []

  const targets = collectCourseTargets(flight, laneWidth, laneHeight)
  for (const t of targets) {
    const c = Math.floor(t.x / LIFE_CELL)
    const r = Math.floor(t.y / LIFE_CELL)
    if (c >= 1 && c < board.cols - 1 && r >= 1 && r < board.rows - 1) {
      // Sparse-seed pillars (~58% density) so Conway's B3/S23 erupts organically instead of overpopulating
      if (t.kind === 'bird' || Math.random() < 0.58) {
        const idx = r * board.cols + c
        board.alive[idx] = 1
        board.age[idx] = t.kind === 'bird' ? 1 : 3
        board.trail[idx] = 0.95
      }
    }
  }
  board.stagnantTicks = 0
}

function easeOutCubic(x: number): number {
  const c = Math.max(0, Math.min(1, x))
  return 1 - Math.pow(1 - c, 3)
}

export function renderLifeState(
  ctx: CanvasRenderingContext2D,
  board: LifeBoard,
  pal: Palette
): void {
  const { cols, rows, alive, age, trail, width, height } = board
  ctx.clearRect(0, 0, width, height)

  const pad = 1.5
  const size = LIFE_CELL - pad * 2

  for (let r = 0; r < rows; r++) {
    const y = r * LIFE_CELL + pad
    const rowOff = r * cols
    for (let c = 0; c < cols; c++) {
      const idx = rowOff + c
      const tr = trail[idx]
      if (tr <= 0.02) continue

      const x = c * LIFE_CELL + pad
      if (alive[idx] === 1) {
        const a = age[idx]
        if (a <= 2) {
          // Newborn bloom in quiet slate-blue
          ctx.fillStyle = rgba(pal.slate, pal.isDark ? 0.58 : 0.48)
        } else if (a <= 10) {
          // Mature warm ochre
          ctx.fillStyle = rgba(pal.ochre, pal.isDark ? 0.56 : 0.46)
        } else {
          // Elder calm sepia/ink
          ctx.fillStyle = rgba(pal.warmInk, pal.isDark ? 0.36 : 0.28)
        }
        ctx.beginPath()
        ctx.roundRect(x, y, size, size, 2)
        ctx.fill()
      } else {
        // Painterly fading afterglow
        ctx.fillStyle = rgba(pal.ochre, tr * (pal.isDark ? 0.20 : 0.16))
        ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1)
      }
    }
  }
}

export function renderMorphState(
  ctx: CanvasRenderingContext2D,
  particles: MorphParticle[],
  progress: number,
  width: number,
  height: number,
  pal: Palette
): void {
  ctx.clearRect(0, 0, width, height)
  const size = LIFE_CELL - 2.5

  for (const p of particles) {
    const localT = Math.max(0, Math.min(1, (progress - p.delay) / Math.max(0.05, 1 - p.delay)))
    const e = easeOutCubic(localT)
    const arc = Math.sin(localT * Math.PI)
    const x = p.sx + (p.tx - p.sx) * e + p.arcX * arc
    const y = p.sy + (p.ty - p.sy) * e + p.arcY * arc

    if (p.kind === 'dust') {
      ctx.fillStyle = rgba(pal.warmInk, (1 - e) * 0.28)
    } else if (p.kind === 'bird') {
      ctx.fillStyle = rgba(pal.ochre, 0.55 + e * 0.38)
    } else if (p.kind === 'cap') {
      ctx.fillStyle = rgba(pal.ochre, 0.34 + e * 0.34)
    } else {
      ctx.fillStyle = rgba(pal.ochre, 0.24 + e * 0.26)
    }

    ctx.beginPath()
    ctx.roundRect(x + 1.25, y + 1.25, size, size, 2)
    ctx.fill()
  }
}

export function renderFlappyCourse(
  ctx: CanvasRenderingContext2D,
  board: LifeBoard,
  flight: AmbientFlight,
  pal: Palette,
  timeMs: number,
  isCrashed: boolean,
  dtSeconds: number
): void {
  const { width, height } = board
  ctx.clearRect(0, 0, width, height)

  const cellSize = LIFE_CELL - 2.2
  const pipeCols = Math.max(2, Math.round(PIPE_WIDTH / LIFE_CELL))
  const shimmerTick = Math.floor(timeMs / 240)

  // Draw dynamic pixel-block pillars built from Game of Life cells
  for (const gate of flight.gates) {
    if (gate.x + PIPE_WIDTH < -LIFE_CELL || gate.x > width + LIFE_CELL) continue
    const topEnd = Math.max(0, gate.center - PIPE_GAP / 2)
    const botStart = Math.min(height, gate.center + PIPE_GAP / 2)
    const passedAlpha = gate.passed ? 0.52 : 1

    const drawColumn = (startY: number, endY: number, capAtBottom: boolean) => {
      for (let py = Math.floor(startY / LIFE_CELL) * LIFE_CELL; py < endY; py += LIFE_CELL) {
        const isCap = capAtBottom ? py >= endY - LIFE_CELL * 1.15 : py < startY + LIFE_CELL * 1.15
        for (let k = 0; k < pipeCols; k++) {
          const px = gate.x + k * LIFE_CELL
          const hash = ((Math.floor(py / LIFE_CELL) * 31 + k * 17 + gate.id * 13 + shimmerTick) >>> 0) % 11
          const isEdge = k === 0 || k === pipeCols - 1
          const baseAlpha = isCap
            ? pal.isDark ? 0.62 : 0.56
            : isEdge
              ? pal.isDark ? 0.42 : 0.36
              : hash === 0
                ? pal.isDark ? 0.52 : 0.45
                : pal.isDark ? 0.28 : 0.24

          ctx.fillStyle =
            hash === 0 && !isCap
              ? rgba(pal.slate, baseAlpha * passedAlpha)
              : rgba(pal.ochre, baseAlpha * passedAlpha)

          ctx.beginPath()
          ctx.roundRect(px + 1.1, py + 1.1, cellSize, cellSize, 2)
          ctx.fill()
        }
      }
    }

    if (topEnd > 0) drawColumn(0, topEnd, true)
    if (botStart < height) drawColumn(botStart, height, false)

    // Quiet slate-blue milestone diamond floating in the gap
    if (!gate.passed) {
      const cx = gate.x + PIPE_WIDTH / 2
      const cy = gate.center
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = rgba(pal.slate, pal.isDark ? 0.72 : 0.62)
      ctx.fillRect(-3.5, -3.5, 7, 7)
      ctx.restore()
    }
  }

  // Update & draw bird's fading cellular wake
  const bx = birdXForLane(width)
  const by = flight.y
  if (!isCrashed && dtSeconds > 0) {
    if (board.trailDots.length === 0 || Math.hypot(bx - board.trailDots[board.trailDots.length - 1].x, by - board.trailDots[board.trailDots.length - 1].y) > 9) {
      board.trailDots.push({ x: bx - 10, y: by, life: 1 })
      if (board.trailDots.length > 14) board.trailDots.shift()
    }
    for (const d of board.trailDots) {
      d.x -= 84 * dtSeconds
      d.life -= dtSeconds * 1.9
    }
    board.trailDots = board.trailDots.filter((d) => d.life > 0.04)
  }

  for (const d of board.trailDots) {
    ctx.fillStyle = rgba(pal.slate, d.life * (pal.isDark ? 0.46 : 0.36))
    const s = 4 + d.life * 3.5
    ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s)
  }

  // Draw crisp pixel-cell bird (formed from the rearranged Game of Life cells)
  const tilt = isCrashed ? 0.75 : Math.max(-0.38, Math.min(0.72, flight.velocity / 460))
  const flash = isCrashed && Math.floor(timeMs / 110) % 2 === 0
  ctx.save()
  ctx.translate(bx, by)
  ctx.rotate(tilt)

  const bodyFill = flash ? '#ffffff' : rgba(pal.ochre, 0.92)
  const wingFill = flash ? '#ffffff' : rgba(pal.slate, 0.85)
  const beakFill = rgba([204, 114, 68], 0.9)

  // Pixel body blocks
  ctx.fillStyle = bodyFill
  ctx.beginPath()
  ctx.roundRect(-10, -7, 18, 14, 3)
  ctx.fill()

  // Tail pixel
  ctx.fillStyle = wingFill
  ctx.fillRect(-15, -2, 5, 5)

  // Wing pixel
  ctx.fillRect(-6, -1, 8, 5)

  // Beak pixel
  ctx.fillStyle = beakFill
  ctx.fillRect(8, -2, 6, 4)

  // Eye pixel
  ctx.fillStyle = pal.paper
  ctx.fillRect(3, -4, 3, 3)

  ctx.restore()
}
