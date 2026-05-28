'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface ProductNodeData {
  label: string
  objective: string
  [key: string]: unknown
}

function ProductNodeComponent({ data }: NodeProps) {
  const d = data as ProductNodeData

  return (
    <div
      style={{
        width: 200,
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16162A 100%)',
        border: '1.5px solid #534AB7',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 0 0 4px #534AB715, 0 8px 32px rgba(83,74,183,0.15)',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(83,74,183,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#E6E6EC',
          letterSpacing: -0.3,
          lineHeight: 1.2,
        }}
      >
        {d.label}
      </div>

      {/* Objective pill */}
      {d.objective && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(83,74,183,0.15)',
            border: '0.5px solid #534AB750',
            color: '#8B82E8',
            fontSize: 10,
            fontWeight: 500,
            width: 'fit-content',
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7B6FE0', flexShrink: 0 }} />
          {d.objective}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

export const ProductNode = memo(ProductNodeComponent)
