'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { tokens } from '@/lib/tokens'
import type { Provider } from '@/lib/langgraph/providers'

export interface SegmentNodeData {
  label: string
  status: 'idle' | 'planning' | 'loading' | 'ready' | 'error'
  provider: Provider
  error?: string
  animIndex?: number
  [key: string]: unknown
}

function SegmentNodeComponent({ data, selected }: NodeProps) {
  const d = data as SegmentNodeData
  const providerColor = tokens.providers[d.provider as keyof typeof tokens.providers] ?? '#7A7A8C'

  const borderColor =
    d.status === 'ready'    ? providerColor :
    d.status === 'loading'  ? providerColor :
    d.status === 'planning' ? '#8B5CF6' :
    d.status === 'error'    ? '#EF4444' :
    '#262633'

  const borderWidth = d.status === 'idle' ? 0.5 : 1.5

  const statusText =
    d.status === 'ready'    ? 'Ready' :
    d.status === 'loading'  ? 'Analyzing' :
    d.status === 'planning' ? 'Planning' :
    d.status === 'error'    ? 'Error' :
    'Idle'

  const statusColor =
    d.status === 'ready'    ? '#10B981' :
    d.status === 'loading'  ? '#F59E0B' :
    d.status === 'planning' ? '#8B5CF6' :
    d.status === 'error'    ? '#EF4444' :
    '#5A5A6C'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.32, delay: (d.animIndex ?? 0) * 0.07, ease: 'easeOut' }}
    >
    <div
      style={{
        minWidth: 160,
        maxWidth: 280,
        width: 'max-content',
        background: '#13131A',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow:
          d.status === 'ready'
            ? `0 0 12px 0 ${providerColor}20, 0 0 0 4px ${providerColor}10`
            : selected
            ? '0 0 0 2px #534AB7'
            : 'none',
        opacity: d.status === 'idle' ? 0.65 : 1,
        cursor: d.status === 'ready' ? 'pointer' : 'default',
        position: 'relative',
        transition: 'border-color 0.25s ease, box-shadow 0.3s ease, opacity 0.3s ease',
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
        {(d.status === 'loading' || d.status === 'planning') && (
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
    </motion.div>
  )
}

export const SegmentNode = memo(SegmentNodeComponent)
