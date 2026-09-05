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
import { Sparkles, Globe } from 'lucide-react'
import { InsightNode, type InsightNodeData } from './InsightNode'
import { ProductNode } from './ProductNode'
import { SegmentNode, type SegmentNodeData } from './SegmentNode'
import { buildInsightElements, getLayoutedInsightElements } from '@/lib/graph-utils'
import type { Provider } from '@/lib/langgraph/providers'
import type { DagSpec, SegmentSession } from '@/lib/types'
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
  keys?: Partial<ApiKeys>
  onRunPersona?: () => void
  personaActive?: boolean
}

export function InsightDAG({ product, objective, segment, provider, session, dagSpec, selectedNode, onNodeClick, onRerunNode, keys = {}, onRunPersona, personaActive }: Props) {

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges] = useEdgesState<Edge>([])

  // 仅在 dagSpec 变化时重建布局（在会话更新之间保留拖拽后的位置）
  useEffect(() => {
    if (!dagSpec) { setNodes([]); setEdges([]); return }

    const { nodes: insightNodes, edges: insightEdges } = buildInsightElements(segment, dagSpec)

    const productNode: Node = {
      id: PRODUCT_ID, type: 'productNode', position: { x: 0, y: 0 },
      data: { label: product || '产品', objective }, selectable: false,
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

  // 会话变化时只更新数据字段，绝不改动位置
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

  // 更新选中状态，但不改动位置
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
    <div className="h-full flex flex-col" style={{ background: '#0A0A0F', position: 'relative' }}>
      {/* 规划遮罩层：/api/plan 请求进行中时显示 */}
      {session.status === 'planning' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <Sparkles size={20} style={{ color: '#8B5CF6' }} className="animate-pulse" />
          <p style={{ color: '#C4B5FD', fontSize: 13, fontWeight: 500 }}>正在规划分析…</p>
          <p style={{ color: '#5A5A6C', fontSize: 11 }}>大语言模型正在为该客户群体设计专属分析图谱</p>
        </div>
      )}

      {/* 浮动的地区匹配度胶囊标签 */}
      {session.status === 'ready' && onRunPersona && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button
            onClick={onRunPersona}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: personaActive ? 'rgba(16,185,129,0.14)' : 'rgba(10,10,16,0.88)',
              border: `1px solid ${personaActive ? '#10B981' : '#2A2A3C'}`,
              borderRadius: 20, cursor: 'pointer',
              color: personaActive ? '#34D399' : '#6E6E8A',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              padding: '6px 16px', backdropFilter: 'blur(10px)',
              boxShadow: personaActive ? '0 0 14px rgba(16,185,129,0.18)' : '0 2px 10px rgba(0,0,0,0.5)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = personaActive ? '#6EE7B7' : '#C0C0CC'
              e.currentTarget.style.borderColor = personaActive ? '#10B981' : '#534AB7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = personaActive ? '#34D399' : '#6E6E8A'
              e.currentTarget.style.borderColor = personaActive ? '#10B981' : '#2A2A3C'
            }}
          >
            <Globe size={11} />
            {personaActive ? '区域契合度 ●' : '区域契合度'}
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
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
    </div>
  )
}
