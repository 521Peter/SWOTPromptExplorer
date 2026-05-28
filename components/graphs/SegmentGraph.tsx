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
import { SegmentNode, type SegmentNodeData } from './SegmentNode'
import { getRadialPosition } from '@/lib/graph-utils'
import type { Provider } from '@/lib/langgraph/providers'
import type { SegmentSession } from '@/lib/types'

const nodeTypes = { segmentNode: SegmentNode }

interface Props {
  segments: string[]
  provider: Provider
  getSession: (segment: string, provider: Provider) => SegmentSession
  onSegmentClick: (segment: string) => void
}

export function SegmentGraph({ segments, provider, getSession, onSegmentClick }: Props) {
  const nodes: Node[] = useMemo(
    () =>
      segments.map((seg, i) => {
        const session = getSession(seg, provider)
        return {
          id: seg,
          type: 'segmentNode',
          position: getRadialPosition(i, segments.length),
          data: {
            label: seg,
            status: session.status,
            provider,
            error: session.error,
          } satisfies SegmentNodeData,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, provider, getSession]
  )

  // Edges: connect adjacent segments to show relationships
  const edges: Edge[] = useMemo(
    () =>
      segments.slice(0, -1).map((seg, i) => ({
        id: `edge-${i}`,
        source: seg,
        target: segments[i + 1],
        style: { stroke: '#2E2E42', strokeWidth: 1, strokeDasharray: '4 5' },
        type: 'straight',
      })),
    [segments]
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const session = getSession(node.id, provider)
      if (session.status === 'ready') onSegmentClick(node.id)
    },
    [getSession, provider, onSegmentClick]
  )

  if (segments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <p style={{ color: '#5A5A6C', fontSize: 13 }}>
          Add segments in the sidebar and run analysis to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 relative" style={{ background: '#0A0A0F' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
        <Controls
          style={{ background: '#13131A', border: '0.5px solid #1E1E2E' }}
        />
        <MiniMap
          style={{ background: '#13131A', border: '0.5px solid #1E1E2E' }}
          nodeColor="#534AB7"
          maskColor="rgba(10,10,15,0.7)"
        />
      </ReactFlow>

      {/* Bottom hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px',
          background: 'rgba(19,19,26,0.85)',
          border: '0.5px solid #1E1E2E',
          borderRadius: 999,
          color: '#5A5A6C',
          fontSize: 11.5,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#534AB7', display: 'inline-block' }} />
        Click any ready segment to explore its insights
      </div>
    </div>
  )
}
