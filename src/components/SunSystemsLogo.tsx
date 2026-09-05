import type { CSSProperties } from 'react'

interface SunSystemsLogoProps {
  className?: string
  style?: CSSProperties
  color?: string
}

export function SunSystemsLogo({
  className = '',
  style,
  color = '#ffffff',
}: SunSystemsLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 963 300"
      className={`sun-systems-logo-svg ${className}`}
      style={{ display: 'block', ...style }}
      aria-label="Sun Systems"
      role="img"
    >
      <style>{`
        .ss-lockup-font {
          font-family: "Minecraft", monospace, sans-serif;
          font-size: 93px;
          letter-spacing: -0.01em;
        }
      `}</style>

      {/* "Sun" Wordmark Text */}
      <text x="30.0" y="179.0" fill={color} className="ss-lockup-font">
        Sun
      </text>

      {/* Orbit Ring */}
      <circle
        cx="377"
        cy="150.0"
        r="84"
        fill="none"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1.5"
      />

      {/* Central Yellow Sun */}
      <rect x="347.0" y="120.0" width="60" height="60" fill="#f2b800" />

      {/* Orbiting Blue Cube */}
      <rect x="305.0" y="67.7" width="36" height="36" fill="#2662d6" />

      {/* Orbiting Red Cube */}
      <rect x="441.7" y="117.4" width="36" height="36" fill="#c3372b" />

      {/* Orbiting Green Cube */}
      <rect x="330.3" y="210.9" width="36" height="36" fill="#3aa86b" />

      {/* "Systems" Wordmark Text */}
      <text x="561.0" y="179.0" fill={color} className="ss-lockup-font">
        Systems
      </text>
    </svg>
  )
}
