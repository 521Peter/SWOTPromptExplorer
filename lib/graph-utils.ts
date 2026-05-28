import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'
import type { PromptType } from '@/lib/types'
import { PROMPT_CONFIG } from '@/constants/prompt-config'
import { tokens } from '@/lib/tokens'

const NODE_W = 220
const NODE_H = 72

const PRODUCT_NODE_W = 200
const PRODUCT_NODE_H = 80
const H_GAP = 60  // horizontal gap between segment nodes
const V_GAP = 180 // vertical gap from product to segments

/** Product node sits at the top-center of the graph */
export const PRODUCT_NODE_POSITION = { x: 0, y: 0 }

/** Positions segment nodes in a horizontal row below the product node */
export function getRadialPosition(index: number, total: number): { x: number; y: number } {
  const totalWidth = total * NODE_W + (total - 1) * H_GAP
  const startX = (PRODUCT_NODE_W - totalWidth) / 2
  return {
    x: startX + index * (NODE_W + H_GAP),
    y: PRODUCT_NODE_H + V_GAP,
  }
}

/** Auto-layouts insight DAG nodes using dagre */
export function getLayoutedInsightElements(
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => {
    const w = n.type === 'productNode' ? 200 : n.type === 'segmentNode' ? 220 : 180
    const h = n.type === 'productNode' ? 80 : 72
    g.setNode(n.id, { width: w, height: h })
  })
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => {
    const { x, y, width, height } = g.node(n.id)
    return { ...n, position: { x: x - width / 2, y: y - height / 2 } }
  })
}

/** Builds insight nodes + causal edges for a given segment */
export function buildInsightElements(segmentId: string): { nodes: Node[]; edges: Edge[]; rootIds: string[] } {
  const promptKeys = Object.keys(PROMPT_CONFIG) as PromptType[]

  const nodes: Node[] = promptKeys.map((key) => {
    const cfg = PROMPT_CONFIG[key]
    return {
      id: `${segmentId}:${key}`,
      type: 'insightNode',
      position: { x: 0, y: 0 }, // will be set by dagre
      data: {
        promptKey: key,
        label: cfg.label,
        color: cfg.color,
        icon: cfg.icon,
        status: 'idle',
        content: null,
      },
    }
  })

  const edges: Edge[] = []
  promptKeys.forEach((key) => {
    const cfg = PROMPT_CONFIG[key]
    cfg.causalEdges.forEach((ce) => {
      const source = ce.from ?? key
      const target = ce.to ?? key

      edges.push({
        id: `${segmentId}:${source}-${target}`,
        source: `${segmentId}:${source}`,
        target: `${segmentId}:${target}`,
        label: ce.label,
        type: 'straight',
        animated: false,
        style: {
          stroke: tokens.edges[ce.label],
          strokeDasharray: '4 4',
          strokeWidth: 1,
        },
        labelStyle: { fill: '#7A7A8C', fontSize: 10 },
        labelBgStyle: { fill: '#13131A' },
      })
    })
  })

  // Deduplicate edges by id (guards against bidirectional edge definitions)
  const seen = new Set<string>()
  const uniqueEdges = edges.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  // Root insight nodes = those with no incoming edges from other insight nodes
  const targetIds = new Set(uniqueEdges.map((e) => e.target))
  const rootIds = nodes.map((n) => n.id).filter((id) => !targetIds.has(id))

  const layoutedNodes = getLayoutedInsightElements(nodes, uniqueEdges)
  return { nodes: layoutedNodes, edges: uniqueEdges, rootIds }
}
