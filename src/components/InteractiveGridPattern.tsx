import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'

interface InteractiveGridPatternProps {
  sectionRef: RefObject<HTMLElement | null>
  width?: number
  height?: number
  className?: string
  squaresClassName?: string
}

interface Point {
  x: number
  y: number
}

interface FloatingMessage {
  id: number
  text: string
  x: number
  y: number
  key: string
}

const ACHIEVEMENTS = [
  'Hack the Ridge 22',
  'Hack the Ridge 23',
  'Hack the Ridge 24',
  'Hack the Ridge 25',
  'Hack the Ridge 26',
  'DECA Team Ontario 46',
  'DECA Team Ontario 47',
  'IRHSAI 24',
  'IRHSAI 25',
  'IRHSAI 26',
]

// Manhattan distance heuristic for A*
function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

// Flood fill count to find open space capacity
function countReachableSpace(
  start: Point,
  obstacles: Set<string>,
  cols: number,
  rows: number,
  maxCheck = 70
): number {
  const visited = new Set<string>()
  const queue: Point[] = [start]
  visited.add(`${start.x},${start.y}`)

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]

  let count = 0
  while (queue.length > 0 && count < maxCheck) {
    const cur = queue.shift()!
    count++

    for (const d of dirs) {
      const nx = cur.x + d.x
      const ny = cur.y + d.y
      const key = `${nx},${ny}`
      if (
        nx >= 0 &&
        nx < cols &&
        ny >= 0 &&
        ny < rows &&
        !obstacles.has(key) &&
        !visited.has(key)
      ) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
  }

  return count
}

interface AStarNode {
  x: number
  y: number
  g: number
  f: number
  parent: AStarNode | null
}

// Full A* Pathfinding with parent backtracking and flood-fill survival fallback
function findNextMoveAStar(
  head: Point,
  target: Point,
  body: Point[],
  cols: number,
  rows: number
): Point | null {
  if (target.x < 0 || target.x >= cols || target.y < 0 || target.y >= rows) {
    return null
  }

  // The snake tail will move out of the way on the next tick unless eating, so exclude tail from obstacles
  const bodyObstacles = new Set(body.slice(0, -1).map((p) => `${p.x},${p.y}`))

  const openList: AStarNode[] = [
    {
      x: head.x,
      y: head.y,
      g: 0,
      f: manhattan(head, target),
      parent: null,
    },
  ]

  const gScores = new Map<string, number>()
  gScores.set(`${head.x},${head.y}`, 0)

  const closedSet = new Set<string>()

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]

  let iterations = 0
  const MAX_ITERATIONS = 1800
  let targetNode: AStarNode | null = null

  while (openList.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++

    // Sort to pick node with lowest f score (Manhattan distance + steps)
    openList.sort((a, b) => a.f - b.f)
    const current = openList.shift()!
    const curKey = `${current.x},${current.y}`

    if (current.x === target.x && current.y === target.y) {
      targetNode = current
      break
    }

    closedSet.add(curKey)

    for (const d of dirs) {
      const nx = current.x + d.x
      const ny = current.y + d.y
      const nKey = `${nx},${ny}`

      if (
        nx < 0 ||
        nx >= cols ||
        ny < 0 ||
        ny >= rows ||
        bodyObstacles.has(nKey) ||
        closedSet.has(nKey)
      ) {
        continue
      }

      const tentativeG = current.g + 1
      const existingG = gScores.get(nKey)

      if (existingG === undefined || tentativeG < existingG) {
        gScores.set(nKey, tentativeG)
        const h = manhattan({ x: nx, y: ny }, target)
        const neighborNode: AStarNode = {
          x: nx,
          y: ny,
          g: tentativeG,
          f: tentativeG + h,
          parent: current,
        }
        openList.push(neighborNode)
      }
    }
  }

  // If path to target found, backtrack to the first step after head
  if (targetNode) {
    let curr: AStarNode = targetNode
    while (curr.parent && curr.parent.parent !== null) {
      curr = curr.parent
    }
    return { x: curr.x, y: curr.y }
  }

  // Fallback: If no direct path to apple is currently open,
  // pick the valid neighbor that has the most reachable open space (prevents trapping)
  const validNeighbors: Point[] = []
  for (const d of dirs) {
    const nx = head.x + d.x
    const ny = head.y + d.y
    const key = `${nx},${ny}`
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !bodyObstacles.has(key)) {
      validNeighbors.push({ x: nx, y: ny })
    }
  }

  if (validNeighbors.length === 0) {
    return null
  }

  let bestNeighbor = validNeighbors[0]
  let bestScore = -Infinity

  for (const neighbor of validNeighbors) {
    const space = countReachableSpace(neighbor, bodyObstacles, cols, rows, 60)
    const dist = manhattan(neighbor, target)
    const score = space * 10 - dist
    if (score > bestScore) {
      bestScore = score
      bestNeighbor = neighbor
    }
  }

  return bestNeighbor
}

export function InteractiveGridPattern({
  sectionRef,
  width = 40,
  height = 40,
  className = '',
  squaresClassName = '',
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 32,
    rows: 18,
  })

  // Recent hovered squares for interactive cursor hover
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null)
  const leaveTimerRef = useRef<number | null>(null)

  // Floating achievement messages when eating apples
  const [messages, setMessages] = useState<FloatingMessage[]>([])
  const achievementIdxRef = useRef(0)
  const messageIdCounterRef = useRef(0)

  // Autonomous Snake State
  const [snakeBody, setSnakeBody] = useState<Point[]>([
    { x: 14, y: 8 },
    { x: 13, y: 8 },
    { x: 12, y: 8 },
  ])
  const [apple, setApple] = useState<Point>({ x: 20, y: 8 })
  const [isFlashing, setIsFlashing] = useState(false)
  const isResettingRef = useRef(false)

  // Scroll tracking: Fades in when entering About Me, stays visible, fades out when leaving About Me
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Smooth opacity envelope based on scroll progress
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.84, 1],
    [0, 1, 1, 0]
  )

  // Measure container and window to compute exact grid dimensions
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width || window.innerWidth)
      const h = Math.floor(rect.height || 600)
      const cols = Math.max(8, Math.floor(w / width))
      const rows = Math.max(6, Math.floor(h / height))
      setDimensions((prev) => {
        if (prev.cols === cols && prev.rows === rows) return prev
        return { cols, rows }
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)

    return () => {
      window.removeEventListener('resize', updateSize)
      ro.disconnect()
    }
  }, [width, height])

  // Spawn apple strictly inside visible bounds (prioritizing right side on desktop)
  const spawnApple = useCallback((body: Point[], cols: number, rows: number): Point => {
    const bodySet = new Set(body.map((p) => `${p.x},${p.y}`))
    const safeCols = Math.max(cols, 6)
    const safeRows = Math.max(rows, 6)

    // On wider displays (desktop), favor the open space on the right (cols * 0.42 to cols - 3)
    const minCol = safeCols >= 18 ? Math.floor(safeCols * 0.42) : 2
    const maxCol = Math.max(minCol + 1, safeCols - 3)
    const minRow = 2
    const maxRow = Math.max(minRow + 1, safeRows - 2)

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * (maxCol - minCol + 1)) + minCol
      const y = Math.floor(Math.random() * (maxRow - minRow + 1)) + minRow
      if (!bodySet.has(`${x},${y}`) && x >= 2 && x <= maxCol && y >= 2 && y <= maxRow) {
        return { x, y }
      }
    }

    // Fallback: iterate and find any open coordinate within bounds
    for (let c = maxCol; c >= 2; c--) {
      for (let r = 2; r <= maxRow; r++) {
        if (!bodySet.has(`${c},${r}`) && c < cols - 2 && r < rows - 1) {
          return { x: c, y: r }
        }
      }
    }
    return { x: Math.min(cols - 3, 4), y: Math.min(rows - 2, 4) }
  }, [])

  // Ensure apple and snake stay inside valid bounds when dimensions update
  useEffect(() => {
    if (dimensions.cols > 4 && dimensions.rows > 4) {
      if (
        apple.x < 1 ||
        apple.x >= dimensions.cols - 1 ||
        apple.y < 1 ||
        apple.y >= dimensions.rows - 1
      ) {
        setApple(spawnApple(snakeBody, dimensions.cols, dimensions.rows))
      }
    }
  }, [dimensions, apple, snakeBody, spawnApple])

  // Autonomous Snake Game Loop
  useEffect(() => {
    if (shouldReduceMotion) return

    const tickInterval = 175 // Smooth, retro-arcade pace

    const interval = setInterval(() => {
      // Pause advancing if currently flashing/resetting
      if (isResettingRef.current) return

      setSnakeBody((curBody) => {
        if (curBody.length === 0 || isResettingRef.current) return curBody
        const head = curBody[0]
        const nextMove = findNextMoveAStar(head, apple, curBody, dimensions.cols, dimensions.rows)

        // When snake reaches length 20 or gets completely trapped:
        // Flash white 3 times (820ms), then reset at a random location
        if (!nextMove || curBody.length >= 20) {
          isResettingRef.current = true
          setIsFlashing(true)

          setTimeout(() => {
            const safeCols = Math.max(dimensions.cols, 8)
            const safeRows = Math.max(dimensions.rows, 8)

            // Pick a new random starting coordinate in open space
            const minX = safeCols >= 18 ? Math.floor(safeCols * 0.38) : 3
            const maxX = Math.max(minX + 2, safeCols - 4)
            const minY = 3
            const maxY = Math.max(minY + 2, safeRows - 3)

            const startX = Math.floor(Math.random() * (maxX - minX + 1)) + minX
            const startY = Math.floor(Math.random() * (maxY - minY + 1)) + minY

            const newBody = [
              { x: startX, y: startY },
              { x: startX - 1, y: startY },
              { x: startX - 2, y: startY },
            ]

            setSnakeBody(newBody)
            setApple(spawnApple(newBody, dimensions.cols, dimensions.rows))
            setIsFlashing(false)
            isResettingRef.current = false
          }, 820)

          return curBody // Keep current body intact during flash animation
        }

        // Check if snake ate the apple
        if (nextMove.x === apple.x && nextMove.y === apple.y) {
          // Spawn floating milestone achievement text right above the apple with safe boundary clamping
          const milestoneText = ACHIEVEMENTS[achievementIdxRef.current % ACHIEVEMENTS.length]
          achievementIdxRef.current += 1
          const msgId = messageIdCounterRef.current++

          const totalGridWidth = dimensions.cols * width
          const safeX = Math.max(135, Math.min(apple.x * width + width / 2, totalGridWidth - 135))
          const safeY = Math.max(42, apple.y * height - 8)

          const newMsg: FloatingMessage = {
            id: msgId,
            text: milestoneText,
            x: safeX,
            y: safeY,
            key: `${msgId}-${milestoneText}`,
          }

          // Replace with single latest message so consecutive milestones never overlap
          setMessages([newMsg])

          // Remove message after animation completes (2.4s)
          setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id === msgId ? false : true))
          }, 2400)

          // Grow snake and spawn next apple
          const grownBody = [nextMove, ...curBody]
          setApple(spawnApple(grownBody, dimensions.cols, dimensions.rows))
          return grownBody
        }

        // Regular move: advance head and remove tail
        return [nextMove, ...curBody.slice(0, -1)]
      })
    }, tickInterval)

    return () => clearInterval(interval)
  }, [apple, dimensions.cols, dimensions.rows, width, height, spawnApple, shouldReduceMotion])

  const handleMouseEnterSquare = useCallback((key: string) => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current)
    }
    setHoveredSquare(key)
    leaveTimerRef.current = window.setTimeout(() => {
      setHoveredSquare(null)
    }, 450)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / width)
      const row = Math.floor(y / height)
      if (col >= 0 && col < dimensions.cols && row >= 0 && row < dimensions.rows) {
        handleMouseEnterSquare(`${col}-${row}`)
      }
    },
    [width, height, dimensions.cols, dimensions.rows, handleMouseEnterSquare]
  )

  const snakeSet = new Set(snakeBody.map((p) => `${p.x},${p.y}`))

  return (
    <motion.div
      ref={containerRef}
      className={`interactive-grid-container ${className}`}
      style={{
        opacity: shouldReduceMotion ? 1 : opacity,
      }}
      aria-hidden="true"
    >
      <svg
        className="interactive-grid-svg"
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSquare(null)}
      >
        <defs>
          <pattern
            id="interactive-grid-base"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke="currentColor"
              className="interactive-grid-line"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Base grid pattern lines */}
        <rect width="100%" height="100%" fill="url(#interactive-grid-base)" />

        {/* Apple (#385dc8) */}
        {!shouldReduceMotion && (
          <rect
            x={apple.x * width}
            y={apple.y * height}
            width={width}
            height={height}
            className="snake-apple-square"
          />
        )}

        {/* Snake Body (#eda339) */}
        {!shouldReduceMotion &&
          snakeBody.map((p, idx) => {
            const isHead = idx === 0
            return (
              <rect
                key={`snake-${idx}-${p.x}-${p.y}`}
                x={p.x * width}
                y={p.y * height}
                width={width}
                height={height}
                className={`snake-body-square ${isHead ? 'snake-head-square' : ''} ${isFlashing ? 'is-flashing' : ''}`}
              />
            )
          })}

        {/* Interactive hoverable squares across entire viewport */}
        {Array.from({ length: dimensions.rows }).map((_, r) =>
          Array.from({ length: dimensions.cols }).map((_, c) => {
            const key = `${c}-${r}`
            const isHovered = hoveredSquare === key
            const isSnake = snakeSet.has(key)
            const isApple = apple.x === c && apple.y === r

            // Skip rendering transparent box if occupied by active snake/apple
            if (isSnake || isApple) return null

            return (
              <rect
                key={key}
                x={c * width}
                y={r * height}
                width={width}
                height={height}
                className={`interactive-grid-square ${isHovered ? 'is-active' : ''} ${squaresClassName}`}
                onMouseEnter={() => handleMouseEnterSquare(key)}
              />
            )
          })
        )}

        {/* Floating 8-Bit Achievement Milestone Text Layer */}
        {messages.map((msg) => (
          <text
            key={msg.key}
            x={msg.x}
            y={msg.y}
            textAnchor="middle"
            className="snake-milestone-text"
          >
            {msg.text}
          </text>
        ))}
      </svg>
    </motion.div>
  )
}

