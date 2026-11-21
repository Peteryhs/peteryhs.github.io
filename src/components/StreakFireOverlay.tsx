import { useEffect, useRef, useState } from 'react'

export interface FlameOrigin {
  x: number
  y: number
  width: number
  height: number
  cardWidth: number
  cardHeight: number
}

interface DuolingoVectorFlameProps {
  size?: number
  mode?: 'idle' | 'hero'
  className?: string
}

/**
 * Generates the three dynamically morphing Duolingo-style vector flame SVG paths
 * (outer silhouette, mid tongue, inner core) in the 76x86 viewBox.
 * When intensity === 0 and leanX === 0, matches the exact resting flame shape.
 */
function buildMorphingFlamePaths(
  timeSec: number,
  intensity: number,
  leanX = 0
): { outer: string; mid: string; inner: string; glowCx: number; glowCy: number; glowRx: number; glowRy: number } {
  const f = Math.max(0, Math.min(1.4, intensity))

  // Independent multi-harmonic waves per layer so the 3 SVG shapes visibly ripple against each other
  const w1 = Math.sin(timeSec * 8.4)
  const w2 = Math.sin(timeSec * 13.2 + 0.9)
  const w3 = Math.cos(timeSec * 6.3 + 0.4)

  const m1 = Math.sin(timeSec * 10.6 + 1.15)
  const m2 = Math.sin(timeSec * 15.8 + 2.1)

  const c1 = Math.sin(timeSec * 12.8 + 2.05)
  const c2 = Math.cos(timeSec * 17.4 + 0.7)

  // --- Layer 1: Outer flame silhouette ---
  const oTipX = 41.2 + (w1 * 5.8 + w2 * 2.6) * f + leanX * 9.5
  const oTipY = 4.8 - (Math.abs(w1) * 4.4 + w3 * 2.2) * f
  const oNotchX = 30.8 + (w2 * 3.4 - w1 * 1.8) * f + leanX * 4.5
  const oNotchY = 27.6 + (w3 * 3.2 - w1 * 1.6) * f
  const oLeftLickX = 26.8 + (w1 * 3.2 - w2 * 2.4) * f + leanX * 6.0
  const oLeftLickY = 14.8 - (Math.sin(timeSec * 9.8 + 1.4) * 4.6 + 1.4) * f
  const oLeftBellyX = 9.2 - (w3 * 2.6 + 1.2) * f
  const oRightBellyX = 67.2 + (w1 * 2.8 + 1.4) * f
  const oBellyY = 48.2 + w2 * 2.4 * f

  const outer = [
    `M${oTipX.toFixed(2)} ${oTipY.toFixed(2)}`,
    `C${(42.9 + w1 * 4.2 * f + leanX * 5).toFixed(2)} ${(14.9 + w2 * 2.5 * f).toFixed(2)} ${(35.8 + w2 * 3.1 * f).toFixed(2)} ${(22.1 + w1 * 2.2 * f).toFixed(2)} ${oNotchX.toFixed(2)} ${oNotchY.toFixed(2)}`,
    `C${(27.2 + w1 * 2.2 * f).toFixed(2)} ${(24.4 + w3 * 2.1 * f).toFixed(2)} ${(25.7 + w2 * 2.6 * f).toFixed(2)} ${(19.6 - w1 * 2.0 * f).toFixed(2)} ${oLeftLickX.toFixed(2)} ${oLeftLickY.toFixed(2)}`,
    `C${(16.2 - w3 * 2.4 * f).toFixed(2)} ${(21.8 + w1 * 2.5 * f).toFixed(2)} ${oLeftBellyX.toFixed(2)} ${(33.8 + w2 * 2.0 * f).toFixed(2)} ${oLeftBellyX.toFixed(2)} ${oBellyY.toFixed(2)}`,
    `C${oLeftBellyX.toFixed(2)} ${(66.8 + w3 * 1.2 * f).toFixed(2)} 22.5 81.2 38.4 81.2`,
    `C54.8 81.2 ${oRightBellyX.toFixed(2)} ${(67.4 - w3 * 1.2 * f).toFixed(2)} ${oRightBellyX.toFixed(2)} ${(49.4 - w2 * 2.4 * f).toFixed(2)}`,
    `C${oRightBellyX.toFixed(2)} ${(34.4 + w1 * 2.8 * f).toFixed(2)} ${(58.6 + w2 * 4.0 * f + leanX * 5).toFixed(2)} ${(19.8 - w3 * 2.8 * f).toFixed(2)} ${oTipX.toFixed(2)} ${oTipY.toFixed(2)}Z`,
  ].join(' ')

  // --- Layer 2: Mid amber tongue (phase-offset so it visibly ripples inside the outer layer) ---
  const mTipX = 39.8 + (m1 * 5.2 + m2 * 2.2) * f + leanX * 7.2
  const mTipY = 23.4 - (Math.abs(m1) * 5.2 + m2 * 2.0) * f
  const mNotchX = 31.8 + (m2 * 2.8 - m1 * 1.6) * f + leanX * 3.2
  const mNotchY = 40.6 + (m1 * 2.6) * f
  const mLeftLickX = 29.3 + (m1 * 2.8 - m2 * 1.9) * f + leanX * 4.4
  const mLeftLickY = 31.4 - (Math.cos(timeSec * 11.4 + 0.6) * 3.8 + 1.0) * f
  const mLeftX = 18.2 - (m2 * 2.2 + 0.9) * f
  const mRightX = 58.4 + (m1 * 2.4 + 1.0) * f

  const mid = [
    `M${mTipX.toFixed(2)} ${mTipY.toFixed(2)}`,
    `C${(41.2 + m1 * 3.6 * f + leanX * 3.8).toFixed(2)} ${(31.4 + m2 * 2.2 * f).toFixed(2)} ${(35.2 + m2 * 2.4 * f).toFixed(2)} ${(36.8 + m1 * 2.0 * f).toFixed(2)} ${mNotchX.toFixed(2)} ${mNotchY.toFixed(2)}`,
    `C${(29.4 + m1 * 1.8 * f).toFixed(2)} ${(38.2 + m2 * 1.8 * f).toFixed(2)} ${(28.5 + m2 * 2.0 * f).toFixed(2)} ${(34.8 - m1 * 1.8 * f).toFixed(2)} ${mLeftLickX.toFixed(2)} ${mLeftLickY.toFixed(2)}`,
    `C${(22.4 - m1 * 2.0 * f).toFixed(2)} ${(36.8 + m2 * 1.8 * f).toFixed(2)} ${mLeftX.toFixed(2)} 45.2 ${mLeftX.toFixed(2)} 54.6`,
    `C${mLeftX.toFixed(2)} 66.8 27.2 76.4 38.4 76.4`,
    `C49.8 76.4 ${mRightX.toFixed(2)} 67.1 ${mRightX.toFixed(2)} 55.2`,
    `C${mRightX.toFixed(2)} ${(44.6 + m1 * 2.2 * f).toFixed(2)} ${(52.1 + m2 * 3.2 * f + leanX * 3.5).toFixed(2)} ${(34.2 - m1 * 2.2 * f).toFixed(2)} ${mTipX.toFixed(2)} ${mTipY.toFixed(2)}Z`,
  ].join(' ')

  // --- Layer 3: Bright inner yellow-white core (fastest, punchiest core flutter) ---
  const cTipX = 39.0 + (c1 * 4.4 + c2 * 1.8) * f + leanX * 4.5
  const cTipY = 44.2 - (Math.abs(c1) * 4.8 + c2 * 2.2) * f
  const cLeftX = 27.8 - (c2 * 2.0 + 0.8) * f
  const cRightX = 49.1 + (c1 * 2.0 + 0.8) * f

  const inner = [
    `M${cTipX.toFixed(2)} ${cTipY.toFixed(2)}`,
    `C${(32.4 + c1 * 2.2 * f).toFixed(2)} ${(49.8 + c2 * 1.8 * f).toFixed(2)} ${cLeftX.toFixed(2)} 56.4 ${cLeftX.toFixed(2)} 63.4`,
    `C${cLeftX.toFixed(2)} 70.1 32.5 75.4 38.4 75.4`,
    `C44.4 75.4 ${cRightX.toFixed(2)} 70.1 ${cRightX.toFixed(2)} 63.6`,
    `C${cRightX.toFixed(2)} ${(56.8 - c2 * 1.6 * f).toFixed(2)} ${(45.2 + c1 * 2.4 * f).toFixed(2)} ${(50.2 - c1 * 1.8 * f).toFixed(2)} ${cTipX.toFixed(2)} ${cTipY.toFixed(2)}Z`,
  ].join(' ')

  return {
    outer,
    mid,
    inner,
    glowCx: 38.4 + c1 * 1.2 * f,
    glowCy: 67.5 - Math.abs(c2) * 1.4 * f,
    glowRx: 6.2 + Math.abs(c1) * 1.6 * f,
    glowRy: 4.8 + Math.abs(c2) * 1.4 * f,
  }
}

const RESTING_PATHS = buildMorphingFlamePaths(0, 0, 0)

export function DuolingoVectorFlame({
  size = 44,
  mode = 'idle',
  className = '',
}: DuolingoVectorFlameProps) {
  const height = Math.round(size * 1.14)

  return (
    <svg
      className={`qe-flame-svg qe-flame-${mode} ${className}`.trim()}
      width={size}
      height={height}
      viewBox="0 0 76 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Subtle rising micro-embers */}
      <circle className="qe-ember qe-ember-1" cx="25" cy="22" r="2.2" fill="#FFB100" />
      <circle className="qe-ember qe-ember-2" cx="54" cy="18" r="1.8" fill="#FFC800" />
      <circle className="qe-ember qe-ember-3" cx="39" cy="11" r="1.6" fill="#FF9600" />

      {/* Outer Duolingo flat-vector flame silhouette */}
      <g className="qe-flame-outer-group">
        <path d={RESTING_PATHS.outer} fill="#FF9600" />
      </g>

      {/* Mid amber flame tongue */}
      <g className="qe-flame-mid-group">
        <path d={RESTING_PATHS.mid} fill="#FFC800" />
      </g>

      {/* Bright inner yellow-white core */}
      <g className="qe-flame-inner-group">
        <path d={RESTING_PATHS.inner} fill="#FFF1B8" />
        <ellipse cx="38.4" cy="67.5" rx="6.2" ry="4.8" fill="#FFFDF2" opacity="0.72" />
      </g>
    </svg>
  )
}

interface BouncingSparkle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vRot: number
  life: number
  maxLife: number
  color: string
  kind: 'star' | 'droplet' | 'dot'
  bouncesLeft: number
  floorY: number
}

const SPARKLE_COLORS = ['#FFFFFF', '#FFF8D1', '#FFE14D', '#FFC800']

function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  const c1 = 1.65
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

interface StreakFireOverlayProps {
  origin: FlameOrigin
  onComplete: () => void
}

// Total choreographed sequence duration in seconds
const TOTAL_DURATION_S = 2.25

export function StreakFireOverlay({ origin, onComplete }: StreakFireOverlayProps) {
  const [dismissing, setDismissing] = useState(false)
  const completedRef = useRef(false)
  const dismissingRef = useRef(false)

  const washRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const outerPathRef = useRef<SVGPathElement>(null)
  const midPathRef = useRef<SVGPathElement>(null)
  const innerPathRef = useRef<SVGPathElement>(null)
  const coreEllipseRef = useRef<SVGEllipseElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const finishOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const triggerEarlyDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    dismissingRef.current = true
    setDismissing(true)
  }

  useEffect(() => {
    if (!dismissing) return
    const id = window.setTimeout(finishOnce, 220)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissing])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissingRef.current = true
        setDismissing(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Single unified 60fps animation engine:
  // 1) Springs the flame from its slot to card center with squash-and-stretch
  // 2) Dynamically morphs all 3 SVG flame paths (outer, mid, inner) in real time
  // 3) Floods the entire card warm Duolingo orange when the flame surges
  // 4) Emits crisp sparkles & droplets that pop and bounce physically off the fire
  // 5) Smoothly draws the orange back and glides the flame home to its slot
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const cardW = Math.max(1, origin.cardWidth)
    const cardH = Math.max(1, origin.cardHeight)
    const centerX = cardW / 2
    const centerY = cardH / 2

    if (canvas) {
      canvas.width = Math.round(cardW * dpr)
      canvas.height = Math.round(cardH * dpr)
    }

    const heroSize = Math.round(Math.max(96, Math.min(Math.min(cardW, cardH) * 0.56, 134)))
    const startScale = origin.width / heroSize
    const maxWashRadius = Math.ceil(Math.hypot(cardW / 2, cardH / 2) + 18)

    const particles: BouncingSparkle[] = []
    let burst1Fired = false
    let burst2Fired = false
    let lastEmitT = 0.56

    const spawnOffFlame = (count: number, speedMul = 1) => {
      const kinds: BouncingSparkle['kind'][] = ['star', 'star', 'droplet', 'dot']
      for (let i = 0; i < count; i++) {
        // Spawn directly around the roaring flame perimeter so sparkles visibly pop off the fire
        const spawnAngle = -Math.PI * 0.88 + Math.random() * Math.PI * 1.76
        const spawnR = heroSize * (0.28 + Math.random() * 0.24)
        const sx = centerX + Math.cos(spawnAngle) * spawnR
        const sy = centerY + Math.sin(spawnAngle) * spawnR * 0.9 - 4

        const speed = (2.1 + Math.random() * 3.4) * speedMul
        const vx = Math.cos(spawnAngle) * speed + (Math.random() - 0.5) * 1.1
        const vy = Math.sin(spawnAngle) * speed - (1.6 + Math.random() * 1.9) * speedMul
        const maxLife = 36 + Math.random() * 28

        particles.push({
          x: sx,
          y: sy,
          vx,
          vy,
          size: 3.4 + Math.random() * 4.8,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.16,
          life: maxLife,
          maxLife,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          kind: kinds[Math.floor(Math.random() * kinds.length)],
          bouncesLeft: Math.random() < 0.72 ? 2 : 1,
          floorY: Math.min(cardH - 12, centerY + heroSize * (0.34 + Math.random() * 0.22)),
        })
      }
    }

    const startTime = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000
      const p = Math.min(1, elapsed / TOTAL_DURATION_S)

      // --- 1. Flame position, scale, squash-and-stretch, and motion lean ---
      let fx = origin.x
      let fy = origin.y
      let scaleX = startScale
      let scaleY = startScale
      let leanX = 0
      let morphIntensity = 0.25

      if (elapsed < 0.09) {
        // Anticipation squash at the slot before springing up
        const u = elapsed / 0.09
        const sq = Math.sin(u * Math.PI)
        scaleX = startScale * (1 + 0.16 * sq)
        scaleY = startScale * (1 - 0.14 * sq)
        morphIntensity = 0.25 + 0.35 * u
      } else if (elapsed < 0.44) {
        // Spring & grow smoothly from the slot to center of the card
        const u = (elapsed - 0.09) / 0.35
        const ePos = easeOutBack(u)
        const eScale = easeOutCubic(u)
        fx = lerp(origin.x, centerX, ePos)
        // Slight graceful upward arc toward center
        fy = lerp(origin.y, centerY, ePos) - Math.sin(u * Math.PI) * 14
        const baseScale = lerp(startScale, 1.0, eScale)
        const stretch = Math.sin(u * Math.PI) * 0.16
        scaleX = baseScale * (1 - stretch * 0.55)
        scaleY = baseScale * (1 + stretch)
        // Flame tip trails behind horizontal travel direction
        const dir = Math.sign(centerX - origin.x) || 1
        leanX = -dir * Math.sin(u * Math.PI) * 0.9
        morphIntensity = lerp(0.5, 0.9, u)
      } else if (elapsed < 0.62) {
        // Ignition surge: brief crouch then big energetic flare!
        const u = (elapsed - 0.44) / 0.18
        fx = centerX
        if (u < 0.42) {
          const c = u / 0.42
          fy = centerY + c * 6
          scaleX = 1.0 + 0.12 * c
          scaleY = 1.0 - 0.11 * c
          morphIntensity = lerp(0.9, 1.1, c)
        } else {
          const s = easeOutBack((u - 0.42) / 0.58)
          fy = lerp(centerY + 6, centerY - 5, s)
          scaleX = lerp(1.12, 1.06, s)
          scaleY = lerp(0.89, 1.12, s)
          morphIntensity = 1.25
        }
      } else if (elapsed < 1.56) {
        // Roaring morphing dance at center while the card glows orange
        const u = (elapsed - 0.62) / 0.94
        fx = centerX + Math.sin(elapsed * 7.2) * 2.2
        fy = centerY - 4 + Math.cos(elapsed * 6.4) * 3.0
        const pulse = Math.sin(elapsed * 9.5) * 0.045
        scaleX = 1.04 - pulse * 0.6
        scaleY = 1.06 + pulse
        morphIntensity = lerp(1.25, 0.95, u)
      } else {
        // Smooth geometric return from center back into the resting flame slot
        const u = Math.min(1, (elapsed - 1.56) / (TOTAL_DURATION_S - 1.56))
        const e = easeInOutCubic(u)
        fx = lerp(centerX, origin.x, e)
        fy = lerp(centerY - 4, origin.y, e) - Math.sin(u * Math.PI) * 8
        const baseScale = lerp(1.04, startScale, e)
        const stretch = Math.sin(u * Math.PI) * 0.1
        scaleX = baseScale * (1 - stretch * 0.4)
        scaleY = baseScale * (1 + stretch)
        const dir = Math.sign(origin.x - centerX) || -1
        leanX = -dir * Math.sin(u * Math.PI) * 0.65
        morphIntensity = lerp(0.9, 0.0, e)
      }

      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
      }

      // --- 2. Morph the 3 actual SVG flame paths every frame ---
      const paths = buildMorphingFlamePaths(elapsed, morphIntensity, leanX)
      if (outerPathRef.current) outerPathRef.current.setAttribute('d', paths.outer)
      if (midPathRef.current) midPathRef.current.setAttribute('d', paths.mid)
      if (innerPathRef.current) innerPathRef.current.setAttribute('d', paths.inner)
      if (coreEllipseRef.current) {
        coreEllipseRef.current.setAttribute('cx', paths.glowCx.toFixed(2))
        coreEllipseRef.current.setAttribute('cy', paths.glowCy.toFixed(2))
        coreEllipseRef.current.setAttribute('rx', paths.glowRx.toFixed(2))
        coreEllipseRef.current.setAttribute('ry', paths.glowRy.toFixed(2))
      }

      // --- 3. Orange card flood driven directly by the flame's ignition surge ---
      let washRadius = 0
      let washOpacity = 0
      if (elapsed >= 0.48 && elapsed < 0.86) {
        const u = easeOutCubic((elapsed - 0.48) / 0.38)
        washRadius = maxWashRadius * u
        washOpacity = Math.min(1, u * 1.35)
      } else if (elapsed >= 0.86 && elapsed < 1.56) {
        washRadius = maxWashRadius
        washOpacity = 1
      } else if (elapsed >= 1.56) {
        const u = easeInOutCubic((elapsed - 1.56) / (TOTAL_DURATION_S - 1.56))
        washRadius = maxWashRadius * (1 - u)
        washOpacity = Math.max(0, 1 - u * 0.95)
      }

      if (washRef.current) {
        washRef.current.style.clipPath = `circle(${washRadius.toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)`
        washRef.current.style.opacity = washOpacity.toFixed(3)
      }

      // --- 4. Sparkles & droplets popping and bouncing physically off the fire ---
      if (!burst1Fired && elapsed >= 0.54) {
        burst1Fired = true
        spawnOffFlame(18, 1.15)
      }
      if (!burst2Fired && elapsed >= 0.84) {
        burst2Fired = true
        spawnOffFlame(12, 0.95)
      }
      if (elapsed > 0.6 && elapsed < 1.48 && elapsed - lastEmitT >= 0.14) {
        lastEmitT = elapsed
        spawnOffFlame(3, 0.82)
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(dpr, dpr)

        for (let i = particles.length - 1; i >= 0; i--) {
          const sp = particles[i]
          // Gravity pulls sparkles down into playful bounce arcs
          sp.vy += 0.16
          sp.vx *= 0.985
          sp.x += sp.vx
          sp.y += sp.vy
          sp.rotation += sp.vRot
          sp.life -= 1

          // Bounce off the sparkle's virtual floor / lower fire arc!
          if (sp.y >= sp.floorY && sp.vy > 0 && sp.bouncesLeft > 0) {
            sp.y = sp.floorY
            sp.vy = -Math.abs(sp.vy) * (0.58 + Math.random() * 0.14)
            sp.vx *= 0.86
            sp.bouncesLeft -= 1
          }

          // Soft bounce off card side edges so sparkles stay lively inside the card
          if (sp.x < 10 && sp.vx < 0) {
            sp.x = 10
            sp.vx = Math.abs(sp.vx) * 0.65
          } else if (sp.x > cardW - 10 && sp.vx > 0) {
            sp.x = cardW - 10
            sp.vx = -Math.abs(sp.vx) * 0.65
          }

          if (sp.life <= 0) {
            particles.splice(i, 1)
            continue
          }

          const lt = sp.life / sp.maxLife
          // Twinkle alpha + scale
          const alpha = Math.min(1, lt * 1.6) * (0.78 + 0.22 * Math.sin(sp.life * 0.6))
          const s = sp.size * (0.35 + 0.65 * Math.sin(Math.min(1, lt * 1.2) * Math.PI * 0.5))

          ctx.save()
          ctx.translate(sp.x, sp.y)
          ctx.rotate(sp.rotation)
          ctx.globalAlpha = alpha
          ctx.fillStyle = sp.color

          if (sp.kind === 'star') {
            ctx.beginPath()
            ctx.moveTo(0, -s * 1.35)
            ctx.quadraticCurveTo(s * 0.2, -s * 0.2, s * 1.35, 0)
            ctx.quadraticCurveTo(s * 0.2, s * 0.2, 0, s * 1.35)
            ctx.quadraticCurveTo(-s * 0.2, s * 0.2, -s * 1.35, 0)
            ctx.quadraticCurveTo(-s * 0.2, -s * 0.2, 0, -s * 1.35)
            ctx.closePath()
            ctx.fill()
          } else if (sp.kind === 'droplet') {
            ctx.beginPath()
            ctx.moveTo(0, -s * 1.15)
            ctx.bezierCurveTo(s * 0.85, -s * 0.15, s * 0.72, s * 0.85, 0, s * 0.85)
            ctx.bezierCurveTo(-s * 0.72, s * 0.85, -s * 0.85, -s * 0.15, 0, -s * 1.15)
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        }

        ctx.restore()
      }

      if (p < 1 && !dismissingRef.current) {
        rafId = window.requestAnimationFrame(tick)
      } else if (!dismissingRef.current) {
        finishOnce()
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin])

  const cardW = Math.max(1, origin.cardWidth)
  const cardH = Math.max(1, origin.cardHeight)
  const heroSize = Math.round(Math.max(96, Math.min(Math.min(cardW, cardH) * 0.56, 134)))
  const heroHeight = Math.round(heroSize * 1.14)

  return (
    <div
      className={`streak-overlay ${dismissing ? 'is-dismissing' : ''}`.trim()}
      style={{ pointerEvents: dismissing ? 'none' : 'auto' }}
      role="presentation"
      aria-hidden="true"
      onClick={triggerEarlyDismiss}
    >
      {/* Warm Duolingo orange card flood expanding from the roaring flame */}
      <div ref={washRef} className="streak-overlay-wash" />

      {/* Bouncing sparkles & fire droplets */}
      <canvas ref={canvasRef} className="streak-overlay-canvas" aria-hidden="true" />

      {/* Dynamically morphing 3-layer vector flame */}
      <div
        ref={heroRef}
        className="streak-overlay-hero"
        style={{ width: heroSize, height: heroHeight }}
      >
        <svg
          width={heroSize}
          height={heroHeight}
          viewBox="0 0 76 86"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path ref={outerPathRef} d={RESTING_PATHS.outer} fill="#FF9600" stroke="#FFF4C2" strokeOpacity="0.42" strokeWidth="1.2" />
          <path ref={midPathRef} d={RESTING_PATHS.mid} fill="#FFC800" />
          <path ref={innerPathRef} d={RESTING_PATHS.inner} fill="#FFF1B8" />
          <ellipse ref={coreEllipseRef} cx="38.4" cy="67.5" rx="6.2" ry="4.8" fill="#FFFDF2" opacity="0.78" />
        </svg>
      </div>
    </div>
  )
}
