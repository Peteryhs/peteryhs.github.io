// The original snake's references, in their original order.
export const FLIGHT_STAMPS = [
  'DECA 45',
  'IRHSAI 24',
  'Hack the Ridge Team 24',
  'DECA Team Ontario 46',
  'IRHSAI 25',
  'Hack the Ridge Team 25',
  'DECA Team Ontario 47',
  'IRHSAI 26',
  "UW CE '31",
] as const

export const WORLD_HEIGHT = 320
export const FLOOR_Y = 294
export const BIRD_RADIUS = 12
export const PIPE_WIDTH = 58
export const PIPE_GAP = 154
const PIPE_SPACING = 246
const SPEED = 136
const GRAVITY = 870
const FLAP_VELOCITY = -292

export interface Gate {
  x: number
  center: number
  index: number
  passed: boolean
}

export interface Flight {
  y: number
  velocity: number
  distance: number
  score: number
  gates: Gate[]
  result: 'flying' | 'crashed' | 'complete'
}

export function birdX(width: number) {
  return Math.min(150, width * 0.23)
}

function gate(index: number, x: number): Gate {
  return { x, index, center: 146 + Math.sin(index * 1.8) * 37, passed: false }
}

export function createFlight(width: number): Flight {
  const firstX = birdX(width) + 300
  return {
    y: 155,
    velocity: 0,
    distance: 0,
    score: 0,
    gates: Array.from(
      { length: Math.ceil(width / PIPE_SPACING) + 2 },
      (_, i) => gate(i, firstX + i * PIPE_SPACING)
    ),
    result: 'flying',
  }
}

export function flap(flight: Flight): Flight {
  return flight.result === 'flying' ? { ...flight, velocity: FLAP_VELOCITY } : flight
}

function hitsGate(y: number, x: number, obstacle: Gate) {
  if (obstacle.index >= FLIGHT_STAMPS.length) return false
  // Circle / rectangle collision, including the slightly wider pipe caps.
  const nearestX = Math.max(obstacle.x - 5, Math.min(x, obstacle.x + PIPE_WIDTH + 5))
  const dx = x - nearestX
  const top = obstacle.center - PIPE_GAP / 2
  const bottom = obstacle.center + PIPE_GAP / 2
  const dy = y < top ? 0 : y > bottom ? 0 : Math.min(y - top, bottom - y)
  return dx * dx + dy * dy < BIRD_RADIUS * BIRD_RADIUS
}

export function advanceFlight(flight: Flight, elapsed: number, width: number): Flight {
  if (flight.result !== 'flying' || elapsed <= 0 || !Number.isFinite(elapsed)) return flight
  const next: Flight = { ...flight, gates: flight.gates.map((item) => ({ ...item })) }
  // Small steps keep collision reliable even after a slow browser frame.
  let remaining = Math.min(elapsed, 0.1)
  while (remaining > 0 && next.result === 'flying') {
    const dt = Math.min(remaining, 1 / 120)
    remaining -= dt
    next.velocity += GRAVITY * dt
    next.y += next.velocity * dt
    next.distance += SPEED * dt
    next.gates.forEach((item) => {
      item.x -= SPEED * dt
    })

    if (
      next.y - BIRD_RADIUS <= 0 ||
      next.y + BIRD_RADIUS >= FLOOR_Y ||
      next.gates.some((item) => hitsGate(next.y, birdX(width), item))
    ) {
      next.result = 'crashed'
      break
    }

    for (const item of next.gates) {
      if (
        item.index < FLIGHT_STAMPS.length &&
        !item.passed &&
        item.x + PIPE_WIDTH < birdX(width) - BIRD_RADIUS
      ) {
        item.passed = true
        next.score += 1
        if (next.score === FLIGHT_STAMPS.length) next.result = 'complete'
      }
    }

    if (next.gates.length > 0 && next.gates[0].x + PIPE_WIDTH < -12) {
      next.gates.shift()
      const last = next.gates[next.gates.length - 1]
      next.gates.push(gate(last.index + 1, last.x + PIPE_SPACING))
    }
  }
  return next
}
