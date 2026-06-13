'use client'

import { ArrowLeft, GitCompare } from 'lucide-react'
import type { Provider } from '@/lib/langgraph/providers'

interface Props {
  product: string
  segment: string
  provider: Provider
  onBack: () => void
  availableProviders: Provider[]
  isComparing: boolean
  onCompare: () => void
}

export function InsightNavbar({
  product, segment, onBack,
  availableProviders, isComparing, onCompare,
}: Props) {
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    borderRadius: 5, cursor: 'pointer',
    fontSize: 11, fontFamily: 'var(--font-mono)',
    padding: '3px 9px', transition: 'all 0.15s',
    border: '1px solid #1E1E2E',
    background: 'none', color: '#5A5A6C',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 14px', height: 38, flexShrink: 0,
      background: '#080810', borderBottom: '1px solid #1E1E2E',
    }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ ...btnBase, border: 'none', padding: '3px 6px', color: '#4A4A5E', fontSize: 12 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6EC')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#4A4A5E')}
      >
        <ArrowLeft size={12} />
        Back
      </button>

      <div style={{ width: 1, height: 16, background: '#1C1C2A', flexShrink: 0 }} />

      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, overflow: 'hidden' }}>
        <span style={{ color: '#6A6A88', fontSize: 11, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product || 'Product'}
        </span>
        <span style={{ color: '#3E3E55', fontSize: 13, flexShrink: 0 }}>›</span>
        <span style={{ color: '#C0C0DC', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {segment}
        </span>
      </div>

      {/* Compare */}
      {availableProviders.length > 1 && (
        <button
          onClick={onCompare}
          style={{
            ...btnBase,
            background: isComparing ? 'rgba(83,74,183,0.15)' : 'none',
            border: `1px solid ${isComparing ? '#534AB7' : '#1E1E2E'}`,
            color: isComparing ? '#9D94F0' : '#5A5A6C',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = isComparing ? '#C4BFFF' : '#AAA'; e.currentTarget.style.borderColor = '#534AB7' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isComparing ? '#9D94F0' : '#5A5A6C'; e.currentTarget.style.borderColor = isComparing ? '#534AB7' : '#1E1E2E' }}
        >
          <GitCompare size={11} />
          Compare
        </button>
      )}
    </div>
  )
}
