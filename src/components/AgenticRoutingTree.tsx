import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export interface AgenticRoutingTreeProps {
  isActive: boolean
}

interface Node {
  id: string
  x: number
  y: number
  tier: number
  children: string[]
}

interface Edge {
  from: Node
  to: Node
  p0: [number, number]
  p1: [number, number]
  p2: [number, number]
  p3: [number, number]
}

interface Pulse {
  edgeIndex: number
  t: number
  speed: number
  size: number
  alpha: number
  trailLength: number
}

interface Ripple {
  x: number
  y: number
  r: number
  maxR: number
  alpha: number
}

function cubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t

  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0]
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1]
  return [x, y]
}

export function AgenticRoutingTree({ isActive }: AgenticRoutingTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rgbaRef = useRef({ r: 244, g: 244, b: 245 })

  // Resolve theme color for the network
  useEffect(() => {
    const temp = document.createElement('div')
    temp.style.color = 'var(--ink)'
    document.body.appendChild(temp)
    const computed = getComputedStyle(temp).color || 'rgb(244, 244, 245)'
    document.body.removeChild(temp)

    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    const ctx = probe.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillStyle = computed
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      rgbaRef.current = { r, g, b }
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let stopped = false
    let width = 0
    let height = 0

    let nodes: Node[] = []
    let edges: Edge[] = []
    let pulses: Pulse[] = []
    let ripples: Ripple[] = []
    const nodeMap = new Map<string, Node>()

    const buildTree = () => {
      const dpr = window.devicePixelRatio || 1
      width = canvas.clientWidth || window.innerWidth
      height = canvas.clientHeight || window.innerHeight

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      nodes = []
      edges = []
      nodeMap.clear()

      // Multi-tier branching coordinates shifted right while ensuring leaf nodes remain safely inside canvas
      let x0: number
      let x1: number
      let x2: number
      let x3: number

      if (width >= 1600) {
        // Super large screens: roots start near 48%, branching across 63% and 78%, leaves cleanly anchored at 93%
        x0 = width * 0.48
        x1 = width * 0.63
        x2 = width * 0.78
        x3 = width * 0.93
      } else if (width >= 1200) {
        // Standard large desktops:
        x0 = width * 0.42
        x1 = width * 0.59
        x2 = width * 0.76
        x3 = width * 0.92
      } else if (width >= 860) {
        // Medium laptops / tablets:
        x0 = width * 0.35
        x1 = width * 0.54
        x2 = width * 0.73
        x3 = width * 0.92
      } else {
        // Mobile / compact screens:
        x0 = width * 0.15
        x1 = width * 0.38
        x2 = width * 0.65
        x3 = width * 0.90
      }

      // Tier 0: Input Roots
      const t0: Node[] = [
        { id: 'root_0', x: x0, y: height * 0.35, tier: 0, children: ['hub_0', 'hub_1'] },
        { id: 'root_1', x: x0, y: height * 0.65, tier: 0, children: ['hub_1', 'hub_2'] },
      ]

      // Tier 1: Intent Evaluation Hubs
      const t1: Node[] = [
        { id: 'hub_0', x: x1, y: height * 0.22, tier: 1, children: ['tool_0', 'tool_1', 'tool_2'] },
        { id: 'hub_1', x: x1, y: height * 0.50, tier: 1, children: ['tool_1', 'tool_2', 'tool_3', 'tool_4'] },
        { id: 'hub_2', x: x1, y: height * 0.78, tier: 1, children: ['tool_3', 'tool_4', 'tool_5'] },
      ]

      // Tier 2: Specialized Tool Gateways
      const t2: Node[] = [
        { id: 'tool_0', x: x2, y: height * 0.12, tier: 2, children: ['leaf_0', 'leaf_1'] },
        { id: 'tool_1', x: x2, y: height * 0.28, tier: 2, children: ['leaf_1', 'leaf_2', 'leaf_3'] },
        { id: 'tool_2', x: x2, y: height * 0.44, tier: 2, children: ['leaf_3', 'leaf_4', 'leaf_5'] },
        { id: 'tool_3', x: x2, y: height * 0.60, tier: 2, children: ['leaf_4', 'leaf_5', 'leaf_6'] },
        { id: 'tool_4', x: x2, y: height * 0.76, tier: 2, children: ['leaf_6', 'leaf_7', 'leaf_8'] },
        { id: 'tool_5', x: x2, y: height * 0.90, tier: 2, children: ['leaf_8', 'leaf_9'] },
      ]

      // Tier 3: Leaf Execution & Synthesis Nodes (Elongated right reach)
      const t3: Node[] = [
        { id: 'leaf_0', x: x3, y: height * 0.08, tier: 3, children: [] },
        { id: 'leaf_1', x: x3, y: height * 0.17, tier: 3, children: [] },
        { id: 'leaf_2', x: x3, y: height * 0.27, tier: 3, children: [] },
        { id: 'leaf_3', x: x3, y: height * 0.37, tier: 3, children: [] },
        { id: 'leaf_4', x: x3, y: height * 0.47, tier: 3, children: [] },
        { id: 'leaf_5', x: x3, y: height * 0.57, tier: 3, children: [] },
        { id: 'leaf_6', x: x3, y: height * 0.67, tier: 3, children: [] },
        { id: 'leaf_7', x: x3, y: height * 0.77, tier: 3, children: [] },
        { id: 'leaf_8', x: x3, y: height * 0.86, tier: 3, children: [] },
        { id: 'leaf_9', x: x3, y: height * 0.94, tier: 3, children: [] },
      ]

      nodes = [...t0, ...t1, ...t2, ...t3]
      nodes.forEach((n) => nodeMap.set(n.id, n))

      // Build edges with smooth cubic bezier control points
      nodes.forEach((fromNode) => {
        fromNode.children.forEach((toId) => {
          const toNode = nodeMap.get(toId)
          if (!toNode) return

          const dx = toNode.x - fromNode.x
          const p0: [number, number] = [fromNode.x, fromNode.y]
          const p1: [number, number] = [fromNode.x + dx * 0.5, fromNode.y]
          const p2: [number, number] = [toNode.x - dx * 0.5, toNode.y]
          const p3: [number, number] = [toNode.x, toNode.y]

          edges.push({ from: fromNode, to: toNode, p0, p1, p2, p3 })
        })
      })

      // Seed pulses along random edges
      pulses = []
      const pulseCount = Math.max(18, Math.min(36, Math.floor(width / 45)))
      for (let i = 0; i < pulseCount; i++) {
        pulses.push({
          edgeIndex: Math.floor(Math.random() * edges.length),
          t: Math.random(),
          speed: 0.0035 + Math.random() * 0.005,
          size: 2.8 + Math.random() * 2.0,
          alpha: 0.50 + Math.random() * 0.45,
          trailLength: 0.15 + Math.random() * 0.09,
        })
      }
    }

    buildTree()

    const animate = () => {
      if (stopped) return

      ctx.clearRect(0, 0, width, height)
      const { r, g, b } = rgbaRef.current

      // 1. Draw Network Edges (Subtle Vector Branching Traces - 1.25x scale)
      ctx.lineWidth = 1.5
      edges.forEach((edge) => {
        ctx.beginPath()
        ctx.moveTo(edge.p0[0], edge.p0[1])
        ctx.bezierCurveTo(edge.p1[0], edge.p1[1], edge.p2[0], edge.p2[1], edge.p3[0], edge.p3[1])
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.13)`
        ctx.stroke()
      })

      // 2. Draw Junction Nodes (1.25x larger)
      nodes.forEach((node) => {
        const isRoot = node.tier === 0
        const isHub = node.tier === 1
        const isTool = node.tier === 2

        const baseR = isRoot ? 5.8 : isHub ? 5.0 : isTool ? 4.4 : 3.2

        // Outer ring
        ctx.beginPath()
        ctx.arc(node.x, node.y, baseR + 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.22)`
        ctx.lineWidth = 1.2
        ctx.stroke()

        // Inner solid core
        ctx.beginPath()
        ctx.arc(node.x, node.y, baseR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.65)`
        ctx.fill()
      })

      // 3. Update & Draw Ripples at Junctions (1.25x larger)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i]
        rip.r += 0.5
        rip.alpha -= 0.02
        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripples.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rip.alpha})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // 4. Update & Draw Routing Pulses (Data Packets - 1.25x scale)
      pulses.forEach((pulse) => {
        pulse.t += pulse.speed
        const edge = edges[pulse.edgeIndex]

        if (!edge) return

        if (pulse.t >= 1) {
          // Reached end of current edge -> spawn ripple at target node
          if (ripples.length < 20 && Math.random() > 0.4) {
            ripples.push({
              x: edge.to.x,
              y: edge.to.y,
              r: 3.5,
              maxR: 15,
              alpha: 0.48,
            })
          }

          // Choose next edge from the target node's children, or reset to a root edge
          const candidateEdgeIndices: number[] = []
          edges.forEach((e, idx) => {
            if (e.from.id === edge.to.id) {
              candidateEdgeIndices.push(idx)
            }
          })

          if (candidateEdgeIndices.length > 0) {
            pulse.edgeIndex = candidateEdgeIndices[Math.floor(Math.random() * candidateEdgeIndices.length)]
            pulse.t = 0
          } else {
            // Reached leaf node -> reset to Tier 0 / Tier 1 root
            const rootIndices: number[] = []
            edges.forEach((e, idx) => {
              if (e.from.tier === 0 || e.from.tier === 1) {
                rootIndices.push(idx)
              }
            })
            pulse.edgeIndex = rootIndices[Math.floor(Math.random() * rootIndices.length)]
            pulse.t = 0
            pulse.speed = 0.0035 + Math.random() * 0.005
          }
        }

        // Draw light trail along the bezier curve
        const segments = 10
        for (let s = 0; s < segments; s++) {
          const segT = pulse.t - (s / segments) * pulse.trailLength
          if (segT < 0 || segT > 1) continue
          const nextT = pulse.t - ((s + 1) / segments) * pulse.trailLength
          if (nextT < 0 || nextT > 1) continue

          const pStart = cubicBezier(edge.p0, edge.p1, edge.p2, edge.p3, segT)
          const pEnd = cubicBezier(edge.p0, edge.p1, edge.p2, edge.p3, nextT)
          const segAlpha = pulse.alpha * (1 - s / segments) * 0.65

          ctx.beginPath()
          ctx.moveTo(pStart[0], pStart[1])
          ctx.lineTo(pEnd[0], pEnd[1])
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${segAlpha})`
          ctx.lineWidth = pulse.size * (1 - (s / segments) * 0.5)
          ctx.stroke()
        }

        // Draw pulse head
        const headPt = cubicBezier(edge.p0, edge.p1, edge.p2, edge.p3, pulse.t)
        ctx.beginPath()
        ctx.arc(headPt[0], headPt[1], pulse.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulse.alpha})`
        ctx.fill()
      })

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (!stopped) buildTree()
      })
    })
    ro.observe(canvas)

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [isActive])

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="agentic-routing-tree-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <canvas
            ref={canvasRef}
            className="agentic-routing-tree-canvas"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
