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

// 5. Microphone Coiled Wire Connector
// 1) Smooth 90° curve from Photo Card base towards gear card
// 2) Single continuous vertical downward spiral spring (like the user reference drawing)
// 3) Connects with L-shaped 90° right-angle connector plugged into Gear Card
export function MicrophoneCoiledWire({ className = '' }: { className?: string }) {
  // Continuous single wire path with 90° top curve, vertical spring coils, and lead into L-plug
  const springWirePath = `
    M 8 52
    L 20 52
    C 34 52, 44 58, 44 72
    L 44 82
    C 47 85, 57 89, 57 94
    C 57 100, 37 102, 30 97
    C 26 93, 38 100, 44 104
    C 47 107, 57 111, 57 116
    C 57 122, 37 124, 30 119
    C 26 115, 38 122, 44 126
    C 47 129, 57 133, 57 138
    C 57 144, 37 146, 30 141
    C 26 137, 38 144, 44 148
    C 47 151, 57 155, 57 160
    C 57 166, 37 168, 30 163
    C 26 159, 38 166, 44 170
    L 44 204
  `

  return (
    <div className={`mic-wire-connector-wrapper ${className}`} aria-hidden="true">
      <svg
        className="mic-coiled-cable-svg"
        viewBox="0 0 68 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Base Connector on Photo Card right edge (x=0, y=52) */}
        <g className="mic-card-base">
          <rect
            x="0"
            y="43"
            width="8"
            height="18"
            rx="3"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <line x1="8" y1="46" x2="8" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 2. Continuous Spring Cable Path */}
        <motion.path
          d={springWirePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mic-cable-stroke"
        />

        {/* 3. L-Shaped (Right-Angle) Connector Plug into Gear Card (flush at x=0) */}
        <g className="mic-l-connector-plug">
          {/* Top Strain Relief Collar where vertical spring wire enters */}
          <rect
            x="41"
            y="203"
            width="6"
            height="5"
            rx="1.2"
            fill="currentColor"
          />

          {/* Vertical elbow block */}
          <rect
            x="38"
            y="207"
            width="12"
            height="15"
            rx="2"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.4"
          />

          {/* Horizontal box meeting and clipping directly at card edge (x=0) */}
          <rect
            x="0"
            y="210"
            width="40"
            height="9"
            fill="var(--bento-bg)"
            stroke="currentColor"
            strokeWidth="1.4"
          />

          {/* Grip groove lines on L-connector body */}
          <line x1="14" y1="212" x2="14" y2="217" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="20" y1="212" x2="20" y2="217" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
          <line x1="26" y1="212" x2="26" y2="217" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
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
