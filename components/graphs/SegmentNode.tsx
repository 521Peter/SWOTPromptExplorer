'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { tokens } from '@/lib/tokens'
import type { Provider } from '@/lib/langgraph/providers'

export interface SegmentNodeData {
  label: string
  status: 'idle' | 'loading' | 'ready' | 'error'
  provider: Provider
  error?: string
  [key: string]: unknown
}

function SegmentNodeComponent({ data, selected }: NodeProps) {
  const d = data as SegmentNodeData
  const providerColor = tokens.providers[d.provider as keyof typeof tokens.providers] ?? '#7A7A8C'

  const borderColor =
    d.status === 'ready'   ? providerColor :
    d.status === 'loading' ? providerColor :
    d.status === 'error'   ? '#EF4444' :
    '#262633'

  const borderWidth = d.status === 'idle' ? 0.5 : 1.5

  const statusText =
    d.status === 'ready'   ? 'Ready' :
    d.status === 'loading' ? 'Analyzing' :
    d.status === 'error'   ? 'Error' :
    'Idle'

  const statusColor =
    d.status === 'ready'   ? '#10B981' :
    d.status === 'loading' ? '#F59E0B' :
    d.status === 'error'   ? '#EF4444' :
    '#5A5A6C'

  return (
    <div
      style={{
        width: 220,
        background: '#13131A',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow:
          d.status === 'ready'
            ? `0 0 0 4px ${providerColor}10`
            : selected
            ? '0 0 0 2px #534AB7'
            : 'none',
        cursor: d.status === 'ready' ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      {/* Row 1: label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13.5,
          fontWeight: 500,
          color: '#E6E6EC',
          letterSpacing: -0.1,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: d.status === 'idle' ? '#5A5A6C' : providerColor,
            flexShrink: 0,
          }}
        />
        {d.label}
      </div>

      {/* Row 2: status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {d.status === 'loading' && (
          <span
            className="animate-spin"
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: `2px solid ${providerColor}30`,
              borderTopColor: providerColor,
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ fontSize: 10, fontWeight: 500, color: statusColor, letterSpacing: 0.2, textTransform: 'uppercase' }}>
          {statusText}
        </span>
      </div>


      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

export const SegmentNode = memo(SegmentNodeComponent)
