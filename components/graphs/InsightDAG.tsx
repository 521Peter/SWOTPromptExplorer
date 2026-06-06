'use client'

import { useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
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
  onChatSend?: (userMsg: string, assistantMsg: ChatMessage) => void
  onChatAddNode?: (msgIndex: number, additions: { nodes: DagSpec['nodes']; edges: DagSpec['edges'] }) => void
}

export function InsightDAG({ product, objective, segment, provider, session, dagSpec, selectedNode, onNodeClick, onRerunNode, onBack, keys = {}, onChatSend, onChatAddNode }: Props) {

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges] = useEdgesState<Edge>([])

  // Rebuild layout only when dagSpec changes (preserves drag positions across session updates)
  useEffect(() => {
    if (!dagSpec) { setNodes([]); setEdges([]); return }

    const { nodes: insightNodes, edges: insightEdges } = buildInsightElements(segment, dagSpec)

    const productNode: Node = {
      id: PRODUCT_ID, type: 'productNode', position: { x: 0, y: 0 },
      data: { label: product || 'Product', objective }, selectable: false,
    }
    const segmentNode: Node = {
      id: SEGMENT_ID, type: 'segmentNode', position: { x: 0, y: 0 },
      data: { label: segment, status: 'idle', provider } satisfies SegmentNodeData, selectable: false,
    }
    const topEdges: Edge[] = [
      {
        id: '__prod-seg__', source: PRODUCT_ID, target: SEGMENT_ID, type: 'default',
        animated: false,
        style: { stroke: '#6B62D1', strokeDasharray: '5 4', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 11, height: 11, color: '#6B62D1' },
      } as Edge,
      ...insightNodes.map((n) => ({
        id: `__seg-${n.id}__`, source: SEGMENT_ID, target: n.id, type: 'default' as const,
        animated: false,
        style: { stroke: '#5A5A7A', strokeDasharray: '5 4', strokeWidth: 1.2 },
      } as Edge)),
    ]

    const allRaw = [productNode, segmentNode, ...insightNodes]
    const allEdgesRaw = [...topEdges, ...insightEdges]
    setNodes(getLayoutedInsightElements(allRaw, allEdgesRaw))
    setEdges(allEdgesRaw)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dagSpec, segment])

  // Update only data fields when session changes — never touch positions
  useEffect(() => {
    const segmentStatus =
      session.status === 'planning' ? 'planning' :
      session.status === 'loading'  ? 'loading' :
      session.status === 'ready'    ? 'ready' :
      session.status === 'error'    ? 'error' : 'idle'

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === SEGMENT_ID) {
          return { ...n, data: { ...n.data, status: segmentStatus } }
        }
        if (n.id === PRODUCT_ID) return n
        const promptKey = (n.data as InsightNodeData).promptKey as string
        const content = session.insights?.[promptKey] ?? null
        const stale = session.staleNodeIds.has(promptKey)
        const nodeStatus =
          session.status === 'ready'   ? 'ready' :
          session.status === 'loading' ? 'loading' :
          session.status === 'error'   ? 'error' : 'idle'
        return { ...n, data: { ...n.data, status: nodeStatus, content, stale } }
      })
    )

    const isLoading = session.status === 'loading' || session.status === 'planning'
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id === '__prod-seg__') return { ...e, animated: isLoading }
        if (e.id.startsWith('__seg-')) return { ...e, animated: isLoading }
        return e
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // Update selected state without touching positions
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === PRODUCT_ID || n.id === SEGMENT_ID) return n
        const promptKey = (n.data as InsightNodeData).promptKey as string
        return { ...n, selected: selectedNode === promptKey }
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode])

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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
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
      {session.status === 'ready' && dagSpec && onChatSend && onChatAddNode && (
        <DagChatPanel
          segment={segment}
          provider={provider}
          dagSpec={dagSpec}
          history={session.chat}
          keys={keys}
          product={product}
          objective={objective}
          onSend={onChatSend}
          onAddNode={onChatAddNode}
        />
      )}
    </div>
  )
}
