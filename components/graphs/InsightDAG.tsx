'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft } from 'lucide-react'
import { InsightNode, type InsightNodeData } from './InsightNode'
import { buildInsightElements } from '@/lib/graph-utils'
import { PROMPT_CONFIG } from '@/constants/prompt-config'
import type { PromptType, SegmentSession } from '@/lib/types'

const nodeTypes = { insightNode: InsightNode }

interface Props {
  segment: string
  session: SegmentSession
  selectedNode: string | null
  onNodeClick: (promptKey: PromptType) => void
  onBack: () => void
}

export function InsightDAG({ segment, session, selectedNode, onNodeClick, onBack }: Props) {
  const { nodes: baseNodes, edges } = useMemo(
    () => buildInsightElements(segment),
    [segment]
  )

  // Merge live session status + content into nodes
  const nodes: Node[] = useMemo(
    () =>
      baseNodes.map((n) => {
        const promptKey = (n.data as InsightNodeData).promptKey
        const content = session.insights?.[promptKey] ?? null
        const status = session.status === 'ready' ? 'ready'
          : session.status === 'loading' ? 'loading'
          : 'idle'
        return {
          ...n,
          selected: selectedNode === promptKey,
          data: { ...n.data, status, content } as InsightNodeData,
        }
      }),
    [baseNodes, session, selectedNode]
  )

  // Enrich edges with dashed styles from tokens (already set in buildInsightElements)
  const styledEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        labelStyle: { fill: '#7A7A8C', fontSize: 10 },
        labelBgStyle: { fill: '#0A0A0F', padding: 2 },
      })),
    [edges]
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const promptKey = (node.data as InsightNodeData).promptKey
      if (session.status === 'ready') onNodeClick(promptKey)
    },
    [session.status, onNodeClick]
  )

  void PROMPT_CONFIG // ensure import not tree-shaken

  return (
    <div className="flex-1 relative" style={{ background: '#0A0A0F' }}>
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
        {segment}
      </button>

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        style={{ background: '#0A0A0F' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.04)"
          gap={24}
          size={1}
        />
        <Controls style={{ background: '#13131A', border: '0.5px solid #1E1E2E' }} />
        <MiniMap
          style={{ background: '#13131A', border: '0.5px solid #1E1E2E' }}
          nodeColor="#534AB7"
          maskColor="rgba(10,10,15,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
