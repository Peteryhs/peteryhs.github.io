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
  'DECA 45',
  'IRHSAI 24',
  'Hack the Ridge Team 24',
  'DECA Team Ontario 46',
  'IRHSAI 25',
  'Hack the Ridge Team 25',
  'DECA Team Ontario 47',
  'IRHSAI 26',
  "UW CE '31",
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

// Full A* Pathfinding with card boundary obstacle awareness and flood-fill survival fallback
function findNextMoveAStar(
  head: Point,
  target: Point,
  body: Point[],
  cols: number,
  rows: number,
  cardObstacles?: Set<string>
): Point | null {
  if (target.x < 0 || target.x >= cols || target.y < 0 || target.y >= rows) {
    return null
  }

  // Obstacles include snake body (minus moving tail) + all cells occupied by Bento cards/tiles
  const obstacles = new Set(body.slice(0, -1).map((p) => `${p.x},${p.y}`))
  if (cardObstacles) {
    cardObstacles.forEach((k) => obstacles.add(k))
  }

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
        obstacles.has(nKey) ||
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
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !obstacles.has(key)) {
      validNeighbors.push({ x: nx, y: ny })
    }
  }

  if (validNeighbors.length === 0) {
    return null
  }

  let bestNeighbor = validNeighbors[0]
  let bestScore = -Infinity

  for (const neighbor of validNeighbors) {
    const space = countReachableSpace(neighbor, obstacles, cols, rows, 60)
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

  // Autonomous Snake State (initialized in open space on the right)
  const [snakeBody, setSnakeBody] = useState<Point[]>([
    { x: 26, y: 6 },
    { x: 25, y: 6 },
    { x: 24, y: 6 },
  ])
  const snakeBodyRef = useRef<Point[]>([
    { x: 26, y: 6 },
    { x: 25, y: 6 },
    { x: 24, y: 6 },
  ])

  const [apple, setApple] = useState<Point>({ x: 28, y: 12 })
  const appleRef = useRef<Point>({ x: 28, y: 12 })

  const [snakeStatus, setSnakeStatus] = useState<'alive' | 'disappearing' | 'restarting'>('alive')
  const [snakeGenKey, setSnakeGenKey] = useState(0)
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

  // Sync state to refs for non-tearing game loop
  useEffect(() => {
    appleRef.current = apple
  }, [apple])

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

  // Compute exact cells covered by the existing cards/tiles so the snake never goes underneath
  const getCardObstacles = useCallback((): Set<string> => {
    const obstacles = new Set<string>()
    const container = containerRef.current
    const section = sectionRef.current
    if (!container || !section) return obstacles

    const gridRect = container.getBoundingClientRect()
    const cards = section.querySelectorAll('.bento-card, .longform-heading')

    cards.forEach((card) => {
      const r = card.getBoundingClientRect()
      // Map pixel rectangle to grid cells with zero clipping
      const startCol = Math.max(0, Math.floor((r.left - gridRect.left) / width))
      const endCol = Math.min(dimensions.cols - 1, Math.floor((r.right - gridRect.left) / width))
      const startRow = Math.max(0, Math.floor((r.top - gridRect.top) / height))
      const endRow = Math.min(dimensions.rows - 1, Math.floor((r.bottom - gridRect.top) / height))

      for (let c = startCol; c <= endCol; c++) {
        for (let row = startRow; row <= endRow; row++) {
          obstacles.add(`${c},${row}`)
        }
      }
    })

    return obstacles
  }, [dimensions.cols, dimensions.rows, width, height, sectionRef])

  // Spawn apple strictly inside open, visible areas outside existing tiles/cards
  const spawnApple = useCallback(
    (body: Point[], cols: number, rows: number, cardObstacles?: Set<string>): Point => {
      const bodySet = new Set(body.map((p) => `${p.x},${p.y}`))
      const openCells: Point[] = []

      for (let c = 1; c < cols - 1; c++) {
        for (let r = 1; r < rows - 1; r++) {
          const key = `${c},${r}`
          if (!bodySet.has(key) && (!cardObstacles || !cardObstacles.has(key))) {
            openCells.push({ x: c, y: r })
          }
        }
      }

      if (openCells.length > 0) {
        // Prioritize open spaces on the right side if available
        const rightCells = openCells.filter((p) => p.x >= Math.floor(cols * 0.42))
        const pool = rightCells.length > 0 ? rightCells : openCells
        return pool[Math.floor(Math.random() * pool.length)]
      }

      return { x: Math.min(cols - 2, 4), y: Math.min(rows - 2, 4) }
    },
    []
  )

  // Ensure apple and snake stay inside valid open bounds when dimensions update
  useEffect(() => {
    if (dimensions.cols > 4 && dimensions.rows > 4) {
      const cardObstacles = getCardObstacles()
      const curApple = appleRef.current
      if (
        curApple.x < 1 ||
        curApple.x >= dimensions.cols - 1 ||
        curApple.y < 1 ||
        curApple.y >= dimensions.rows - 1 ||
        cardObstacles.has(`${curApple.x},${curApple.y}`)
      ) {
        const newApple = spawnApple(snakeBodyRef.current, dimensions.cols, dimensions.rows, cardObstacles)
        appleRef.current = newApple
        setApple(newApple)
      }
    }
  }, [dimensions.cols, dimensions.rows, spawnApple, getCardObstacles])

  // Stable Autonomous Snake Game Loop with guaranteed sequential milestones
  useEffect(() => {
    if (shouldReduceMotion) return

    const tickInterval = 175 // Smooth, retro-arcade pace

    const interval = setInterval(() => {
      // Pause advancing if currently resetting/disappearing
      if (isResettingRef.current) return

      const cardObstacles = getCardObstacles()
      const curBody = snakeBodyRef.current
      const curApple = appleRef.current

      if (curBody.length === 0) return

      const head = curBody[0]
      const nextMove = findNextMoveAStar(head, curApple, curBody, dimensions.cols, dimensions.rows, cardObstacles)

      // When snake reaches length 20 or gets completely trapped:
      // Smooth blur-fade out, reposition in open space, and smooth blur-fade in
      if (!nextMove || curBody.length >= 20) {
        isResettingRef.current = true
        setSnakeStatus('disappearing')

        setTimeout(() => {
          const safeCols = Math.max(dimensions.cols, 8)
          const safeRows = Math.max(dimensions.rows, 8)
          const obstacles = getCardObstacles()

          // Find valid 3-cell contiguous horizontal starts in open space
          const validStarts: Point[] = []
          for (let c = 3; c < safeCols - 2; c++) {
            for (let r = 2; r < safeRows - 2; r++) {
              if (
                !obstacles.has(`${c},${r}`) &&
                !obstacles.has(`${c - 1},${r}`) &&
                !obstacles.has(`${c - 2},${r}`)
              ) {
                validStarts.push({ x: c, y: r })
              }
            }
          }

          const rightStarts = validStarts.filter((p) => p.x >= Math.floor(safeCols * 0.42))
          const pool = rightStarts.length > 0 ? rightStarts : validStarts
          const start = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { x: safeCols - 4, y: 4 }

          const newBody = [
            { x: start.x, y: start.y },
            { x: start.x - 1, y: start.y },
            { x: start.x - 2, y: start.y },
          ]

          const newApple = spawnApple(newBody, dimensions.cols, dimensions.rows, obstacles)
          snakeBodyRef.current = newBody
          appleRef.current = newApple
          setSnakeBody(newBody)
          setApple(newApple)
          setSnakeGenKey((k) => k + 1)
          setSnakeStatus('restarting')

          setTimeout(() => {
            setSnakeStatus('alive')
            isResettingRef.current = false
          }, 450)
        }, 380)

        return
      }

      // Check if snake ate the apple
      if (nextMove.x === curApple.x && nextMove.y === curApple.y) {
        // Guaranteed sequential milestone in exact order:
        const currentMilestoneIndex = achievementIdxRef.current % ACHIEVEMENTS.length
        const milestoneText = ACHIEVEMENTS[currentMilestoneIndex]
        const isFinalMilestone = currentMilestoneIndex === ACHIEVEMENTS.length - 1

        const msgId = messageIdCounterRef.current++
        const totalGridWidth = dimensions.cols * width
        const safeX = Math.max(140, Math.min(curApple.x * width + width / 2, totalGridWidth - 140))
        const safeY = Math.max(42, curApple.y * height - 8)

        const newMsg: FloatingMessage = {
          id: msgId,
          text: milestoneText,
          x: safeX,
          y: safeY,
          key: `${msgId}-${milestoneText}-${Date.now()}`,
        }

        // Replace with single latest message so consecutive milestones never overlap
        setMessages([newMsg])

        // Remove message after animation completes (2.4s)
        setTimeout(() => {
          setMessages((prev) => (prev.filter((m) => m.id !== msgId)))
        }, 2400)

        // If reached final milestone (UW CE '31):
        if (isFinalMilestone) {
          // Immediately pause any further movement/eating
          isResettingRef.current = true
          // Reset achievement counter so the first apple after restart is DECA 45 (index 0)
          achievementIdxRef.current = 0

          // Clear the apple immediately so it cannot be re-eaten or trigger another milestone
          appleRef.current = { x: -999, y: -999 }
          setApple({ x: -999, y: -999 })

          // Grow snake for this final milestone step
          const grownBody = [nextMove, ...curBody]
          snakeBodyRef.current = grownBody
          setSnakeBody(grownBody)

          // Display UW CE '31, then blur-fade out and restart fresh at bottom
          setTimeout(() => {
            setSnakeStatus('disappearing')

            setTimeout(() => {
              const safeCols = Math.max(dimensions.cols, 8)
              const safeRows = Math.max(dimensions.rows, 8)
              const obstacles = getCardObstacles()

              // Spawn at bottom open space to start fresh
              const validStarts: Point[] = []
              for (let c = 3; c < safeCols - 2; c++) {
                for (let r = Math.max(2, safeRows - 6); r < safeRows - 2; r++) {
                  if (
                    !obstacles.has(`${c},${r}`) &&
                    !obstacles.has(`${c - 1},${r}`) &&
                    !obstacles.has(`${c - 2},${r}`)
                  ) {
                    validStarts.push({ x: c, y: r })
                  }
                }
              }

              const pool = validStarts.length > 0 ? validStarts : [{ x: safeCols - 4, y: safeRows - 3 }]
              const start = pool[Math.floor(Math.random() * pool.length)]

              const freshBody = [
                { x: start.x, y: start.y },
                { x: start.x - 1, y: start.y },
                { x: start.x - 2, y: start.y },
              ]

              const newApple = spawnApple(freshBody, dimensions.cols, dimensions.rows, obstacles)
              snakeBodyRef.current = freshBody
              appleRef.current = newApple
              setSnakeBody(freshBody)
              setApple(newApple)
              setSnakeGenKey((k) => k + 1)
              setSnakeStatus('restarting')

              setTimeout(() => {
                setSnakeStatus('alive')
                isResettingRef.current = false
              }, 450)
            }, 380)
          }, 850)

          return
        }

        // Regular milestone advancement:
        achievementIdxRef.current += 1
        const grownBody = [nextMove, ...curBody]
        const newApple = spawnApple(grownBody, dimensions.cols, dimensions.rows, cardObstacles)
        snakeBodyRef.current = grownBody
        appleRef.current = newApple
        setSnakeBody(grownBody)
        setApple(newApple)
        return
      }

      // Regular move: advance head and remove tail
      const newBody = [nextMove, ...curBody.slice(0, -1)]
      snakeBodyRef.current = newBody
      setSnakeBody(newBody)
    }, tickInterval)

    return () => clearInterval(interval)
  }, [dimensions.cols, dimensions.rows, width, height, spawnApple, getCardObstacles, shouldReduceMotion])

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

  // Place apple on square click
  const handleSquareClick = useCallback(
    (col: number, row: number) => {
      if (shouldReduceMotion) return

      // Do not allow placing under bento cards
      const obstacles = getCardObstacles()
      const key = `${col},${row}`
      if (obstacles.has(key)) return

      // Do not allow placing on perimeter border or out of bounds
      if (col <= 0 || col >= dimensions.cols - 1 || row <= 0 || row >= dimensions.rows - 1) return

      // Do not allow placing directly on snake head/body
      const isSnakeCell = snakeBodyRef.current.some((p) => p.x === col && p.y === row)
      if (isSnakeCell) return

      // Move apple directly to clicked square
      const newApple = { x: col, y: row }
      appleRef.current = newApple
      setApple(newApple)
    },
    [getCardObstacles, dimensions.cols, dimensions.rows, shouldReduceMotion]
  )

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (shouldReduceMotion) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / width)
      const row = Math.floor(y / height)
      handleSquareClick(col, row)
    },
    [width, height, handleSquareClick, shouldReduceMotion]
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
        onClick={handleSvgClick}
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
          <motion.rect
            key={`apple-${apple.x}-${apple.y}`}
            x={apple.x * width}
            y={apple.y * height}
            width={width}
            height={height}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="snake-apple-square"
          />
        )}

        {/* Snake Body (#eda339) with smooth blur-fade disappearance & restart */}
        {!shouldReduceMotion && (
          <motion.g
            key={`snake-group-${snakeGenKey}`}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={
              snakeStatus === 'disappearing'
                ? { opacity: 0, filter: 'blur(10px)' }
                : { opacity: 1, filter: 'blur(0px)' }
            }
            transition={{
              duration: snakeStatus === 'disappearing' ? 0.38 : 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {snakeBody.map((p, idx) => {
              const isHead = idx === 0
              return (
                <rect
                  key={`snake-${idx}-${p.x}-${p.y}`}
                  x={p.x * width}
                  y={p.y * height}
                  width={width}
                  height={height}
                  className={`snake-body-square ${isHead ? 'snake-head-square' : ''}`}
                />
              )
            })}
          </motion.g>
        )}

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
                onClick={(e) => {
                  e.stopPropagation()
                  handleSquareClick(c, r)
                }}
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
