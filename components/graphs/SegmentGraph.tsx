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
import { SegmentNode, type SegmentNodeData } from './SegmentNode'
import { ProductNode, type ProductNodeData } from './ProductNode'
import { getRadialPosition, PRODUCT_NODE_POSITION } from '@/lib/graph-utils'
import type { Provider } from '@/lib/langgraph/providers'
import type { SegmentSession } from '@/lib/types'

const PRODUCT_ID = '__product__'
const nodeTypes = { segmentNode: SegmentNode, productNode: ProductNode }

interface Props {
  product: string
  objective: string
  segments: string[]
  provider: Provider
  getSession: (segment: string, provider: Provider) => SegmentSession
  tick: number
  onSegmentClick: (segment: string) => void
}

export function SegmentGraph({ product, objective, segments, provider, getSession, tick, onSegmentClick }: Props) {
  const nodes: Node[] = useMemo(() => {
    const productNode: Node = {
      id: PRODUCT_ID,
      type: 'productNode',
      position: PRODUCT_NODE_POSITION,
      data: { label: product || 'Product', objective } satisfies ProductNodeData,
    }

    const segmentNodes = segments.map((seg, i) => {
      const session = getSession(seg, provider)
      return {
        id: seg,
        type: 'segmentNode',
        position: getRadialPosition(i, segments.length),
        data: {
          label: seg,
          status: session.status === 'planning' ? 'planning' : session.status,
          provider,
          error: session.error,
        } satisfies SegmentNodeData,
      }
    })

    return [productNode, ...segmentNodes]
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [product, objective, segments, provider, getSession, tick])

  // Hub-and-spoke: product node connects to each segment
  const edges: Edge[] = useMemo(
    () =>
      segments.map((seg, i) => ({
        id: `edge-${i}`,
        source: PRODUCT_ID,
        target: seg,
        type: 'smoothstep',
        style: { stroke: '#5A5A7A', strokeWidth: 1.5, strokeDasharray: '5 4' },
      })),
    [segments]
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.id === PRODUCT_ID) return
      const session = getSession(node.id, provider)
      if (session.status === 'ready') onSegmentClick(node.id)
    },
    [getSession, provider, onSegmentClick]
  )

  if (segments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <p style={{ color: '#5A5A6C', fontSize: 13 }}>
          Add segments in the sidebar and run analysis to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full relative" style={{ background: '#0A0A0F' }}>
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
        defaultEdgeOptions={{ type: 'smoothstep' }}
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
