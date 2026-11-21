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

export const BIRD_RADIUS = 9
export const PIPE_WIDTH = 40 // matches the 40px background grid
export const PIPE_GAP = 128
export const PIPE_COLLISION_PADDING = 3
const PIPE_SPACING = 200 // 5 grid cells
const SPEED = 84
const GRAVITY = 560
const FLAP_VELOCITY = -215

export interface Gate {
  id: number
  x: number
  center: number
  stampIndex: number
  passed: boolean
}

export interface FlightEvent {
  id: number
  stamp: string
  x: number
  y: number
}

export interface AmbientFlight {
  y: number
  velocity: number
  gates: Gate[]
  score: number
  nextGateId: number
  result: 'flying' | 'crashed'
  lastEvent: FlightEvent | null
}

export function birdXForLane(width: number): number {
  return Math.max(54, Math.min(116, width * 0.28))
}

function makeGate(id: number, x: number, height: number): Gate {
  const margin = Math.max(76, PIPE_GAP / 2 + 28)
  const usable = Math.max(40, height - margin * 2)
  // Deterministic gentle wave across the lane height
  const wave = (Math.sin(id * 1.65 + 0.4) + 1) / 2
  const center = margin + wave * usable
  return {
    id,
    x,
    center,
    stampIndex: id % FLIGHT_STAMPS.length,
    passed: false,
  }
}

export function createAmbientFlight(width: number, height: number): AmbientFlight {
  const bx = birdXForLane(width)
  const firstX = Math.max(bx + 150, width * 0.62)
  const count = Math.ceil((width + PIPE_SPACING * 2) / PIPE_SPACING)
  const gates = Array.from({ length: count }, (_, i) =>
    makeGate(i, firstX + i * PIPE_SPACING, height)
  )
  return {
    y: height * 0.5,
    velocity: 0,
    gates,
    score: 0,
    nextGateId: count,
    result: 'flying',
    lastEvent: null,
  }
}

export function flapAmbient(flight: AmbientFlight): AmbientFlight {
  if (flight.result !== 'flying') return flight
  return { ...flight, velocity: FLAP_VELOCITY }
}

// Shared with the renderer: pixel-art edges must not advertise a wider safe gap.
export function getGateGeometry(gate: Gate) {
  return {
    left: gate.x - PIPE_COLLISION_PADDING,
    right: gate.x + PIPE_WIDTH + PIPE_COLLISION_PADDING,
    gapTop: gate.center - PIPE_GAP / 2,
    gapBottom: gate.center + PIPE_GAP / 2,
  }
}

function hitsGate(y: number, x: number, gate: Gate): boolean {
  const { left, right, gapTop: top, gapBottom: bottom } = getGateGeometry(gate)
  const nearestX = Math.max(
    left,
    Math.min(x, right)
  )
  const dx = x - nearestX
  const dy = y < top ? 0 : y > bottom ? 0 : Math.min(y - top, bottom - y)
  return dx * dx + dy * dy < BIRD_RADIUS * BIRD_RADIUS
}

export function advanceAmbientFlight(
  flight: AmbientFlight,
  elapsed: number,
  width: number,
  height: number,
  autopilot: boolean
): AmbientFlight {
  if (flight.result !== 'flying' || elapsed <= 0 || !Number.isFinite(elapsed)) {
    return { ...flight, lastEvent: null }
  }

  const bx = birdXForLane(width)
  const next: AmbientFlight = {
    ...flight,
    gates: flight.gates.map((g) => ({ ...g })),
    lastEvent: null,
  }

  let remaining = Math.min(elapsed, 0.08)
  while (remaining > 0 && next.result === 'flying') {
    const dt = Math.min(remaining, 1 / 120)
    remaining -= dt

    if (autopilot) {
      const targetGate = next.gates.find((g) => g.x + PIPE_WIDTH >= bx - BIRD_RADIUS)
      const targetY = targetGate ? targetGate.center + 8 : height * 0.5
      if (next.y > targetY && next.velocity > -20) {
        next.velocity = FLAP_VELOCITY * 0.92
      }
      if (next.y < BIRD_RADIUS + 20 && next.velocity < 0) {
        next.velocity = 0
      }
    }

    next.velocity += GRAVITY * dt
    next.y += next.velocity * dt
    for (const g of next.gates) {
      g.x -= SPEED * dt
    }

    if (autopilot) {
      // Keep autopilot gracefully inside bounds even across sudden resizes
      next.y = Math.max(BIRD_RADIUS + 10, Math.min(height - BIRD_RADIUS - 10, next.y))
    } else if (
      next.y - BIRD_RADIUS <= 2 ||
      next.y + BIRD_RADIUS >= height - 2 ||
      next.gates.some((g) => hitsGate(next.y, bx, g))
    ) {
      next.result = 'crashed'
      break
    }

    for (const g of next.gates) {
      if (!g.passed && g.x + PIPE_WIDTH + PIPE_COLLISION_PADDING < bx - BIRD_RADIUS) {
        g.passed = true
        next.score += 1
        next.lastEvent = {
          id: g.id,
          stamp: FLIGHT_STAMPS[g.stampIndex],
          x: g.x + PIPE_WIDTH / 2,
          y: Math.max(36, g.center - 16),
        }
      }
    }

    if (next.gates.length > 0 && next.gates[0].x + PIPE_WIDTH < -48) {
      next.gates.shift()
      const last = next.gates[next.gates.length - 1]
      next.gates.push(makeGate(next.nextGateId, last.x + PIPE_SPACING, height))
      next.nextGateId += 1
    }
  }

  return next
}
