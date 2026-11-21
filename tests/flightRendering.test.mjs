import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import {
  advanceAmbientFlight,
  BIRD_RADIUS,
  birdXForLane,
  createAmbientFlight,
  getGateGeometry,
} from '../src/components/flappyBirdEngine.ts'

// Vite resolves extensionless TS imports; supply that one resolution in Node too.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === './flappyBirdEngine' ? `${specifier}.ts` : specifier, context)
  },
})
const { renderFlappyInLane } = await import('../src/components/weatherTapestryEngine.ts')
hooks.deregister()

const lane = { left: 60, top: 20, width: 400, height: 464 }
const palette = {
  core: [10, 20, 30], rim: [40, 50, 60], birdBody: [70, 80, 90],
  accent: [100, 110, 120], birdBeak: [130, 140, 150], paper: '#fff',
}

function draw(flight, bounds = lane) {
  const rectangles = []
  const pixelCtx = {
    fillRect(x, y, width, height) {
      rectangles.push({ x, y, width, height, color: this.fillStyle })
    },
  }
  renderFlappyInLane({ fillRect() {} }, pixelCtx, { wake: [] }, flight, bounds, palette, 1000, false, 0)
  return {
    pipes: rectangles.filter(r => r.color.startsWith('rgba(10,20,30,') || r.color === 'rgba(40,50,60,0.880)'),
    bird: rectangles.find(r => r.color === 'rgba(70,80,90,0.960)'),
  }
}

function fixture(y = 171, center = 227.7) {
  return {
    ...createAmbientFlight(lane.width, lane.height),
    y,
    gates: [{ id: 0, x: birdXForLane(lane.width), center, stampIndex: 0, passed: false }],
  }
}

test('pipe artwork preserves exact collision edges instead of expanding gaps to grid cells', () => {
  for (const center of [224, 227.7, 236]) {
    const flight = fixture(171, center)
    const { pipes } = draw(flight)
    const geometry = getGateGeometry(flight.gates[0])
    const upper = pipes.filter(r => r.y < lane.top + geometry.gapTop)
    const lower = pipes.filter(r => r.y >= lane.top + geometry.gapBottom)
    assert.equal(upper.length + lower.length, pipes.length)
    assert.equal(Math.max(...upper.map(r => r.y + r.height)), lane.top + geometry.gapTop)
    assert.equal(Math.min(...lower.map(r => r.y)), lane.top + geometry.gapBottom)
    assert.equal(Math.min(...pipes.map(r => r.x)), lane.left + geometry.left)
    assert.equal(Math.max(...pipes.map(r => r.x + r.width)), lane.left + geometry.right)
  }
})

test('the visible bird stays centered on physics across pixel-grid boundaries and lane offsets', () => {
  for (const y of [179.9, 180, 180.1, 227.7]) {
    const bounds = { ...lane, left: 63.25, top: 21.5 }
    const { bird } = draw(fixture(y), bounds)
    assert.equal(bird.x + bird.width / 2, bounds.left + birdXForLane(bounds.width))
    assert.equal(bird.y + bird.height / 2, bounds.top + y)
    assert.equal(bird.width, BIRD_RADIUS * 2)
    assert.equal(bird.height, BIRD_RADIUS * 2)
  }
})

test('near-gap crashes visibly touch a pipe while just-safe trajectories remain visibly clear', () => {
  const geometry = getGateGeometry(fixture().gates[0])
  for (const [y, expected] of [
    [geometry.gapTop + BIRD_RADIUS - 0.25, 'crashed'],
    [geometry.gapTop + BIRD_RADIUS + 0.25, 'flying'],
    [geometry.gapBottom - BIRD_RADIUS + 0.25, 'crashed'],
    [geometry.gapBottom - BIRD_RADIUS - 0.25, 'flying'],
  ]) {
    const flight = advanceAmbientFlight(fixture(y), 1e-8, lane.width, lane.height, false)
    const { bird, pipes } = draw(flight)
    const touchesPipe = pipes.some(r =>
      bird.x < r.x + r.width && bird.x + bird.width > r.x &&
      bird.y < r.y + r.height && bird.y + bird.height > r.y
    )
    assert.equal(flight.result, expected)
    assert.equal(touchesPipe, expected === 'crashed')
  }
})
