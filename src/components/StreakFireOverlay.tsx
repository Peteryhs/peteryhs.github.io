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
  const f = Math.max(0, Math.min(1.2, intensity))

  // Controlled, crisp upper-tip waves with an anchored base (stable, lively, non-jello)
  const w1 = Math.sin(timeSec * 6.8)
  const w2 = Math.sin(timeSec * 10.4 + 0.8)

  const m1 = Math.sin(timeSec * 8.2 + 1.05)
  const m2 = Math.sin(timeSec * 12.1 + 1.9)

  const c1 = Math.sin(timeSec * 9.6 + 1.85)
  const c2 = Math.cos(timeSec * 13.4 + 0.6)

  // --- Layer 1: Outer flame silhouette (base & belly anchored, tips lick crisply) ---
  const oTipX = 41.2 + (w1 * 2.5 + w2 * 0.9) * f + leanX * 4.5
  const oTipY = 4.8 - (Math.abs(w1) * 2.4 + 0.6) * f
  const oNotchX = 30.8 + (w2 * 1.2) * f + leanX * 1.8
  const oNotchY = 27.6 + (w1 * 1.1) * f
  const oLeftLickX = 26.8 + (w1 * 1.4 - w2 * 0.8) * f + leanX * 2.4
  const oLeftLickY = 14.8 - (Math.sin(timeSec * 7.8 + 1.2) * 2.2 + 0.6) * f

  const outer = [
    `M${oTipX.toFixed(2)} ${oTipY.toFixed(2)}`,
    `C${(42.9 + w1 * 1.6 * f + leanX * 2.2).toFixed(2)} ${(14.9 + w2 * 0.9 * f).toFixed(2)} ${(35.8 + w2 * 1.1 * f).toFixed(2)} ${(22.1 + w1 * 0.8 * f).toFixed(2)} ${oNotchX.toFixed(2)} ${oNotchY.toFixed(2)}`,
    `C${(27.2 + w1 * 0.8 * f).toFixed(2)} ${(24.4 + w2 * 0.8 * f).toFixed(2)} ${(25.7 + w2 * 1.0 * f).toFixed(2)} ${(19.6 - w1 * 0.8 * f).toFixed(2)} ${oLeftLickX.toFixed(2)} ${oLeftLickY.toFixed(2)}`,
    `C${(16.2 - w2 * 0.7 * f).toFixed(2)} ${(21.8 + w1 * 0.8 * f).toFixed(2)} 9.2 33.8 9.2 48.2`,
    `C9.2 66.8 22.5 81.2 38.4 81.2`,
    `C54.8 81.2 67.2 67.4 67.2 49.4`,
    `C67.2 34.4 ${(58.6 + w2 * 1.5 * f + leanX * 2.2).toFixed(2)} ${(19.8 - w1 * 1.0 * f).toFixed(2)} ${oTipX.toFixed(2)} ${oTipY.toFixed(2)}Z`,
  ].join(' ')

  // --- Layer 2: Mid amber tongue (anchored base, phase-offset upper tip) ---
  const mTipX = 39.8 + (m1 * 2.3 + m2 * 0.8) * f + leanX * 3.4
  const mTipY = 23.4 - (Math.abs(m1) * 2.8 + 0.5) * f
  const mNotchX = 31.8 + (m2 * 1.0) * f + leanX * 1.4
  const mNotchY = 40.6 + (m1 * 1.0) * f
  const mLeftLickX = 29.3 + (m1 * 1.2 - m2 * 0.7) * f + leanX * 1.8
  const mLeftLickY = 31.4 - (Math.cos(timeSec * 8.6 + 0.6) * 1.8 + 0.4) * f

  const mid = [
    `M${mTipX.toFixed(2)} ${mTipY.toFixed(2)}`,
    `C${(41.2 + m1 * 1.4 * f + leanX * 1.8).toFixed(2)} ${(31.4 + m2 * 0.8 * f).toFixed(2)} ${(35.2 + m2 * 0.9 * f).toFixed(2)} ${(36.8 + m1 * 0.8 * f).toFixed(2)} ${mNotchX.toFixed(2)} ${mNotchY.toFixed(2)}`,
    `C${(29.4 + m1 * 0.7 * f).toFixed(2)} ${(38.2 + m2 * 0.7 * f).toFixed(2)} ${(28.5 + m2 * 0.8 * f).toFixed(2)} ${(34.8 - m1 * 0.7 * f).toFixed(2)} ${mLeftLickX.toFixed(2)} ${mLeftLickY.toFixed(2)}`,
    `C${(22.4 - m1 * 0.6 * f).toFixed(2)} 36.8 18.2 45.2 18.2 54.6`,
    `C18.2 66.8 27.2 76.4 38.4 76.4`,
    `C49.8 76.4 58.4 67.1 58.4 55.2`,
    `C58.4 44.6 ${(52.1 + m2 * 1.2 * f + leanX * 1.6).toFixed(2)} ${(34.2 - m1 * 0.9 * f).toFixed(2)} ${mTipX.toFixed(2)} ${mTipY.toFixed(2)}Z`,
  ].join(' ')

  // --- Layer 3: Bright inner yellow-white core (anchored base, crisp upward pulse) ---
  const cTipX = 39.0 + (c1 * 1.9 + c2 * 0.6) * f + leanX * 2.0
  const cTipY = 44.2 - (Math.abs(c1) * 2.6 + 0.5) * f

  const inner = [
    `M${cTipX.toFixed(2)} ${cTipY.toFixed(2)}`,
    `C${(32.4 + c1 * 0.8 * f).toFixed(2)} ${(49.8 + c2 * 0.7 * f).toFixed(2)} 27.8 56.4 27.8 63.4`,
    `C27.8 70.1 32.5 75.4 38.4 75.4`,
    `C44.4 75.4 49.1 70.1 49.1 63.6`,
    `C49.1 56.8 ${(45.2 + c1 * 0.9 * f).toFixed(2)} ${(50.2 - c1 * 0.7 * f).toFixed(2)} ${cTipX.toFixed(2)} ${cTipY.toFixed(2)}Z`,
  ].join(' ')

  return {
    outer,
    mid,
    inner,
    glowCx: 38.4 + c1 * 0.5 * f,
    glowCy: 67.5 - Math.abs(c2) * 0.7 * f,
    glowRx: 6.2 + Math.abs(c1) * 0.8 * f,
    glowRy: 4.8 + Math.abs(c2) * 0.7 * f,
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
const TOTAL_DURATION_S = 2.1

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
    const maxWashRadius = Math.ceil(
      Math.hypot(Math.max(origin.x, cardW - origin.x), Math.max(origin.y, cardH - origin.y)) + 18
    )

    const particles: BouncingSparkle[] = []
    let burst1Fired = false
    let burst2Fired = false
    let lastEmitT = 0.42

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

      // --- 1. Flame position, crisp bouncy scale, and stable center hold ---
      let fx = origin.x
      let fy = origin.y
      let scaleX = startScale
      let scaleY = startScale
      let leanX = 0
      let morphIntensity = 0.2

      if (elapsed < 0.44) {
        // Spring & pop smoothly from slot to center right from frame 1
        const u = elapsed / 0.44
        const ePos = easeOutCubic(u)
        const eScale = easeOutBack(u)
        fx = lerp(origin.x, centerX, ePos)
        fy = lerp(origin.y, centerY - 2, ePos) - Math.sin(u * Math.PI) * 10
        const baseScale = lerp(startScale, 1.0, eScale)
        // Subtle crisp bounce stretch on arrival
        const bounce = Math.sin(u * Math.PI) * 0.08
        scaleX = baseScale * (1 - bounce * 0.45)
        scaleY = baseScale * (1 + bounce)
        const dir = Math.sign(centerX - origin.x) || 1
        leanX = -dir * Math.sin(u * Math.PI) * 0.5
        morphIntensity = lerp(0.25, 0.9, ePos)
      } else if (elapsed < 1.48) {
        // Stable, crisp center stance with a gentle elastic vertical breath (no sideways shaking!)
        const u = (elapsed - 0.44) / 1.04
        fx = centerX
        // Crisp single bounce-pop right after landing, then steady gentle buoyancy
        const settlePop = u < 0.24 ? Math.sin((u / 0.24) * Math.PI) * 0.075 : 0
        const breath = Math.sin(u * Math.PI * 2) * 0.025
        fy = centerY - 2 - settlePop * 18 - breath * 14
        scaleX = 1.0 - (settlePop + breath) * 0.35
        scaleY = 1.0 + settlePop + breath
        morphIntensity = lerp(0.95, 0.8, u)
      } else {
        // Smooth geometric return from center back into the resting flame slot
        const u = Math.min(1, (elapsed - 1.48) / (TOTAL_DURATION_S - 1.48))
        const e = easeInOutCubic(u)
        fx = lerp(centerX, origin.x, e)
        fy = lerp(centerY - 2, origin.y, e) - Math.sin(u * Math.PI) * 6
        const baseScale = lerp(1.0, startScale, e)
        scaleX = baseScale
        scaleY = baseScale
        const dir = Math.sign(origin.x - centerX) || -1
        leanX = -dir * Math.sin(u * Math.PI) * 0.35
        morphIntensity = lerp(0.8, 0.0, e)
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

      // --- 3. Solid orange background blooms IN SYNC with the flame from frame 1 and contracts back together ---
      let washRadius = 0
      let washOpacity = 1
      if (elapsed < 0.44) {
        const u = easeOutCubic(elapsed / 0.44)
        washRadius = maxWashRadius * u
        washOpacity = Math.min(1, 0.25 + u * 0.75)
      } else if (elapsed < 1.48) {
        washRadius = maxWashRadius
        washOpacity = 1
      } else {
        const u = easeInOutCubic((elapsed - 1.48) / (TOTAL_DURATION_S - 1.48))
        washRadius = maxWashRadius * (1 - u)
        washOpacity = Math.max(0, 1 - u * 0.92)
      }

      if (washRef.current) {
        washRef.current.style.clipPath = `circle(${washRadius.toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)`
        washRef.current.style.opacity = washOpacity.toFixed(3)
      }

      // --- 4. Sparkles & droplets popping and bouncing physically off the fire ---
      if (!burst1Fired && elapsed >= 0.34) {
        burst1Fired = true
        spawnOffFlame(16, 1.1)
      }
      if (!burst2Fired && elapsed >= 0.68) {
        burst2Fired = true
        spawnOffFlame(10, 0.92)
      }
      if (elapsed > 0.42 && elapsed < 1.38 && elapsed - lastEmitT >= 0.16) {
        lastEmitT = elapsed
        spawnOffFlame(3, 0.8)
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
          <path ref={outerPathRef} d={RESTING_PATHS.outer} fill="#FF9600" />
          <path ref={midPathRef} d={RESTING_PATHS.mid} fill="#FFC800" />
          <path ref={innerPathRef} d={RESTING_PATHS.inner} fill="#FFF1B8" />
          <ellipse ref={coreEllipseRef} cx="38.4" cy="67.5" rx="6.2" ry="4.8" fill="#FFFDF2" opacity="0.78" />
        </svg>
      </div>
    </div>
  )
}
