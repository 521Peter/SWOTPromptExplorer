import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'
import type { PromptType } from '@/lib/types'
import { PROMPT_CONFIG } from '@/constants/prompt-config'
import { tokens } from '@/lib/tokens'

const NODE_W = 220
const NODE_H = 72

/** Positions segment nodes in a loose radial layout */
export function getRadialPosition(index: number, total: number): { x: number; y: number } {
  if (total === 1) return { x: 300, y: 250 }
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  const rx = Math.min(280, 120 + total * 40)
  const ry = Math.min(220, 100 + total * 30)
  return {
    x: 350 + rx * Math.cos(angle) - NODE_W / 2,
    y: 280 + ry * Math.sin(angle) - NODE_H / 2,
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

  nodes.forEach((n) => g.setNode(n.id, { width: 180, height: 72 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => ({
    ...n,
    position: {
      x: g.node(n.id).x - 90,
      y: g.node(n.id).y - 36,
    },
  }))
}

/** Builds insight nodes + causal edges for a given segment */
export function buildInsightElements(segmentId: string): { nodes: Node[]; edges: Edge[] } {
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
      const target = ce.to ?? key
      const source = ce.from ?? key
      const edgeKey = ce.to ? key : (ce.from as PromptType)
      const edgeTo = ce.to ?? key

      edges.push({
        id: `${segmentId}:${source}-${target}`,
        source: `${segmentId}:${source === key ? key : ce.from!}`,
        target: `${segmentId}:${edgeTo}`,
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
      void edgeKey // suppress unused warning
    })
  })

  const layoutedNodes = getLayoutedInsightElements(nodes, edges)
  return { nodes: layoutedNodes, edges }
}
