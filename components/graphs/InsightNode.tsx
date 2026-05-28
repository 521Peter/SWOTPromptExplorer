'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'
import type { PromptType } from '@/lib/types'

export interface InsightNodeData {
  promptKey: PromptType
  label: string
  color: string
  icon: LucideIcon
  status: 'idle' | 'loading' | 'ready' | 'error'
  content: string | null
  [key: string]: unknown
}

function InsightNodeComponent({ data, selected }: NodeProps) {
  const d = data as InsightNodeData
  const Icon = d.icon

  return (
    <div
      style={{
        width: 180,
        background: '#13131A',
        border: `0.5px solid ${selected ? d.color : `${d.color}33`}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: d.status === 'ready' ? 'pointer' : 'default',
        boxShadow: selected ? `0 0 0 3px ${d.color}14` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
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

      {/* Ready dot */}
      {d.status === 'ready' && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10B981',
            flexShrink: 0,
          }}
        />
      )}

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

export const InsightNode = memo(InsightNodeComponent)
