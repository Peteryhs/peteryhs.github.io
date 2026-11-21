import type { ReactNode } from 'react'
import type { BlockId } from './blocks'

/**
 * Every surface lives in a 60-unit-tall box and scales with the block's height, so the
 * detail stays in proportion at any font size. Artwork is anchored to the left and right
 * edges (the `Flank` svgs) and the middle is left open for the label's reading scrim.
 */
function Flank({ side, width, children }: { side: 'l' | 'r'; width: number; children: ReactNode }) {
  return (
    <svg
      className={`sf-flank sf-${side}`}
      viewBox={`0 0 ${width} 60`}
      focusable="false"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ projects */

const GRAPH_LEVELS = [
  [4, 3, 4, 2, 3, 1, 0, 1, 0, 0, 0, 1, 0, 2, 3, 4, 3, 4],
  [3, 4, 2, 4, 1, 0, 1, 0, 0, 1, 0, 0, 2, 3, 4, 2, 4, 3],
  [4, 2, 3, 1, 2, 0, 0, 0, 1, 0, 0, 1, 1, 4, 3, 4, 2, 4],
  [2, 4, 4, 3, 0, 1, 0, 1, 0, 0, 1, 0, 3, 2, 4, 3, 4, 4],
]
const GRAPH_FILL = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']

function ProjectsSurface() {
  return (
    <>
      <svg className="sf-graph" viewBox="0 0 180 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {GRAPH_LEVELS.flatMap((row, r) =>
          row.map((level, c) => {
            const pulses = level >= 2 && (r * 5 + c * 3) % 3 === 0
            return (
              <rect
                key={`${r}-${c}`}
                x={c * 10 + 0.8}
                y={r * 10 + 0.8}
                width="8.4"
                height="8.4"
                rx="1.8"
                fill={GRAPH_FILL[level]}
                className={pulses ? `gc gc-${((r + c) % 3) + 1}` : undefined}
              />
            )
          }),
        )}
      </svg>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ compeng */

function BreadboardSurface() {
  return (
    <>
      <i className="sf-half sf-half-l" />
      <i className="sf-half sf-half-r" />
      <i className="bb-channel" />
      <Flank side="l" width={64}>
        <path d="M12 9V16L20 24V41" fill="none" stroke="#0d575b" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9V16L20 24V41" fill="none" stroke="#1fa6a8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 10V16.6L19 24.6V40" fill="none" stroke="#9af3f0" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        <circle cx="12" cy="9" r="1.7" fill="#cfd3d6" />
        <circle cx="20" cy="41" r="1.7" fill="#cfd3d6" />

        <g fill="#c4c9ce">
          <rect x="31" y="19" width="2.4" height="4" rx=".6" />
          <rect x="46.6" y="19" width="2.4" height="4" rx=".6" />
          <rect x="31" y="37" width="2.4" height="4" rx=".6" />
          <rect x="46.6" y="37" width="2.4" height="4" rx=".6" />
        </g>
        <rect x="30" y="22" width="20" height="16" rx="2.2" fill="#26282c" stroke="#0c0d0f" strokeWidth=".6" />
        <path d="M31.5 23.2h17" stroke="#55595f" strokeWidth=".7" strokeLinecap="round" />
        <circle cx="40" cy="30" r="5.6" fill="#17181b" />
        <circle cx="40" cy="30" r="4.6" fill="#3b3e44" />
        <circle cx="40" cy="30.3" r="3.5" fill="#2b2d32" />
        <path d="M36.2 27.4A4.6 4.6 0 0 1 43.8 27" fill="none" stroke="#a5abb3" strokeWidth=".9" strokeLinecap="round" />

        <path d="M52 41V49H60V41" fill="none" stroke="#7f6300" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 41V49H60V41" fill="none" stroke="#f1c232" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M51.2 42V49.8" fill="none" stroke="#fff3b0" strokeWidth=".6" opacity=".6" />
        <circle cx="52" cy="41" r="1.6" fill="#cfd3d6" />
        <circle cx="60" cy="41" r="1.6" fill="#cfd3d6" />
      </Flank>
      <Flank side="r" width={72}>
        <defs>
          <linearGradient id="bb-res" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ecd9b3" />
            <stop offset=".5" stopColor="#d6b98a" />
            <stop offset="1" stopColor="#a98a5c" />
          </linearGradient>
          <radialGradient id="bb-led-glow">
            <stop offset="0" stopColor="#ff4a3a" stopOpacity=".7" />
            <stop offset="1" stopColor="#ff4a3a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M14 19C14 1 44 1 44 19" fill="none" stroke="#8a3410" strokeWidth="4.6" strokeLinecap="round" />
        <path d="M14 19C14 1 44 1 44 19" fill="none" stroke="#e0762c" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M15.4 17C16 5 42 5 42.6 17" fill="none" stroke="#ffc08a" strokeWidth=".8" strokeLinecap="round" opacity=".6" />
        <circle cx="14" cy="19" r="1.7" fill="#cfd3d6" />
        <circle cx="44" cy="19" r="1.7" fill="#cfd3d6" />

        <path d="M14 51V48H25M47 48H58V51" fill="none" stroke="#b6bbc1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="24.6" y="44.2" width="22.8" height="7.6" rx="3.4" fill="url(#bb-res)" stroke="#8a6d43" strokeWidth=".4" />
        <g>
          <rect x="29" y="44.4" width="2.2" height="7.2" fill="#6b3d1c" />
          <rect x="33" y="44.4" width="2.2" height="7.2" fill="#141414" />
          <rect x="37" y="44.4" width="2.2" height="7.2" fill="#c0392b" />
          <rect x="42.2" y="44.4" width="2.2" height="7.2" fill="#d4af37" />
        </g>

        <circle className="led-glow" cx="62" cy="29" r="14" fill="url(#bb-led-glow)" />
        <path d="M59.5 36V41M64.5 36V41" stroke="#bfc4ca" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="55" y="34" width="14" height="2.4" rx="1" fill="#9d1f30" />
        <path d="M56 34.2V29a6 6 0 0 1 12 0v5.2Z" fill="#e23b3b" />
        <circle className="led-core" cx="62" cy="28.2" r="2.7" fill="#ff9a7a" />
        <path d="M58.4 26.4a4 4 0 0 1 2-2.4" fill="none" stroke="#fff" strokeWidth=".9" strokeLinecap="round" opacity=".7" />
      </Flank>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ minecraft */

function Hill({ x, w, y }: { x: number; w: number; y: number }) {
  const dither = Array.from({ length: Math.floor(w / 4) }, (_, i) => i)
  return (
    <g>
      <rect x={x} y={y} width={w} height={60 - y} fill="#8a5a34" />
      <rect x={x} y={y} width={w} height="6" fill="#5db234" />
      <rect x={x} y={y} width={w} height="2" fill="#8ee04d" />
      <rect x={x} y={y + 6} width={w} height="2" fill="#4b8d2a" />
      {dither.map((i) => (
        <g key={i}>
          <rect x={x + i * 4} y={y + 10 + (i % 2) * 4} width="2" height="2" fill="#734a2a" />
          <rect x={x + i * 4 + 2} y={y + 16 + ((i + 1) % 2) * 4} width="2" height="2" fill="#9c6b41" />
        </g>
      ))}
    </g>
  )
}

function MinecraftSurface() {
  return (
    <>
      <i className="mc-sky" />
      <span className="mc-track">
        {Array.from({ length: 8 }, (_, i) => (
          <svg key={i} viewBox="0 0 100 60" focusable="false" aria-hidden="true">
            <g fill="#ffffff" opacity=".78">
              <rect x="10" y="12" width="24" height="4" />
              <rect x="14" y="8" width="12" height="4" />
              <rect x="64" y="8" width="18" height="4" />
              <rect x="68" y="4" width="10" height="4" />
            </g>
          </svg>
        ))}
      </span>
      <i className="mc-ground" />
      <Flank side="l" width={56}>
        <rect x="6" y="22" width="4" height="10" fill="#5b3d22" />
        <rect x="8" y="22" width="2" height="10" fill="#4a3119" />
        <rect x="0" y="16" width="16" height="8" fill="#3f8f2a" />
        <rect x="2" y="12" width="12" height="4" fill="#3f8f2a" />
        <rect x="4" y="8" width="8" height="4" fill="#3f8f2a" />
        <rect x="2" y="18" width="4" height="4" fill="#5cb83a" />
        <rect x="6" y="12" width="4" height="4" fill="#5cb83a" />
        <rect x="10" y="20" width="4" height="4" fill="#2f6f1e" />
        <rect x="0" y="22" width="4" height="2" fill="#2f6f1e" />
        <Hill x={0} w={12} y={32} />
        <Hill x={12} w={12} y={36} />
        <rect x="2" y="54" width="4" height="4" fill="#7d7f83" />
        <rect x="8" y="56" width="4" height="4" fill="#62646a" />
        <rect className="xp xp-a" x="28" y="34" width="2" height="2" fill="#d6ff3f" />
      </Flank>
      <Flank side="r" width={56}>
        <rect x="29" y="3" width="14" height="14" fill="#ffb53a" opacity=".42" />
        <rect x="32" y="6" width="8" height="8" fill="#ffd84a" />
        <rect x="32" y="6" width="8" height="2" fill="#fff0a0" />
        <Hill x={44} w={12} y={32} />
        <Hill x={36} w={8} y={36} />
        <rect x="50" y="54" width="4" height="4" fill="#7d7f83" />
        <rect x="44" y="56" width="4" height="4" fill="#62646a" />
        <rect className="xp xp-b" x="30" y="36" width="2" height="2" fill="#d6ff3f" />
      </Flank>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ ml */

const ML_COLUMNS = [
  { x: 8, ys: [22, 50, 78] },
  { x: 35, ys: [15, 38, 62, 85] },
  { x: 65, ys: [22, 50, 78] },
  { x: 92, ys: [34, 66] },
]
const ML_EDGES: [[number, number], [number, number]][] = [
  [[0, 0], [1, 0]], [[0, 0], [1, 1]], [[0, 1], [1, 1]], [[0, 1], [1, 2]], [[0, 2], [1, 3]],
  [[1, 0], [2, 0]], [[1, 1], [2, 1]], [[1, 2], [2, 1]], [[1, 3], [2, 2]],
  [[2, 0], [3, 0]], [[2, 1], [3, 0]], [[2, 1], [3, 1]], [[2, 2], [3, 1]],
]

function NeuralSurface() {
  const point = ([col, row]: [number, number]) => [ML_COLUMNS[col].x, ML_COLUMNS[col].ys[row]]
  return (
    <>
      <svg className="ml-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {ML_EDGES.map(([a, b], i) => {
          const [x1, y1] = point(a)
          const [x2, y2] = point(b)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
        })}
      </svg>
      {ML_COLUMNS.flatMap((col, c) =>
        col.ys.map((y, r) => (
          <i key={`${c}-${r}`} className={`ml-node ml-col-${c}`} style={{ left: `${col.x}%`, top: `${y}%` }} />
        )),
      )}
      <i className="ml-pulse ml-pulse-up" />
      <i className="ml-pulse ml-pulse-down" />
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ photography */

function HorizonSurface() {
  return (
    <>
      <i className="ph-notch ph-notch-l" />
      <i className="ph-notch ph-notch-r" />
      <span className="ph-horizon">
        <i className="ph-seg ph-seg-l" />
        <i className="ph-seg ph-seg-r" />
      </span>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ electronics */

function Via({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="2.5" fill="#0e3322" stroke="#d8a93e" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r=".9" fill="#04120b" />
    </>
  )
}

function PcbSurface() {
  const left = 'M64 6H22L8 20V40L22 54H64'
  const right = 'M0 6H44L58 20V40L44 54H0'
  return (
    <>
      <i className="pcb-h pcb-h-top" />
      <i className="pcb-h pcb-h-bottom" />
      <Flank side="l" width={64}>
        <path d={left} fill="none" stroke="#d8a93e" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M64 14H34L28 20V27" fill="none" stroke="#b98d2c" strokeWidth="1.2" strokeLinejoin="round" />
        <path className="pcb-pulse" d={left} pathLength="100" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <Via cx={22} cy={6} />
        <Via cx={22} cy={54} />
        <Via cx={8} cy={30} />
        <Via cx={28} cy={30} />
      </Flank>
      <Flank side="r" width={72}>
        <path d={right} fill="none" stroke="#d8a93e" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M0 46H26L34 54" fill="none" stroke="#b98d2c" strokeWidth="1.2" strokeLinejoin="round" />
        <path className="pcb-pulse pcb-pulse-r" d={right} pathLength="100" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <Via cx={44} cy={6} />
        <Via cx={44} cy={54} />
        <Via cx={58} cy={30} />
      </Flank>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ waterloo */

function WaterlooSurface() {
  return (
    <>
      <i className="wl-sky" />
      <i className="wl-mid" />
      <Flank side="l" width={108}>
        <defs>
          <linearGradient id="e7-lobby-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b87e1b" />
            <stop offset=".45" stopColor="#ebba42" />
            <stop offset="1" stopColor="#ffe188" />
          </linearGradient>
          <linearGradient id="e7-reflect-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0be3b" stopOpacity=".28" />
            <stop offset="1" stopColor="#f0be3b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* E5-E7 elevated glass skybridge */}
        <rect x="7" y="37" width="3" height="16" fill="#171c26" />
        <rect x="7" y="37" width=".8" height="16" fill="#323b4d" opacity=".6" />
        <rect x="0" y="27.5" width="24" height="9.5" fill="#1c222e" />
        <rect x="0" y="29" width="24" height="6.2" fill="#d9a12d" opacity=".88" />
        <rect x="0" y="29" width="24" height="1.4" fill="#ffe69e" opacity=".75" />
        <path d="M5 28v8.5M11 28v8.5M17 28v8.5M23 28v8.5" stroke="#151922" strokeWidth="1" />
        <rect x="0" y="27.2" width="24" height=".8" fill="#465268" />
        <rect x="0" y="36.5" width="24" height=".9" fill="#0f131b" />

        {/* E7 west stepped rooftop mechanical penthouse */}
        <rect x="34" y="9" width="52" height="4" fill="#1b212e" />
        <rect x="34" y="9" width="52" height=".7" fill="#455166" />
        <path d="M40 10.5h8M52 10.5h8M64 10.5h8" stroke="#2c3547" strokeWidth=".8" />

        {/* E7 west main architectural massing */}
        <rect x="24" y="13" width="84" height="40" fill="#1b202b" />
        <rect x="24" y="13" width="84" height=".9" fill="#475369" />

        {/* Upper curtain-wall floors with realistic varied room lighting */}
        {/* Floor 4 (y=15..21) */}
        <rect x="27" y="15.5" width="11" height="5.5" fill="#252e40" />
        <rect x="40" y="15.5" width="14" height="5.5" fill="#e5af36" />
        <rect x="40" y="15.5" width="14" height="1.1" fill="#ffe69c" opacity=".8" />
        <rect x="56" y="15.5" width="10" height="5.5" fill="#232c3d" />
        <rect x="68" y="15.5" width="16" height="5.5" fill="#cf9524" />
        <rect x="86" y="15.5" width="12" height="5.5" fill="#f2c44c" />
        <rect x="100" y="15.5" width="8" height="5.5" fill="#242e40" />

        {/* Floor 3 (y=23.5..29.5) */}
        <rect x="27" y="23.5" width="15" height="5.8" fill="#f0bf42" />
        <rect x="27" y="23.5" width="15" height="1.1" fill="#ffe8a6" opacity=".8" />
        <rect x="44" y="23.5" width="10" height="5.8" fill="#242e40" />
        <rect x="56" y="23.5" width="15" height="5.8" fill="#b88322" />
        <rect x="73" y="23.5" width="11" height="5.8" fill="#313c50" />
        <rect x="86" y="23.5" width="14" height="5.8" fill="#e6b036" />
        <rect x="102" y="23.5" width="6" height="5.8" fill="#232c3d" />

        {/* Floor 2 (y=31.8..37.8) */}
        <rect x="27" y="31.8" width="9" height="5.8" fill="#252e40" />
        <rect x="38" y="31.8" width="16" height="5.8" fill="#d9a12b" />
        <rect x="56" y="31.8" width="12" height="5.8" fill="#f5cb57" />
        <rect x="56" y="31.8" width="12" height="1.1" fill="#fff0be" opacity=".85" />
        <rect x="70" y="31.8" width="14" height="5.8" fill="#273144" />
        <rect x="86" y="31.8" width="18" height="5.8" fill="#c99124" />

        {/* Fine architectural vertical mullions across upper floors */}
        <path
          d="M32 15v23M47 15v23M61 15v23M76 15v23M92 15v23M104 15v23"
          stroke="#151922"
          strokeWidth=".8"
          opacity=".85"
        />

        {/* Floor slab spandrels */}
        <rect x="24" y="21.4" width="84" height="1.8" fill="#141821" />
        <rect x="24" y="29.6" width="84" height="1.8" fill="#141821" />
        <rect x="24" y="38" width="84" height="2.4" fill="#12161f" />
        <rect x="24" y="40.1" width="84" height=".6" fill="#f5c94d" opacity=".45" />

        {/* Double-height ground lobby & colonnade */}
        <rect x="27" y="40.7" width="81" height="12.3" fill="url(#e7-lobby-l)" />
        {/* Interior atrium diagonal steel bracing */}
        <path d="M35 53L46 41M46 53L35 41M69 53L80 41" stroke="#3c2b0e" strokeWidth=".9" opacity=".35" />
        {/* Ground colonnade columns */}
        <path
          d="M27 40.4v12.6M41 40.4v12.6M55 40.4v12.6M69 40.4v12.6M83 40.4v12.6M97 40.4v12.6"
          stroke="#161a23"
          strokeWidth="1.6"
        />

        {/* Plaza ground line & warm pavement bounce */}
        <rect x="0" y="53" width="108" height="7" fill="#10131a" />
        <rect x="26" y="53" width="82" height="5.5" fill="url(#e7-reflect-l)" />
        <line x1="0" y1="53" x2="108" y2="53" stroke="#2d3442" strokeWidth=".7" />
      </Flank>

      <Flank side="r" width={108}>
        <defs>
          <linearGradient id="e7-robohub" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b57b18" />
            <stop offset=".45" stopColor="#eab63c" />
            <stop offset="1" stopColor="#ffdf82" />
          </linearGradient>
          <linearGradient id="e7-reflect-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0be3b" stopOpacity=".28" />
            <stop offset="1" stopColor="#f0be3b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Stepped rooftop mechanical screen */}
        <rect x="10" y="7" width="58" height="4" fill="#1b212e" />
        <rect x="10" y="7" width="58" height=".7" fill="#47546b" />
        <path d="M18 8.7h10M34 8.7h10M50 8.7h10" stroke="#2d374a" strokeWidth=".8" />

        {/* Iconic E7 cantilevered upper volume (overhangs right plaza) */}
        <rect x="0" y="11" width="96" height="23.5" fill="#202633" />
        <rect x="0" y="11" width="96" height=".9" fill="#505d75" />

        {/* Cantilever upper floor windows (y=13.5..20) */}
        <rect x="4" y="13.8" width="14" height="6" fill="#e6b036" />
        <rect x="20" y="13.8" width="12" height="6" fill="#252f42" />
        <rect x="34" y="13.8" width="18" height="6" fill="#f3c64e" />
        <rect x="34" y="13.8" width="18" height="1.1" fill="#ffebb0" opacity=".8" />
        <rect x="54" y="13.8" width="14" height="6" fill="#283347" />
        <rect x="70" y="13.8" width="22" height="6" fill="#dfa830" />
        <rect x="70" y="13.8" width="22" height="1.1" fill="#ffe59b" opacity=".75" />

        {/* Cantilever lower floor windows (y=22.4..29) */}
        <rect x="4" y="22.4" width="10" height="6.4" fill="#242e40" />
        <rect x="16" y="22.4" width="16" height="6.4" fill="#cf9524" />
        <rect x="34" y="22.4" width="12" height="6.4" fill="#263042" />
        <rect x="48" y="22.4" width="20" height="6.4" fill="#f5cb57" />
        <rect x="48" y="22.4" width="20" height="1.1" fill="#fff0be" opacity=".85" />
        <rect x="70" y="22.4" width="10" height="6.4" fill="#232c3d" />
        <rect x="82" y="22.4" width="10" height="6.4" fill="#eab73d" />

        {/* E7 vertical architectural louvers / fins on cantilever */}
        <path
          d="M11 13v17M26 13v17M42 13v17M58 13v17M76 13v17M87 13v17"
          stroke="#151922"
          strokeWidth=".9"
        />
        <rect x="0" y="20.2" width="96" height="1.9" fill="#141821" />

        {/* Cantilever soffit slab & warm under-lighting */}
        <rect x="0" y="30" width="96" height="4.5" fill="#131720" />
        <rect x="72" y="34" width="24" height="1.1" fill="#f7cf5c" opacity=".85" />
        <rect x="72" y="35.1" width="24" height="4.2" fill="url(#e7-reflect-r)" />

        {/* Recessed RoboHub double-height glazed atrium under cantilever */}
        <rect x="0" y="34.5" width="72" height="18.5" fill="url(#e7-robohub)" />
        {/* RoboHub internal steel X-bracing & gantry beam */}
        <line x1="0" y1="39.5" x2="72" y2="39.5" stroke="#3f2d0f" strokeWidth="1" opacity=".4" />
        <path
          d="M8 53L24 35M24 53L8 35M40 53L56 35M56 53L40 35"
          stroke="#3c2a0d"
          strokeWidth="1"
          opacity=".35"
        />
        <path
          d="M14 34.5v18.5M29 34.5v18.5M44 34.5v18.5M59 34.5v18.5M72 34.5v18.5"
          stroke="#161a23"
          strokeWidth="1.6"
        />

        {/* Open plaza colonnade under the cantilevered overhang */}
        <rect x="88" y="34.5" width="3.2" height="18.5" fill="#2a3242" />
        <rect x="88" y="34.5" width="1" height="18.5" fill="#63728f" opacity=".8" />

        {/* Plaza steps & warm bollard accent */}
        <rect x="97" y="48.5" width="1.6" height="4.5" fill="#2c3342" />
        <rect x="97" y="48.5" width="1.6" height="1.2" fill="#f5c94d" />

        {/* Plaza pavement & warm reflection */}
        <rect x="0" y="53" width="108" height="7" fill="#10131a" />
        <rect x="0" y="53" width="74" height="5.5" fill="url(#e7-reflect-r)" />
        <line x1="0" y1="53" x2="108" y2="53" stroke="#2d3442" strokeWidth=".7" />
      </Flank>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ about */

const SKYLINE =
  'M0 57H8L9.6 50H12.4L13 57ZM13 57L14.4 28L11.4 27L12.6 23H14.6L15 6L15.4 23H17.4L18.6 27L15.6 28L17 57H26V50H32V46H38V52H46V48H52V44H60V50H68V53H76V47H82V51H90V54H100V49H108V45H116V50H124V54H134V48H140V52H150V46H156V50H164V54H174V49H182V45H190V50H198V53H206V48H214V52H224V55H240'

function AboutSurface() {
  return (
    <>
      <i className="ab-light" />
      <svg className="ab-skyline" viewBox="0 0 240 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <path d={SKYLINE} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ systems */

const VENT_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const RJ45_PINS = [4.5, 6.7, 8.9, 11.1, 13.3, 15.5]

function RackSurface() {
  return (
    <>
      <i className="rk-grain" />
      <i className="rk-rails" />
      <Flank side="l" width={100}>
        {/* Left EIA-310 rack mount ear */}
        <rect x="0" y="3" width="13" height="54" fill="#1b1e23" />
        <line x1="13" y1="3" x2="13" y2="57" stroke="#0c0e11" strokeWidth="1.2" />
        <line x1="14" y1="3" x2="14" y2="57" stroke="#424852" strokeWidth=".6" />
        {/* Top & bottom rack cage-nut mounting slots */}
        <rect x="3.5" y="10" width="6" height="6" rx="3" fill="#090a0d" stroke="#3b414b" strokeWidth=".7" />
        <rect x="3.5" y="44" width="6" height="6" rx="3" fill="#090a0d" stroke="#3b414b" strokeWidth=".7" />
        {/* Captive knurled thumbscrew */}
        <circle cx="6.5" cy="30" r="3.2" fill="#2c313a" stroke="#535a66" strokeWidth=".7" />
        <circle cx="6.5" cy="30" r="1.9" fill="#191c22" />
        <path d="M5.2 30h2.6M6.5 28.7v2.6" stroke="#626a77" strokeWidth=".65" strokeLinecap="round" />

        {/* Two stacked 2.5" SFF hot-swap NVMe drive caddies (exact y=10..28 and y=32..50) */}
        {[10, 32].map((y, idx) => (
          <g key={idx}>
            <rect x="18" y={y} width="76" height="18" rx="1.6" fill="#101216" stroke="#4d5563" strokeWidth=".8" />
            {/* Top inner metallic sheen */}
            <line x1="19" y1={y + 0.9} x2="93" y2={y + 0.9} stroke="#ffffff" strokeWidth=".5" opacity=".16" />
            {/* Mechanical release latch */}
            <rect x="19.5" y={y + 2} width="6.5" height="14" rx="1" fill="#282d37" stroke="#535b6a" strokeWidth=".65" />
            <rect x="20.7" y={y + 4} width="1.5" height="10" rx=".5" fill="#4fe0c0" opacity=".9" />
            <circle cx="24.2" cy={y + 9} r=".8" fill="#0c0e11" />

            {/* Precision 2x11 cooling micro-perforation array */}
            {VENT_COLS.map((c) => (
              <g key={c}>
                <rect x={29 + c * 4.4} y={y + 3.8} width="2.4" height="4.2" rx=".6" fill="#07080a" stroke="#2d323b" strokeWidth=".4" />
                <rect x={29 + c * 4.4} y={y + 10} width="2.4" height="4.2" rx=".6" fill="#07080a" stroke="#2d323b" strokeWidth=".4" />
              </g>
            ))}

            {/* Aligned carrier status LEDs */}
            <rect x="80" y={y + 2.5} width="11.5" height="13" rx="1" fill="#181c23" stroke="#39404b" strokeWidth=".55" />
            <circle cx="85.75" cy={y + 6.4} r="1.3" fill="#090a0d" />
            <circle className={`nic nic-teal nic-${idx}`} cx="85.75" cy={y + 6.4} r=".95" fill="#2ee6c0" />
            <circle cx="85.75" cy={y + 11.6} r="1.3" fill="#090a0d" />
            <circle className={`nic nic-amber nic-${idx}`} cx="85.75" cy={y + 11.6} r=".95" fill="#ffb020" />
          </g>
        ))}
      </Flank>

      <Flank side="r" width={100}>
        {/* Dual enterprise RJ45 NIC cage (exact y=10..50 matching left drive bays) */}
        <rect x="6" y="10" width="52" height="40" rx="1.6" fill="#14171d" stroke="#5a6373" strokeWidth=".85" />
        <line x1="32" y1="10.5" x2="32" y2="49.5" stroke="#454c58" strokeWidth=".85" />

        {[0, 1].map((p) => (
          <g key={p} transform={`translate(${9 + p * 26} 13)`}>
            {/* Port metallic EMI shield bezel */}
            <rect x="0" y="0" width="20" height="34" rx="1.2" fill="#20252e" stroke="#4d5564" strokeWidth=".7" />
            {/* Integrated upper-corner SMD link/activity light pipes */}
            <rect x="2" y="2" width="4.4" height="2.4" rx=".5" fill="#090a0d" />
            <rect className={`nic nic-teal nic-${p}`} x="2.4" y="2.4" width="3.6" height="1.6" rx=".3" fill="#2ee6c0" />
            <rect x="13.6" y="2" width="4.4" height="2.4" rx=".5" fill="#090a0d" />
            <rect className={`nic nic-amber nic-${p}`} x="14" y="2.4" width="3.6" height="1.6" rx=".3" fill="#ffb020" />

            {/* Authentic stepped T-keyway RJ45 cavity */}
            <path
              d="M2.2 7.5 H17.8 V22.5 H14.4 V25.5 H12.4 V28.2 H7.6 V25.5 H5.6 V22.5 H2.2 Z"
              fill="#07080a"
              stroke="#454c59"
              strokeWidth=".65"
            />
            {/* Aligned gold contact pins */}
            {RJ45_PINS.map((px) => (
              <line key={px} x1={px} y1="8.2" x2={px} y2="14" stroke="#e2bb62" strokeWidth=".95" strokeLinecap="round" opacity=".95" />
            ))}
          </g>
        ))}

        {/* System power & telemetry control strip (exact y=10..50) */}
        <rect x="62" y="10" width="20" height="40" rx="1.6" fill="#121419" stroke="#3b414b" strokeWidth=".75" />
        {/* Recessed IEC power button */}
        <circle cx="72" cy="20" r="4.5" fill="#1d2128" stroke="#454c58" strokeWidth=".7" />
        <path d="M69.8 18.4a2.8 2.8 0 1 0 4.4 0" fill="none" stroke="#4fe0c0" strokeWidth=".95" strokeLinecap="round" />
        <line x1="72" y1="16.8" x2="72" y2="19.8" stroke="#4fe0c0" strokeWidth=".95" strokeLinecap="round" />

        {/* Aligned horizontal telemetry LED bars */}
        <rect x="66.5" y="29.5" width="11" height="2" rx=".6" fill="#2ee6c0" opacity=".88" />
        <rect x="66.5" y="34.5" width="11" height="2" rx=".6" fill="#3a404a" />
        <rect className="nic nic-amber nic-1" x="66.5" y="39.5" width="11" height="2" rx=".6" fill="#ffb020" />
        {/* Recessed pinhole reset */}
        <circle cx="72" cy="45.8" r="1" fill="#07080a" stroke="#3c424c" strokeWidth=".5" />

        {/* Right EIA-310 rack mount ear (exact mirror of left) */}
        <rect x="87" y="3" width="13" height="54" fill="#1b1e23" />
        <line x1="87" y1="3" x2="87" y2="57" stroke="#0c0e11" strokeWidth="1.2" />
        <line x1="86" y1="3" x2="86" y2="57" stroke="#424852" strokeWidth=".6" />
        <rect x="90.5" y="10" width="6" height="6" rx="3" fill="#090a0d" stroke="#3b414b" strokeWidth=".7" />
        <rect x="90.5" y="44" width="6" height="6" rx="3" fill="#090a0d" stroke="#3b414b" strokeWidth=".7" />
        <circle cx="93.5" cy="30" r="3.2" fill="#2c313a" stroke="#535a66" strokeWidth=".7" />
        <circle cx="93.5" cy="30" r="1.9" fill="#191c22" />
        <path d="M92.2 30h2.6M93.5 28.7v2.6" stroke="#626a77" strokeWidth=".65" strokeLinecap="round" />
      </Flank>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ watcloud */

function CloudBand({ layer }: { layer: 'far' | 'mid' | 'near' }) {
  if (layer === 'far') {
    return (
      <svg viewBox="0 0 380 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g fill="#e0f2fe" opacity="0.58">
          <path d="M10 13c6-2.5 18-3 28-1 5 1 12 .5 17 2.2-10 .8-32 1.2-45-1.2z" />
          <path d="M98 18c0-2.6 2.5-4.8 5.6-4.8 2 0 3.8 1 4.8 2.5 1-.5 2.2-.8 3.4-.8 3.2 0 5.6 2.2 5.6 4.8H98v-1.7z" />
          <path d="M164 10c9-2.2 26-2.4 39-.4 4 .6 9 .4 13 1.6-14 .8-39 .9-52-1.2z" />
          <path d="M254 21c0-3.2 3-5.8 6.8-5.8 2.4 0 4.5 1.1 5.7 2.8 1.4-1.4 3.5-2.2 5.8-2.2 4.1 0 7.4 2.9 7.4 6.5H254v-1.3z" />
          <path d="M324 14c7-2 19-2.4 29-.8 5 .8 10 .5 15 1.8-12 .6-33 .8-44-1z" />
        </g>
      </svg>
    )
  }
  if (layer === 'mid') {
    return (
      <svg viewBox="0 0 380 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g fill="#f0f9ff" opacity="0.82">
          <path d="M18 33c0-3.4 3-6.2 6.8-6.2 1.8 0 3.4.7 4.6 1.8 1.4-2.8 4.4-4.7 7.9-4.7 4.4 0 8 3 8.6 7 2.5.4 4.4 2.3 4.4 4.6H18v-2.5z" />
          <path d="M126 26c0-2.5 2.2-4.6 5-4.6 1.5 0 2.9.6 3.9 1.6 1.1-1.3 2.8-2.1 4.7-2.1 3.4 0 6.1 2.4 6.1 5.4H126v-.3z" />
          <path d="M206 37c0-4.2 3.8-7.6 8.6-7.6 2.2 0 4.2.8 5.8 2.1 1.7-3.4 5.4-5.7 9.7-5.7 5.6 0 10.2 4 10.6 9.1 3 .4 5.3 2.7 5.3 5.5H206v-3.4z" />
          <path d="M312 29c0-3 2.8-5.4 6.2-5.4 1.9 0 3.6.8 4.8 2.1 1.3-1.8 3.5-3 6-3 4.1 0 7.4 3 7.4 6.7H312v-.4z" />
        </g>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 380 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g fill="#ffffff" opacity="0.93">
        <path d="M16 50c0-5.4 4.8-9.8 10.8-9.8 2.6 0 5 .9 6.9 2.4 1.9-4.1 6.2-6.9 11.2-6.9 6.4 0 11.6 4.6 12.1 10.4 3.4.5 6 3.1 6 6.3H16V50z" />
        <path d="M122 45c0-3.2 2.9-5.8 6.5-5.8 1.8 0 3.4.7 4.6 1.9 1.1-1.6 3-2.6 5.2-2.6 3.6 0 6.5 2.7 6.5 6 0 .4-.1.8-.1 1.2H122v-.7z" />
        <path d="M192 54c0-6.2 5.6-11.2 12.6-11.2 3.1 0 6 1.1 8.2 3 2.2-4.8 7.2-8.1 13-8.1 7.4 0 13.4 5.4 13.9 12.1 4 .6 7.1 3.7 7.1 7.5H192V54z" />
        <path d="M308 47c0-4 3.6-7.2 8.2-7.2 2.2 0 4.2.9 5.7 2.3 1.4-2.4 4.1-4 7.2-4 4.8 0 8.6 3.5 8.6 7.9 2.4.5 4.2 2.3 4.2 4.5H308V47z" />
      </g>
      <g fill="#bae6fd" opacity="0.52">
        <rect x="20" y="50.4" width="40" height="2" rx="1" />
        <rect x="125" y="44.2" width="18" height="1.5" rx=".75" />
        <rect x="198" y="55" width="54" height="2.2" rx="1.1" />
        <rect x="312" y="48.8" width="28" height="1.7" rx=".85" />
      </g>
    </svg>
  )
}

function WatcloudSurface() {
  return (
    <>
      <i className="wc-sky" />
      <span className="wc-cloud-track wc-far">
        <CloudBand layer="far" />
        <CloudBand layer="far" />
      </span>
      <span className="wc-cloud-track wc-mid">
        <CloudBand layer="mid" />
        <CloudBand layer="mid" />
      </span>
      <span className="wc-cloud-track wc-near">
        <CloudBand layer="near" />
        <CloudBand layer="near" />
      </span>
      <i className="sf-scrim" />
    </>
  )
}

/* ------------------------------------------------------------------ hacktheridge */

function HackTheRidgeSurface() {
  return (
    <>
      <i className="htr-sky" />
      <svg className="htr-stars" viewBox="0 0 220 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <circle className="htr-twinkle-a" cx="32" cy="8" r="1.2" fill="#d4ead9" />
        <circle className="htr-twinkle-b" cx="76" cy="6" r="1" fill="#a8d5ba" />
        <circle className="htr-twinkle-a" cx="144" cy="9" r="1.3" fill="#e4f7ec" />
        <circle className="htr-twinkle-b" cx="188" cy="7" r="1.1" fill="#a8d5ba" />
      </svg>
      <Flank side="l" width={92}>
        <rect x="2" y="10" width="16" height="44" fill="#10181b" stroke="#223539" strokeWidth=".6" />
        <g fill="#b7e0c6">
          <rect x="4.5" y="14" width="6" height="1.5" />
          <rect x="4.5" y="18" width="9" height="1.5" />
          <rect className="htr-win-flk" x="4.5" y="22" width="5" height="1.5" />
          <rect x="4.5" y="26" width="8" height="1.5" />
          <rect x="4.5" y="30" width="7" height="1.5" />
        </g>
        <rect x="21" y="16" width="15" height="38" fill="#172428" stroke="#293f44" strokeWidth=".6" />
        <g fill="#d4ead9" opacity=".85">
          <rect x="23.5" y="20" width="8" height="1.4" />
          <rect x="23.5" y="24" width="6" height="1.4" />
          <rect x="23.5" y="28" width="9" height="1.4" />
          <rect x="23.5" y="32" width="5" height="1.4" />
        </g>
        <rect x="39" y="19" width="12" height="35" fill="#132024" stroke="#263b40" strokeWidth=".6" />
        <line x1="42" y1="21" x2="42" y2="48" stroke="#a8d5ba" strokeWidth=".7" opacity=".45" />
        <line x1="45" y1="21" x2="45" y2="48" stroke="#a8d5ba" strokeWidth=".7" opacity=".45" />
        <line x1="48" y1="21" x2="48" y2="48" stroke="#a8d5ba" strokeWidth=".7" opacity=".45" />
        <polygon points="0,47 34,47 40,56 0,56" fill="#1b2b2e" stroke="#39575b" strokeWidth=".7" />
        <polygon points="4,49 28,49 32,54.5 4,54.5" fill="#1d4046" stroke="#7db49d" strokeWidth=".6" />
        <line x1="16" y1="49" x2="18" y2="54.5" stroke="#7db49d" strokeWidth=".5" />
        <line x1="4" y1="51.7" x2="30" y2="51.7" stroke="#7db49d" strokeWidth=".5" />
        <rect x="0" y="55" width="92" height="5" fill="#0d1618" />
      </Flank>
      <Flank side="r" width={92}>
        <rect x="41" y="18" width="13" height="36" fill="#132024" stroke="#263b40" strokeWidth=".6" />
        <g fill="#b7e0c6" opacity=".8">
          <rect x="44" y="22" width="7" height="1.4" />
          <rect x="44" y="26" width="5" height="1.4" />
          <rect x="44" y="30" width="8" height="1.4" />
        </g>
        <rect x="57" y="13" width="14" height="41" fill="#172428" stroke="#293f44" strokeWidth=".6" />
        <line x1="60.5" y1="16" x2="60.5" y2="46" stroke="#c8f3d8" strokeWidth=".8" opacity=".5" />
        <line x1="64" y1="16" x2="64" y2="46" stroke="#c8f3d8" strokeWidth=".8" opacity=".5" />
        <line x1="67.5" y1="16" x2="67.5" y2="46" stroke="#c8f3d8" strokeWidth=".8" opacity=".5" />
        <rect x="74" y="9" width="16" height="45" fill="#10181b" stroke="#223539" strokeWidth=".6" />
        <g fill="#d4ead9">
          <rect x="77" y="13" width="9" height="1.5" />
          <rect className="htr-win-flk" x="77" y="17" width="6" height="1.5" />
          <rect x="77" y="21" width="10" height="1.5" />
          <rect x="77" y="25" width="7" height="1.5" />
          <rect x="77" y="29" width="9" height="1.5" />
        </g>
        <polygon points="58,47 92,47 92,56 52,56" fill="#1b2b2e" stroke="#39575b" strokeWidth=".7" />
        <polygon points="62,49 88,49 88,54.5 58,54.5" fill="#1d4046" stroke="#7db49d" strokeWidth=".6" />
        <line x1="74" y1="49" x2="72" y2="54.5" stroke="#7db49d" strokeWidth=".5" />
        <line x1="60" y1="51.7" x2="88" y2="51.7" stroke="#7db49d" strokeWidth=".5" />
        <rect x="0" y="55" width="92" height="5" fill="#0d1618" />
      </Flank>
      <span className="htr-viaduct-layer">
        <svg className="htr-viaduct-svg" viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="0" y="5" width="220" height="3.2" fill="#23363b" stroke="#46686c" strokeWidth=".6" />
          <g fill="#19282c">
            <rect x="20" y="8" width="4" height="4" />
            <rect x="64" y="8" width="4" height="4" />
            <rect x="110" y="8" width="4" height="4" />
            <rect x="156" y="8" width="4" height="4" />
            <rect x="198" y="8" width="4" height="4" />
          </g>
        </svg>
        <svg className="htr-train" viewBox="0 0 70 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="2" y="1" width="66" height="4.5" rx="2" fill="#3a595c" stroke="#a8d5ba" strokeWidth=".6" />
          <g fill="#d7fae3">
            <rect x="7" y="2.2" width="8" height="1.9" rx=".5" />
            <rect x="18" y="2.2" width="8" height="1.9" rx=".5" />
            <rect x="29" y="2.2" width="8" height="1.9" rx=".5" />
            <rect x="40" y="2.2" width="8" height="1.9" rx=".5" />
            <rect x="51" y="2.2" width="11" height="1.9" rx=".5" />
          </g>
        </svg>
      </span>
      <i className="sf-scrim" />
    </>
  )
}

const SURFACES: Record<BlockId, () => ReactNode> = {
  about: AboutSurface,
  waterloo: WaterlooSurface,
  compeng: BreadboardSurface,
  watcloud: WatcloudSurface,
  hacktheridge: HackTheRidgeSurface,
  systems: RackSurface,
  ml: NeuralSurface,
  electronics: PcbSurface,
  projects: ProjectsSurface,
  minecraft: MinecraftSurface,
  photography: HorizonSurface,
}

export function Surface({ id }: { id: BlockId }) {
  const Art = SURFACES[id]
  return (
    <span className={`tb-surface sf sf-${id}`} aria-hidden="true">
      <Art />
    </span>
  )
}
