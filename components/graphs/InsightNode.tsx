'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface InsightNodeData {
  promptKey: string
  label: string
  color: string
  icon: LucideIcon
  status: 'idle' | 'loading' | 'ready' | 'error'
  content: string | null
  stale?: boolean
  [key: string]: unknown
}

function InsightNodeComponent({ data, selected }: NodeProps) {
  const d = data as InsightNodeData
  const Icon = d.icon

  return (
    <div
      title={d.stale ? 'Run with updated inputs' : undefined}
      style={{
        width: 180,
        background: '#13131A',
        border: `1px solid ${d.stale ? '#F59E0B' : selected ? d.color : `${d.color}70`}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: d.status === 'ready' || d.stale ? 'pointer' : 'default',
        boxShadow: d.stale ? '0 0 0 3px #F59E0B22' : selected ? `0 0 0 3px ${d.color}30` : d.status === 'ready' ? `0 0 8px 0 ${d.color}18` : 'none',
        opacity: d.status === 'idle' ? 0.7 : 1,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.3s ease, background 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, color: d.color }}>
        {d.status === 'loading' ? (
          <span
            className="animate-pulse inline-block w-4 h-4 rounded-full"
            style={{ background: d.color }}
          />
        ) : (
          <Icon size={16} />
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#E6E6EC',
          lineHeight: 1.3,
          flex: 1,
        }}
      >
        {d.label}
      </span>

      {/* Stale badge */}
      {d.stale ? (
        <span style={{ color: '#F59E0B', flexShrink: 0, display: 'flex' }}>
          <AlertTriangle size={13} />
        </span>
      ) : d.status === 'ready' ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10B981',
            flexShrink: 0,
          }}
        />
      ) : null}

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

export const InsightNode = memo(InsightNodeComponent)
