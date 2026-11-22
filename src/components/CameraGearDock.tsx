import { useState } from 'react'
import { motion } from 'motion/react'

interface CameraDevice {
  id: string
  name: string
  label: string
}

const GEAR_DEVICES: CameraDevice[] = [
  {
    id: 'luna-ultra',
    name: 'Insta360 Luna Ultra',
    label: 'Insta360 Luna Ultra',
  },
  {
    id: 'x5',
    name: 'Insta360 X5',
    label: 'Insta360 X5',
  },
  {
    id: 'a5000',
    name: 'Sony Alpha 5000',
    label: 'Sony Alpha 5000',
  },
  {
    id: 'p10-pro',
    name: 'Pixel 10 Pro',
    label: 'Pixel 10 Pro',
  },
]

// 1. Simplified Luna Ultra
export function LunaUltraVector({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`gear-vector-svg ${className}`}
      viewBox="0 0 68 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 8.5h42c4.1 0 7.4 3.3 7.4 7.4v10.2c0 4.1-3.3 7.4-7.4 7.4H13c-4.1 0-7.4-3.3-7.4-7.4V15.9c0-4.1 3.3-7.4 7.4-7.4Z" />
        <circle cx="22.5" cy="21" r="7.8" />
        <circle cx="45.5" cy="21" r="7.8" />
        <circle cx="22.5" cy="21" r="3.1" opacity="0.7" />
        <circle cx="45.5" cy="21" r="3.1" opacity="0.7" />
      </g>
    </svg>
  )
}

// 2. Simplified Insta360 X5
export function InstaX5Vector({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`gear-vector-svg ${className}`}
      viewBox="0 0 46 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="8.5" y="3.5" width="29" height="65" rx="10.5" />
      <circle cx="23" cy="16" r="9.5" />
      <circle cx="23" cy="16" r="6.1" opacity="0.78" />
      <path d="M15.8 14.2c0-2.8 1.4-5.1 3.5-6.2" opacity="0.5" />
      <rect x="15" y="31" width="16" height="20" rx="2.8" />
      <path d="M20 60.8h6" opacity="0.85" />
    </svg>
  )
}

// 3. Simplified Sony Alpha 5000
export function SonyA5000Vector({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`gear-vector-svg ${className}`}
      viewBox="0 0 68 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9.5" y="2" width="10" height="4" rx="1.2" />
      <path d="M8 8h15.5L27 4h20l3.5 4H60c2.8 0 5 2.2 5 5v27c0 2.7-2.2 5-5 5H8c-2.7 0-5-2.3-5-5V13c0-2.8 2.2-5 5-5Z" />
      <circle cx="37" cy="26" r="15" />
      <circle cx="37" cy="26" r="10" />
      <circle cx="37" cy="26" r="4.8" opacity="0.65" />
      <path d="M53 14.5h5" opacity="0.5" />
    </svg>
  )
}

// 4. Simplified Pixel 10 Pro
export function PixelProVector({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`gear-vector-svg ${className}`}
      viewBox="0 0 40 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="30" height="60" rx="7" />
      <rect x="8.5" y="12.5" width="23" height="9.5" rx="4.8" />
      <circle cx="14.5" cy="17.2" r="1.5" />
      <circle cx="20" cy="17.2" r="1.5" />
      <circle cx="25.5" cy="17.2" r="1.5" />
    </svg>
  )
}

// Dynamic Icon Switcher
export function GearDeviceIcon({ id, className = '' }: { id: string; className?: string }) {
  switch (id) {
    case 'luna-ultra':
      return <LunaUltraVector className={className} />
    case 'x5':
      return <InstaX5Vector className={className} />
    case 'a5000':
      return <SonyA5000Vector className={className} />
    case 'p10-pro':
    default:
      return <PixelProVector className={className} />
  }
}

// Build smooth 3D-projected helical turns for a true-to-life coiled 3.5mm TRS audio cable.
function buildHelixArcs(
  cx: number,
  y0: number,
  radius: number,
  pitch: number,
  tilt: number,
  turns: number,
) {
  const sample = (tStart: number, tEnd: number, steps: number) => {
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const th = tStart + ((tEnd - tStart) * i) / steps
      const x = (cx + radius * Math.cos(th)).toFixed(2)
      const y = (y0 + (pitch / (2 * Math.PI)) * th + tilt * Math.sin(th)).toFixed(2)
      d += `${i === 0 ? 'M' : ' L'}${x} ${y}`
    }
    return d
  }

  const back: string[] = []
  const front: string[] = []
  const mask: string[] = []

  for (let k = 0; k < turns; k++) {
    const base = k * 2 * Math.PI
    // Keep the outer left/right silhouette turns at full strength; only the recessed rear diagonal dims.
    const frontStart = k === 0 ? base : base - 0.36
    front.push(sample(frontStart, base + Math.PI + 0.36, 20))
    mask.push(sample(base + 0.24, base + Math.PI - 0.24, 14))
    back.push(sample(base + Math.PI, base + 2 * Math.PI, 18))
  }

  // Bring the final outer right turn back to full strength right before the bottom lead begins.
  const endTheta = turns * 2 * Math.PI
  const exitRim = sample(endTheta - 0.36, endTheta, 6)
  const yEnd = y0 + turns * pitch
  return { back, front, mask, exitRim, yEnd }
}

const COIL_CX = 42
const COIL_R = 9
const COIL_Y0 = 76
const COIL_HELIX = buildHelixArcs(COIL_CX, COIL_Y0, COIL_R, 11.5, 4.1, 7)

// 5. Microphone Coiled Wire Connector (on-camera shotgun mic coiled 3.5mm TRS patch cable)
// 1) Straight 3.5mm TRS output plug + ribbed strain-relief boot on the Photography card
// 2) True 3D helical coiled audio cable with front/back overlap depth
// 3) 90° right-angle 3.5mm TRS headphone jack (with TRS insulator bands) into the Gear Dock
export function MicrophoneCoiledWire({ className = '' }: { className?: string }) {
  const rightEdge = COIL_CX + COIL_R
  // Top lead exits the straight plug horizontally and curves C1-smoothly into the first coil tangent.
  const topLead = `M 30.5 44 H 36 C 45.5 44, ${rightEdge} 51, ${rightEdge} 64 V ${COIL_Y0}`
  // Bottom lead exits the last coil turn vertically and S-curves cleanly onto the right-angle boot axis.
  const bottomLead = `M ${rightEdge} ${COIL_HELIX.yEnd} C ${rightEdge} ${COIL_HELIX.yEnd + 10}, ${COIL_CX} ${COIL_HELIX.yEnd + 11}, ${COIL_CX} ${COIL_HELIX.yEnd + 22} V 186`

  return (
    <div className={`mic-wire-connector-wrapper ${className}`} aria-hidden="true">
      <svg
        className="mic-coiled-cable-svg"
        viewBox="0 0 68 260"
        preserveAspectRatio="xMinYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Top Straight 3.5mm TRS Output Plug seated flush on Photography Card (x=0, y=44) */}
        <g className="mic-card-base">
          {/* Recessed 3.5mm jack socket bezel on card edge */}
          <path
            d="M 0 36.5 H 2.4 A 1.2 1.2 0 0 1 3.6 37.7 V 50.3 A 1.2 1.2 0 0 1 2.4 51.5 H 0 Z"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Stepped metallic plug shoulder */}
          <rect
            x="3.6"
            y="40.6"
            width="3.8"
            height="6.8"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.35"
          />
          {/* Cylindrical molded plug barrel with subtle knurled grip grooves */}
          <rect
            x="7.4"
            y="38.5"
            width="13"
            height="11"
            rx="2"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.45"
          />
          <line x1="10.8" y1="40.8" x2="10.8" y2="47.2" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <line x1="13.9" y1="40.8" x2="13.9" y2="47.2" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <line x1="17.0" y1="40.8" x2="17.0" y2="47.2" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          {/* Tapered 3-rib flexible strain-relief boot */}
          <path
            d="M 20.4 40.5 L 30.5 42.2 V 45.8 L 20.4 47.5 Z"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <line x1="23.4" y1="41.3" x2="23.4" y2="46.7" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="26.1" y1="41.7" x2="26.1" y2="46.3" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="28.5" y1="42.0" x2="28.5" y2="46.0" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
        </g>

        {/* 2. Coiled Audio Cable — back loops first, then front loops with paper knockout for 3D depth */}
        <g className="mic-cable-back" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.46">
          {COIL_HELIX.back.map((d, i) => (
            <path key={`back-${i}`} d={d} />
          ))}
        </g>

        <g className="mic-cable-knockout" stroke="var(--paper)" strokeWidth="4.2" strokeLinecap="butt">
          {COIL_HELIX.mask.map((d, i) => (
            <path key={`mask-${i}`} d={d} />
          ))}
        </g>

        <g className="mic-cable-stroke" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
          <path d={topLead} />
          {COIL_HELIX.front.map((d, i) => (
            <path key={`front-${i}`} d={d} />
          ))}
          <path d={COIL_HELIX.exitRim} />
          <path d={bottomLead} />
        </g>

        {/* 3. Bottom 90° Right-Angle 3.5mm TRS Headphone Jack plugged into Gear Dock (x=0, y=216) */}
        <g className="mic-l-connector-plug">
          {/* Vertical tapered 3-rib flexible strain-relief boot */}
          <path
            d="M 40.2 186 H 43.8 L 45.4 200 H 38.6 Z"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <line x1="40.0" y1="189.8" x2="44.0" y2="189.8" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="39.6" y1="193.3" x2="44.4" y2="193.3" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="39.2" y1="196.8" x2="44.8" y2="196.8" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />

          {/* Unified molded 90° right-angle plug housing */}
          <path
            d="M 37.4 200 H 46.6 A 1.4 1.4 0 0 1 48 201.4 V 218.5 A 3.5 3.5 0 0 1 44.5 222 H 23.4 A 1.4 1.4 0 0 1 22 220.6 V 211.4 A 1.4 1.4 0 0 1 23.4 210 H 36 A 1.4 1.4 0 0 0 37.4 208.6 Z"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
          {/* Subtle grip ribs on the horizontal barrel + corner relief mark */}
          <line x1="26.4" y1="212.4" x2="26.4" y2="219.6" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <line x1="29.8" y1="212.4" x2="29.8" y2="219.6" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <line x1="33.2" y1="212.4" x2="33.2" y2="219.6" stroke="currentColor" strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <circle cx="42" cy="216" r="1.45" stroke="currentColor" strokeWidth="0.9" opacity="0.38" />

          {/* Stepped metallic plug shoulder */}
          <rect
            x="16.8"
            y="212.2"
            width="5.2"
            height="7.6"
            rx="0.9"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.35"
          />

          {/* 3.5mm TRS metallic shaft with two signature Tip-Ring-Sleeve insulator bands */}
          <rect
            x="3.6"
            y="213.8"
            width="13.2"
            height="4.4"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.35"
          />
          <rect x="7.4" y="213.8" width="1.6" height="4.4" fill="currentColor" />
          <rect x="11.4" y="213.8" width="1.6" height="4.4" fill="currentColor" />

          {/* Recessed 3.5mm MIC-IN socket bezel flush at Gear Dock right edge (x=0) */}
          <path
            d="M 0 208.5 H 2.4 A 1.2 1.2 0 0 1 3.6 209.7 V 222.3 A 1.2 1.2 0 0 1 2.4 223.5 H 0 Z"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <line x1="1.7" y1="211.2" x2="1.7" y2="220.8" stroke="currentColor" strokeWidth="0.85" opacity="0.45" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}

// 6. Camera Gear Card Component
export function CameraGearDock({
  className = '',
  standalone = false,
  id,
  onClick,
}: {
  className?: string
  standalone?: boolean
  id?: string
  onClick?: () => void
}) {
  const [activeDevice, setActiveDevice] = useState<string | null>(null)

  return (
    <div
      id={id || (!standalone ? 'hobbies-gear' : undefined)}
      className={`gear-dock-card ${className} ${standalone ? 'is-standalone is-clickable' : ''}`}
      onClick={(e) => {
        // If clicking background or not on a device button
        if (standalone && onClick && (e.target as HTMLElement).closest('.gear-device-item') === null) {
          onClick()
        }
      }}
    >
      <div className="gear-devices-row">
        {GEAR_DEVICES.map((device) => {
          const isSelected = activeDevice === device.id
          return (
            <motion.div
              key={device.id}
              className={`gear-device-item ${isSelected ? 'is-active' : ''}`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => {
                e.stopPropagation()
                setActiveDevice(isSelected ? null : device.id)
              }}
            >
              <div className="gear-vector-box" title={device.name}>
                <GearDeviceIcon id={device.id} className="device-icon" />
              </div>
              <span className="gear-device-label">{device.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
