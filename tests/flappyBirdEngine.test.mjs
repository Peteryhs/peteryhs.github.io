import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceAmbientFlight,
  BIRD_RADIUS,
  birdXForLane,
  createAmbientFlight,
  FLIGHT_STAMPS,
  PIPE_COLLISION_PADDING,
  PIPE_GAP,
  PIPE_WIDTH,
} from '../src/components/flappyBirdEngine.ts'

const width = 400
const height = 464
const step = 1 / 120

function trailingGate(index = 0) {
  return {
    ...createAmbientFlight(width, height),
    y: height / 2,
    score: index,
    gates: [{
      id: index,
      x: birdXForLane(width) - BIRD_RADIUS - PIPE_WIDTH - PIPE_COLLISION_PADDING + 2,
      center: height / 2,
      stampIndex: index % FLIGHT_STAMPS.length,
      passed: false,
    }],
  }
}

test('a milestone waits until the whole collision boundary clears the bird', () => {
  let flight = advanceAmbientFlight(trailingGate(), step, width, height, false)
  assert.equal(flight.result, 'flying')
  assert.equal(flight.score, 0)
  assert.equal(flight.lastEvent, null)
  for (let frame = 0; frame < 3; frame++) {
    flight = advanceAmbientFlight(flight, step, width, height, false)
  }
  assert.equal(flight.score, 1)
  assert.equal(flight.lastEvent, null) // The award is emitted only once.
  assert.equal(flight.gates[0].passed, true)
})

test('a trailing-edge crash cannot retain an unearned milestone', () => {
  const overlapping = advanceAmbientFlight(trailingGate(), step, width, height, false)
  const crash = advanceAmbientFlight({
    ...overlapping,
    y: height / 2 - PIPE_GAP / 2 - 1,
    velocity: 0,
  }, step, width, height, false)
  assert.equal(crash.result, 'crashed')
  assert.equal(crash.score, 0)
  assert.equal(crash.lastEvent, null)
})

test('all nine references are awarded in their original order and then repeat', () => {
  const stamps = []
  for (let index = 0; index <= FLIGHT_STAMPS.length; index++) {
    let flight = trailingGate(index)
    for (let frame = 0; frame < 4; frame++) {
      flight = advanceAmbientFlight(flight, step, width, height, false)
      if (flight.lastEvent) stamps.push(flight.lastEvent.stamp)
    }
    assert.equal(flight.score, index + 1)
  }
  assert.deepEqual(stamps, [...FLIGHT_STAMPS, FLIGHT_STAMPS[0]])
})
