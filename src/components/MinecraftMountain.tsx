import { type FC, useEffect, useRef, useState } from 'react'
import { discover } from '../hooks/secrets'

const BLOCK_SIZE = 18
const BREAK_MS = 170
const REGROW_MS = 9000
// An ordinary-looking stone block (column-level) with something behind it.
const DIAMOND_BLOCK = '8-5'

interface Drop {
  id: number
  x: number
  y: number
  tone: string
  label?: string
}

const toggled = (set: ReadonlySet<string>, key: string, on: boolean) => {
  const next = new Set(set)
  if (on) next.add(key)
  else next.delete(key)
  return next
}

// Heights for each column from left to right (22 columns total)
const COLUMN_HEIGHTS = [
  1, 2, 3, 4, 6, 7, 9, 10, 9, 8, 7, 8, 7, 6, 4, 3, 2, 1, 1, 1, 1, 1,
]

// Cave arch cutout (empty space above the lava lake)
// columns 6 to 11 have an opening of 2-3 blocks high
const CAVE_AIR_COLS: Record<number, number> = {
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 3,
  11: 2,
}

// Lava blocks at the bottom level (level 0: y = 198, and level -1: y = 216)
const LAVA_BLOCKS = [
  // Bottom trench row (y = 216)
  { col: 4, row: 12, tone: 'obsidian' },
  { col: 5, row: 12, tone: 'lava-dark' },
  { col: 6, row: 12, tone: 'lava-orange' },
  { col: 7, row: 12, tone: 'lava-bright' },
  { col: 8, row: 12, tone: 'lava-orange' },
  { col: 9, row: 12, tone: 'lava-bright' },
  { col: 10, row: 12, tone: 'lava-orange' },
  { col: 11, row: 12, tone: 'lava-dark' },
  { col: 12, row: 12, tone: 'lava-red' },
  { col: 13, row: 12, tone: 'obsidian' },

  // Lava pool surface inside cave (y = 198)
  { col: 5, row: 11, tone: 'obsidian' },
  { col: 6, row: 11, tone: 'lava-red' },
  { col: 7, row: 11, tone: 'lava-bright' },
  { col: 8, row: 11, tone: 'lava-orange' },
  { col: 9, row: 11, tone: 'lava-bright' },
  { col: 10, row: 11, tone: 'lava-orange' },
  { col: 11, row: 11, tone: 'lava-red' },
  { col: 12, row: 11, tone: 'obsidian' },
]

// Animated lava ember pixel sparks
const LAVA_EMBERS = [
  { x: 135, y: 194, size: 3, delay: '0s', dur: '2.4s', color: 'ember-bright' },
  { x: 152, y: 196, size: 2, delay: '0.8s', dur: '2.8s', color: 'ember-orange' },
  { x: 170, y: 193, size: 3, delay: '1.4s', dur: '2.2s', color: 'ember-bright' },
  { x: 188, y: 195, size: 2, delay: '0.4s', dur: '2.6s', color: 'ember-red' },
  { x: 204, y: 194, size: 3, delay: '1.8s', dur: '2.5s', color: 'ember-orange' },
]

// Wild flowers on grass slopes
const FLOWERS = [
  { col: 2, color: 'yellow', offset: 5 },
  { col: 4, color: 'red', offset: 10 },
  { col: 14, color: 'white', offset: 6 },
  { col: 17, color: 'yellow', offset: 8 },
  { col: 19, color: 'red', offset: 4 },
]

function getBlockTone(column: number, level: number, height: number): string {
  const depthFromTop = height - level - 1

  // Snow on high peaks (height >= 8 and top 2 levels)
  if (height >= 8 && depthFromTop === 0 && level >= 7) return 'snow'
  if (height >= 8 && depthFromTop === 1 && level >= 7) {
    return (column + level) % 2 === 0 ? 'snow-shadow' : 'snow'
  }

  // Grass on exposed top layer
  if (depthFromTop === 0) return 'grass-top'

  // Dirt under grass
  if (depthFromTop === 1) return column % 3 === 0 ? 'dirt-dark' : 'dirt'
  if (depthFromTop === 2 && (column + level) % 2 === 0) return 'dirt'

  // Mineral ores in the mountain interior
  if (level >= 3 && level <= 6 && (column * 7 + level * 13) % 17 === 0) return 'coal-ore'
  if (level >= 1 && level <= 4 && (column * 11 + level * 5) % 19 === 0) return 'iron-ore'

  // Stone variations
  if ((column + level) % 5 === 0) return 'stone-light'
  if ((column + level) % 4 === 0) return 'stone-dark'
  return 'stone'
}

export const MinecraftMountain: FC<{ className?: string }> = ({ className = '' }) => {
  const GROUND_Y = 198 // row 11

  const [gone, setGone] = useState<ReadonlySet<string>>(new Set())
  const [breaking, setBreaking] = useState<ReadonlySet<string>>(new Set())
  const [regrown, setRegrown] = useState<ReadonlySet<string>>(new Set())
  const [diamondShown, setDiamondShown] = useState(false)
  const [drops, setDrops] = useState<Drop[]>([])
  const timers = useRef<number[]>([])
  const dropId = useRef(0)

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // Click a block to break it. It grows back after a few seconds, so the mountain always heals.
  const mine = (key: string, tone: string, x: number, y: number) => {
    if (breaking.has(key) || gone.has(key)) return
    discover('miner')
    const id = ++dropId.current
    const isDiamond = tone === 'diamond-ore'
    setDrops((list) => [...list, { id, x, y, tone, label: isDiamond ? 'DIAMONDS!' : undefined }])
    later(() => setDrops((list) => list.filter((drop) => drop.id !== id)), isDiamond ? 1500 : 520)

    if (key === DIAMOND_BLOCK && !diamondShown) {
      // The stone face comes away and the ore behind it shows.
      setDiamondShown(true)
      return
    }
    if (isDiamond) discover('diamonds')
    setRegrown((set) => toggled(set, key, false))
    setBreaking((set) => toggled(set, key, true))
    later(() => {
      setBreaking((set) => toggled(set, key, false))
      setGone((set) => toggled(set, key, true))
    }, BREAK_MS)
    later(() => {
      setGone((set) => toggled(set, key, false))
      setRegrown((set) => toggled(set, key, true))
      if (key === DIAMOND_BLOCK) setDiamondShown(false)
    }, REGROW_MS)
  }

  // Build mountain blocks
  const mountainBlocks: { key: string; x: number; y: number; tone: string }[] = []

  COLUMN_HEIGHTS.forEach((height, col) => {
    const caveAirBlocks = CAVE_AIR_COLS[col] || 0

    for (let level = 0; level < height; level++) {
      // If inside cave air space, skip creating stone block (lava shows beneath)
      if (level < caveAirBlocks) {
        continue
      }

      mountainBlocks.push({
        key: `${col}-${level}`,
        x: col * BLOCK_SIZE,
        y: GROUND_Y - (level + 1) * BLOCK_SIZE,
        tone: getBlockTone(col, level, height),
      })
    }
  })

  // Ground base foundation blocks (outside lava pool)
  const baseFoundationBlocks: { x: number; y: number; tone: string }[] = []
  for (let col = 0; col < COLUMN_HEIGHTS.length; col++) {
    // Left shore base
    if (col < 5) {
      baseFoundationBlocks.push({ x: col * BLOCK_SIZE, y: 198, tone: col === 0 ? 'grass-top' : 'dirt' })
      baseFoundationBlocks.push({ x: col * BLOCK_SIZE, y: 216, tone: col % 2 === 0 ? 'stone-dark' : 'dirt-dark' })
    }
    // Right shore base
    if (col > 12) {
      baseFoundationBlocks.push({ x: col * BLOCK_SIZE, y: 198, tone: col > 15 ? 'grass-top' : 'dirt' })
      baseFoundationBlocks.push({ x: col * BLOCK_SIZE, y: 216, tone: col % 2 === 0 ? 'stone' : 'dirt-dark' })
    }
  }

  return (
    <div
      className={`minecraft-mountain-frame ${className}`}
      role="img"
      aria-label="Pixel-art Minecraft mountain with snow peaks, stone cliffs, and a lava pool"
    >
      <svg
        className="minecraft-mountain-svg"
        viewBox="0 0 396 234"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        {/* 1. Base Foundation Blocks */}
        <g className="minecraft-mountain-base-blocks">
          {baseFoundationBlocks.map((block) => (
            <rect
              key={`base-${block.x}-${block.y}`}
              className={`minecraft-mountain-block minecraft-mountain-${block.tone}`}
              x={block.x}
              y={block.y}
              width={BLOCK_SIZE}
              height={BLOCK_SIZE}
            />
          ))}
        </g>

        {/* 2. Glowing Solid Pixel Lava Blocks */}
        <g className="minecraft-mountain-lava-lake">
          {LAVA_BLOCKS.map((block) => (
            <rect
              key={`lava-${block.col}-${block.row}`}
              className={`minecraft-mountain-block minecraft-mountain-${block.tone}`}
              x={block.col * BLOCK_SIZE}
              y={block.row * BLOCK_SIZE}
              width={BLOCK_SIZE}
              height={BLOCK_SIZE}
            />
          ))}
        </g>

        {/* 3. Mountain Terrain Blocks */}
        <g className="minecraft-mountain-terrain-blocks">
          {mountainBlocks.map((block) => {
            if (gone.has(block.key)) return null
            const tone = block.key === DIAMOND_BLOCK && diamondShown ? 'diamond-ore' : block.tone
            return (
              <rect
                key={`mountain-${block.key}`}
                className={`minecraft-mountain-block minecraft-mountain-${tone} is-mineable${
                  breaking.has(block.key) ? ' is-breaking' : ''
                }${regrown.has(block.key) ? ' is-regrown' : ''}`}
                data-magnetic
                data-frame="pixel"
                x={block.x}
                y={block.y}
                width={BLOCK_SIZE}
                height={BLOCK_SIZE}
                onClick={() => mine(block.key, tone, block.x, block.y)}
              />
            )
          })}
          {!diamondShown && !gone.has(DIAMOND_BLOCK) && (
            <rect className="minecraft-mountain-glint" x={8 * BLOCK_SIZE + 11} y={GROUND_Y - 6 * BLOCK_SIZE + 4} width="2" height="2" />
          )}
        </g>

        {/* 4. Mountain Peak Flowers */}
        <g className="minecraft-mountain-flowers" aria-hidden="true">
          {FLOWERS.map((flower) => {
            // A flower pops when the block it stands on is mined.
            if (gone.has(`${flower.col}-${COLUMN_HEIGHTS[flower.col] - 1}`)) return null
            const x = flower.col * BLOCK_SIZE + flower.offset
            const topY = GROUND_Y - COLUMN_HEIGHTS[flower.col] * BLOCK_SIZE
            const y = topY - 12
            return (
              <g
                key={`flower-${flower.col}-${flower.color}`}
                className={`minecraft-flower minecraft-flower-${flower.color}`}
                transform={`translate(${x} ${y})`}
              >
                <rect className="minecraft-flower-stem" x="5" y="7" width="2" height="2" />
                <rect className="minecraft-flower-stem" x="5" y="9" width="2" height="2" />
                <rect className="minecraft-flower-stem" x="5" y="11" width="2" height="2" />
                <rect className="minecraft-flower-petal" x="4" y="1" width="4" height="4" />
                <rect className="minecraft-flower-petal" x="1" y="4" width="4" height="4" />
                <rect className="minecraft-flower-petal" x="7" y="4" width="4" height="4" />
                <rect className="minecraft-flower-center" x="5" y="5" width="2" height="2" />
              </g>
            )
          })}
        </g>

        {/* 5. Solid Pixel Lava Embers */}
        <g className="minecraft-mountain-embers" aria-hidden="true">
          {LAVA_EMBERS.map((ember, i) => (
            <rect
              key={`ember-${i}`}
              className={`minecraft-lava-ember ${ember.color}`}
              x={ember.x}
              y={ember.y}
              width={ember.size}
              height={ember.size}
              style={{
                animationDelay: ember.delay,
                animationDuration: ember.dur,
              }}
            />
          ))}
        </g>

        {/* 6. Debris from freshly mined blocks */}
        <g className="minecraft-mountain-drops" aria-hidden="true">
          {drops.map((drop) => (
            <g key={drop.id} transform={`translate(${drop.x + BLOCK_SIZE / 2} ${drop.y + BLOCK_SIZE / 2})`}>
              <rect className={`mine-bit mine-bit-a minecraft-mountain-${drop.tone}`} x="-4" y="-3" width="4" height="4" />
              <rect className={`mine-bit mine-bit-b minecraft-mountain-${drop.tone}`} x="1" y="-2" width="3" height="3" />
              <rect className={`mine-bit mine-bit-c minecraft-mountain-${drop.tone}`} x="-1" y="1" width="3" height="3" />
              {drop.label && (
                <text className="mine-chip" x="0" y="-14" textAnchor="middle">
                  {drop.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
