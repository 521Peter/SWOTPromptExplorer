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
import { ArrowLeft, Sparkles } from 'lucide-react'
import { DagChatPanel } from '@/components/panels/DagChatPanel'
import { InsightNode, type InsightNodeData } from './InsightNode'
import { ProductNode } from './ProductNode'
import { SegmentNode, type SegmentNodeData } from './SegmentNode'
import { buildInsightElements, getLayoutedInsightElements } from '@/lib/graph-utils'
import type { Provider } from '@/lib/langgraph/providers'
import type { ChatMessage, DagSpec, SegmentSession } from '@/lib/types'
import type { ApiKeys } from '@/lib/types'

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
  dagSpec: DagSpec | null
  selectedNode: string | null
  onNodeClick: (nodeId: string) => void
  onRerunNode?: (nodeId: string) => void
  onBack: () => void
  keys?: Partial<ApiKeys>
  onChatMessage?: (userMsg: string, assistantMsg: ChatMessage, additions?: { nodes: DagSpec['nodes']; edges: DagSpec['edges'] }) => void
}

export function InsightDAG({ product, objective, segment, provider, session, dagSpec, selectedNode, onNodeClick, onRerunNode, onBack, keys = {}, onChatMessage }: Props) {

  const { nodes: baseInsightNodes, edges: insightEdges } = useMemo(
    () => dagSpec ? buildInsightElements(segment, dagSpec) : { nodes: [], edges: [], rootIds: [] },
    [segment, dagSpec]
  )

  const insightNodes: Node[] = useMemo(
    () =>
      baseInsightNodes.map((n) => {
        const promptKey = (n.data as InsightNodeData).promptKey as string
        const content = session.insights?.[promptKey] ?? null
        const stale = session.staleNodeIds.has(promptKey)
        const status =
          session.status === 'ready'    ? 'ready' :
          session.status === 'loading'  ? 'loading' :
          session.status === 'error'    ? 'error' :
          'idle'
        return {
          ...n,
          selected: selectedNode === promptKey,
          data: { ...n.data, status, content, stale } as InsightNodeData,
        }
      }),
    [baseInsightNodes, session, selectedNode]
  )

  const { allNodes, allEdges } = useMemo(() => {
    const productNode: Node = {
      id: PRODUCT_ID,
      type: 'productNode',
      position: { x: 0, y: 0 },
      data: { label: product || 'Product', objective },
      selectable: false,
    }

    const segmentStatus =
      session.status === 'planning' ? 'planning' :
      session.status === 'loading'  ? 'loading' :
      session.status === 'ready'    ? 'ready' :
      session.status === 'error'    ? 'error' :
      'idle'

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
        style: { stroke: '#6B62D1', strokeDasharray: '5 4', strokeWidth: 1.5 },
      },
      ...insightNodes.map((n) => ({
        id: `__seg-${n.id}__`,
        source: SEGMENT_ID,
        target: n.id,
        type: 'straight',
        style: { stroke: '#5A5A7A', strokeDasharray: '5 4', strokeWidth: 1.5 },
      })),
    ]

    const allRaw: Node[] = [productNode, segmentNode, ...insightNodes]
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
      const nodeId = (node.data as InsightNodeData).promptKey as string
      const stale = (node.data as InsightNodeData).stale
      if (stale && onRerunNode) {
        onRerunNode(nodeId)
      } else if (session.status === 'ready') {
        onNodeClick(nodeId)
      }
    },
    [session.status, onNodeClick, onRerunNode]
  )

  return (
    <div className="h-full relative" style={{ background: '#0A0A0F' }}>
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

      {/* Planning overlay — shown while /api/plan is in flight */}
      {session.status === 'planning' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <Sparkles size={20} style={{ color: '#8B5CF6' }} className="animate-pulse" />
          <p style={{ color: '#C4B5FD', fontSize: 13, fontWeight: 500 }}>Planning analysis&hellip;</p>
          <p style={{ color: '#5A5A6C', fontSize: 11 }}>The LLM is designing a custom DAG for this segment</p>
        </div>
      )}

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
        style={{ background: '#0A0A0F', paddingBottom: session.status === 'ready' ? 36 : 0 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.1)"
          gap={28}
          size={1.2}
        />
        <Controls style={{ bottom: session.status === 'ready' ? 44 : 10 }} />
      </ReactFlow>

      {/* Chat panel — only shown when analysis is ready */}
      {session.status === 'ready' && dagSpec && onChatMessage && (
        <DagChatPanel
          segment={segment}
          provider={provider}
          dagSpec={dagSpec}
          history={session.chat}
          keys={keys}
          product={product}
          objective={objective}
          onMessage={onChatMessage}
        />
      )}
    </div>
  )
}
