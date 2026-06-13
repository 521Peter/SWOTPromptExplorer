'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Globe, X } from 'lucide-react'
import type { RegionResult } from '@/hooks/usePersona'

interface Props {
  region: RegionResult
  onClose: () => void
}

export function RegionDetailPanel({ region, onClose }: Props) {
  const fitLabel =
    region.pct >= 76 ? 'Strong fit' :
    region.pct >= 51 ? 'Moderate fit' :
    region.pct >= 26 ? 'Weak fit' : 'Poor fit'

  const fitColor =
    region.pct >= 76 ? '#10B981' :
    region.pct >= 51 ? '#F59E0B' :
    region.pct >= 26 ? '#F97316' : '#EF4444'

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0A0A0F', borderLeft: '1px solid #1E1E2E',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid #1E1E2E', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Globe size={11} style={{ color: region.color }} />
          <span style={{ color: region.color, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {region.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: region.color, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {region.pct}%
          </span>
          <button
            onClick={onClose}
            style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '14px' }}>

          {/* Score bar */}
          <div style={{ height: 2, background: '#1E1E2E', borderRadius: 2, marginBottom: 6 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${region.pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: region.color, borderRadius: 2 }}
            />
          </div>

          {/* Fit label */}
          <span style={{
            color: fitColor, fontSize: 9, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 16,
            fontWeight: 600,
          }}>
            {fitLabel}
          </span>

          {/* Explanation */}
          {region.explanation ? (
            <div style={{
              background: '#0D0D16', border: '0.5px solid #1E1E2E',
              borderRadius: 6, padding: '10px 12px', marginBottom: 18,
            }}>
              <div style={{
                color: '#6A6A8A', fontSize: 9, fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
              }}>
                Market overview
              </div>
              <p style={{ color: '#C4C4D8', fontSize: 12, lineHeight: 1.65, margin: 0 }}>
                {region.explanation}
              </p>
            </div>
          ) : null}

          {/* Key factors */}
          <div style={{
            color: '#6A6A8A', fontSize: 9, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
          }}>
            Key factors
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {region.reasons.map((reason, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <ChevronRight size={11} style={{ color: region.color, flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: '#B8B8CC', fontSize: 12, lineHeight: 1.55 }}>{reason}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
