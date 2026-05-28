'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft } from 'lucide-react'
import { InsightNode, type InsightNodeData } from './InsightNode'
import { ProductNode } from './ProductNode'
import { SegmentNode, type SegmentNodeData } from './SegmentNode'
import { buildInsightElements, getLayoutedInsightElements } from '@/lib/graph-utils'
import type { Provider } from '@/lib/langgraph/providers'
import type { PromptType, SegmentSession } from '@/lib/types'

const PRODUCT_ID = '__dag_product__'
const SEGMENT_ID = '__dag_segment__'

const nodeTypes = {
  insightNode: InsightNode,
  productNode: ProductNode,
  segmentNode: SegmentNode,
}

interface Props {
  product: string
  objective: string
  segment: string
  provider: Provider
  session: SegmentSession
  selectedNode: string | null
  onNodeClick: (promptKey: PromptType) => void
  onBack: () => void
}

export function InsightDAG({ product, objective, segment, provider, session, selectedNode, onNodeClick, onBack }: Props) {
  const { nodes: baseInsightNodes, edges: insightEdges } = useMemo(
    () => buildInsightElements(segment),
    [segment]
  )

  // Merge live session status into insight nodes
  const insightNodes: Node[] = useMemo(
    () =>
      baseInsightNodes.map((n) => {
        const promptKey = (n.data as InsightNodeData).promptKey
        const content = session.insights?.[promptKey] ?? null
        const status = session.status === 'ready' ? 'ready'
          : session.status === 'loading' ? 'loading'
          : session.status === 'error' ? 'error'
          : 'idle'
        return {
          ...n,
          selected: selectedNode === promptKey,
          data: { ...n.data, status, content } as InsightNodeData,
        }
      }),
    [baseInsightNodes, session, selectedNode]
  )

  // Build full node + edge list including product and segment header nodes
  const { allNodes, allEdges } = useMemo(() => {
    const productNode: Node = {
      id: PRODUCT_ID,
      type: 'productNode',
      position: { x: 0, y: 0 },
      data: { label: product || 'Product', objective },
      selectable: false,
    }

    const segmentStatus = session.status === 'loading' ? 'loading'
      : session.status === 'ready' ? 'ready'
      : session.status === 'error' ? 'error'
      : 'idle'

    const segmentNode: Node = {
      id: SEGMENT_ID,
      type: 'segmentNode',
      position: { x: 0, y: 0 },
      data: { label: segment, status: segmentStatus, provider } satisfies SegmentNodeData,
      selectable: false,
    }

    const topEdges: Edge[] = [
      {
        id: '__prod-seg__',
        source: PRODUCT_ID,
        target: SEGMENT_ID,
        type: 'straight',
        style: { stroke: '#534AB760', strokeDasharray: '4 4', strokeWidth: 1.5 },
      },
      // Segment connects to ALL insight nodes
      ...insightNodes.map((n) => ({
        id: `__seg-${n.id}__`,
        source: SEGMENT_ID,
        target: n.id,
        type: 'straight',
        style: { stroke: '#3E3E55', strokeDasharray: '4 4', strokeWidth: 1 },
      })),
    ]

    // Re-layout everything together so dagre ranks the header nodes above insight nodes
    const allRaw: Node[] = [productNode, segmentNode, ...insightNodes]
    // Use only topEdges for dagre layout (insight-to-insight edges handled separately for layout)
    const allEdgesRaw: Edge[] = [...topEdges, ...insightEdges]
    const laid = getLayoutedInsightElements(allRaw, allEdgesRaw)

    return { allNodes: laid, allEdges: allEdgesRaw }
  }, [product, objective, segment, provider, session.status, insightNodes, insightEdges])

  const styledEdges: Edge[] = useMemo(
    () =>
      allEdges.map((e) => ({
        ...e,
        labelStyle: { fill: '#7A7A8C', fontSize: 10 },
        labelBgStyle: { fill: '#0A0A0F', padding: 2 },
      })),
    [allEdges]
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.id === PRODUCT_ID || node.id === SEGMENT_ID) return
      const promptKey = (node.data as InsightNodeData).promptKey
      if (session.status === 'ready') onNodeClick(promptKey)
    },
    [session.status, onNodeClick]
  )

  return (
    <div className="h-full relative" style={{ background: '#0A0A0F' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: 'rgba(19,19,26,0.85)',
          border: '0.5px solid #1E1E2E',
          color: '#7A7A8C',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6EC')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#7A7A8C')}
      >
        <ArrowLeft size={12} />
        Back
      </button>

      <ReactFlow
        nodes={allNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0A0A0F' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.1)"
          gap={28}
          size={1.2}
        />
        <Controls />
      </ReactFlow>
    </div>
  )
}
