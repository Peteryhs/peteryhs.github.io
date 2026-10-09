// Classifies wheel events that land on the bottom edge of the page.
//
// Trackpads send two kinds of wheel events: ones driven by the fingers (noisy,
// can rise or fall) and an OS momentum "coast" after the fingers lift (a smooth,
// steadily shrinking series at a regular cadence). The stretch should follow the
// fingers and let go the moment the coast starts, so a hard flick never holds the
// page up longer than a gentle one. The coast that follows is swallowed until a
// real pause or a clear new push.

export type WheelAction = 'pull' | 'release' | 'swallow'

export const WHEEL_GESTURE_GAP = 110 // ms of silence that ends a gesture
const COAST_RUN = 5 // consecutive smooth non-increasing deltas that mark a coast
const COAST_MIN_RATIO = 0.7 // each step keeps at least 70% of the previous delta
const COAST_DROP = 0.9 // and the delta has started falling from the peak
const COAST_MAX_INTERVAL = 40 // momentum events arrive at frame cadence
const NEW_PUSH_RATIO = 1.3 // a coast never grows; growth means fingers again
const NEW_PUSH_MIN = 3 // px, ignores rounding jitter at the tail

export class WheelGestureTracker {
  private lastT = -Infinity
  private lastDelta = 0
  private peak = 0
  private run = 0
  private swallowing = false

  reset() {
    this.lastT = -Infinity
    this.swallowing = false
  }

  feed(delta: number, t: number): WheelAction {
    const gap = t - this.lastT
    const prev = this.lastDelta
    this.lastT = t
    this.lastDelta = delta

    if (gap > WHEEL_GESTURE_GAP) {
      this.begin(t, delta)
      return 'pull'
    }

    if (this.swallowing) {
      if (delta > prev * NEW_PUSH_RATIO && delta - prev >= NEW_PUSH_MIN) {
        this.begin(t, delta)
        return 'pull'
      }
      return 'swallow'
    }

    // A coast shrinks every frame. Equal deltas (steady finger, mouse wheel ticks,
    // or the rounded tail of a coast) neither prove nor disprove it; anything that
    // grows, jumps down sharply, or arrives off frame cadence is the user's hand.
    if (delta < prev && delta >= prev * COAST_MIN_RATIO && gap <= COAST_MAX_INTERVAL) this.run += 1
    else if (delta !== prev || gap > COAST_MAX_INTERVAL) this.run = 0
    this.peak = Math.max(this.peak, delta)

    // No time limit: as long as the user keeps scrolling, the page stays stretched.
    if (this.run >= COAST_RUN && delta < this.peak * COAST_DROP) {
      this.swallowing = true
      return 'release'
    }
    return 'pull'
  }

  private begin(_t: number, delta: number) {
    this.swallowing = false
    this.peak = delta
    this.run = 0
  }
}
