import { MarkerType, type Node, type Edge } from '@xyflow/react'
import dagre from 'dagre'
import type { DagSpec } from '@/lib/types'
import { tokens } from '@/lib/tokens'
import { resolveIcon } from '@/lib/icon-map'

const NODE_W = 220
const NODE_H = 72

const PRODUCT_NODE_W = 240
const PRODUCT_NODE_H = 88
const H_GAP = 60
const V_GAP = 180

export const PRODUCT_NODE_POSITION = { x: 0, y: 0 }

export function getRadialPosition(index: number, total: number): { x: number; y: number } {
  const totalWidth = total * NODE_W + (total - 1) * H_GAP
  const startX = (PRODUCT_NODE_W - totalWidth) / 2
  return {
    x: startX + index * (NODE_W + H_GAP),
    y: PRODUCT_NODE_H + V_GAP,
  }
}

export function getLayoutedInsightElements(
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => {
    const label = (n.data as Record<string, unknown>)?.label as string ?? ''
    const objective = (n.data as Record<string, unknown>)?.objective as string ?? ''
    const w = n.type === 'productNode'
      ? Math.min(320, Math.max(160, label.length * 10 + objective.length * 6 + 40))
      : n.type === 'segmentNode'
      ? Math.min(280, Math.max(160, label.length * 8 + 80))
      : 180
    const h = n.type === 'productNode' ? 88 : 72
    g.setNode(n.id, { width: w, height: h })
  })
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    if (!pos) return n
    return { ...n, position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 } }
  })
}

export function buildInsightElements(
  segmentId: string,
  dagSpec: DagSpec,
  existingPositions?: Map<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[]; rootIds: string[] } {
  // Determine the lowest y among already-positioned nodes so new ones appear below
  let baseY = 0
  if (existingPositions && existingPositions.size > 0) {
    baseY = Math.max(...Array.from(existingPositions.values()).map((p) => p.y)) + NODE_H + 80
  }

  const nodes: Node[] = dagSpec.nodes.map((n) => {
    const existingPos = existingPositions?.get(`${segmentId}:${n.id}`)
    return {
      id: `${segmentId}:${n.id}`,
      type: 'insightNode',
      position: existingPos ?? { x: 0, y: baseY },
      data: {
        promptKey: n.id,
        label: n.label,
        color: n.color,
        icon: resolveIcon(n.iconName),
        status: 'idle',
        content: null,
      },
    }
  })

  const edgeColor = (relation: keyof typeof tokens.edges) => tokens.edges[relation]

  const edges: Edge[] = dagSpec.edges.map((e) => ({
    id: `${segmentId}:${e.from}-${e.to}`,
    source: `${segmentId}:${e.from}`,
    target: `${segmentId}:${e.to}`,
    label: e.relation,
    type: 'default',
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: edgeColor(e.relation),
    },
    style: {
      stroke: edgeColor(e.relation),
      strokeDasharray: '4 4',
      strokeWidth: 1.5,
    },
    labelStyle: { fill: '#7A7A8C', fontSize: 10 },
    labelBgStyle: { fill: '#13131A' },
  }))

  const seen = new Set<string>()
  const uniqueEdges = edges.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  const targetIds = new Set(uniqueEdges.map((e) => e.target))
  const rootIds = nodes.map((n) => n.id).filter((id) => !targetIds.has(id))

  const layoutedNodes = getLayoutedInsightElements(nodes, uniqueEdges)
  return { nodes: layoutedNodes, edges: uniqueEdges, rootIds }
}
