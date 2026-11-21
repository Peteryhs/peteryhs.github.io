import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceFlight, createFlight, FLIGHT_STAMPS } from '../src/components/flappyBirdEngine.ts'

const width = 720
const step = 1 / 120

// At x=78 the pipe body is behind the bird's left edge (138), but its
// overhanging cap is not. The bird is safely in the middle of the gap.
function trailingCap(index = 0) {
  return {
    ...createFlight(width),
    score: index,
    gates: [{ x: 78, center: 146, index, passed: false }],
  }
}

test('a stamp waits until the entire trailing cap is clear, then counts once', () => {
  let flight = advanceFlight(trailingCap(), step, width)
  assert.equal(flight.score, 0)
  assert.equal(flight.gates[0].passed, false)

  flight = advanceFlight(flight, step * 2, width)
  assert.equal(flight.score, 1)
  assert.equal(flight.gates[0].passed, true)
  assert.equal(advanceFlight(flight, step, width).score, 1)
})

test('crashing against the trailing cap cannot keep an unearned stamp', () => {
  const beforeClear = advanceFlight(trailingCap(), step, width)
  const crash = advanceFlight({ ...beforeClear, y: 60 }, step, width)
  assert.equal(crash.result, 'crashed')
  assert.equal(crash.score, 0)
})

test('the final stamp cannot complete a flight before its cap is clear', () => {
  let flight = advanceFlight(trailingCap(FLIGHT_STAMPS.length - 1), step, width)
  assert.equal(flight.score, 8)
  assert.equal(flight.result, 'flying')

  flight = advanceFlight(flight, step * 2, width)
  assert.equal(flight.score, 9)
  assert.equal(flight.result, 'complete')
})
