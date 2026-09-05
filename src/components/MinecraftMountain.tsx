import { type FC } from 'react'

const BLOCK_SIZE = 18

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

  // Build mountain blocks
  const mountainBlocks: { x: number; y: number; tone: string }[] = []

  COLUMN_HEIGHTS.forEach((height, col) => {
    const caveAirBlocks = CAVE_AIR_COLS[col] || 0

    for (let level = 0; level < height; level++) {
      // If inside cave air space, skip creating stone block (lava shows beneath)
      if (level < caveAirBlocks) {
        continue
      }

      mountainBlocks.push({
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
          {mountainBlocks.map((block) => (
            <rect
              key={`mountain-${block.x}-${block.y}`}
              className={`minecraft-mountain-block minecraft-mountain-${block.tone}`}
              x={block.x}
              y={block.y}
              width={BLOCK_SIZE}
              height={BLOCK_SIZE}
            />
          ))}
        </g>

        {/* 4. Mountain Peak Flowers */}
        <g className="minecraft-mountain-flowers" aria-hidden="true">
          {FLOWERS.map((flower) => {
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
      </svg>
    </div>
  )
}
