'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Play, RotateCcw } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { loadKeys, loadProvider, saveProvider } from '@/lib/settings/keys'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

interface Props {
  onRun: (config: {
    product: string
    objective: string
    segments: string[]
    provider: Provider
    keys: Partial<ApiKeys>
    openrouterModel: string
    force?: boolean
  }) => void
  onProviderInit: (p: Provider) => void
  isRunning: boolean
}

export function Sidebar({ onRun, onProviderInit, isRunning }: Props) {
  const [product, setProduct] = useState('')
  const [objective, setObjective] = useState('')
  const [segments, setSegments] = useState<string[]>([])
  const [segmentInput, setSegmentInput] = useState('')
  const [provider, setProvider] = useState<Provider>('openrouter')
  const [hasRun, setHasRun] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const lastRun = useRef<{ product: string; objective: string; segments: string[] } | null>(null)

  useEffect(() => {
    const saved = loadProvider()
    setProvider(saved)
    onProviderInit(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mark dirty whenever form changes after a run
  useEffect(() => {
    if (!lastRun.current) return
    const snap = lastRun.current
    const dirty =
      product.trim() !== snap.product ||
      objective.trim() !== snap.objective ||
      segments.join(',') !== snap.segments.join(',')
    setIsDirty(dirty)
  }, [product, objective, segments])

  const canRun =
    product.trim() &&
    objective.trim() &&
    segments.length > 0 &&
    !isRunning

  function addSegment() {
    const trimmed = segmentInput.trim()
    if (!trimmed || segments.includes(trimmed) || segments.length >= 6) return
    setSegments((prev) => [...prev, trimmed])
    setSegmentInput('')
  }

  function removeSegment(name: string) {
    setSegments((prev) => prev.filter((s) => s !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addSegment()
  }

  function handleRun() {
    if (!canRun) return
    const keys = loadKeys()
    lastRun.current = { product: product.trim(), objective: objective.trim(), segments: [...segments] }
    const force = hasRun
    setHasRun(true)
    setIsDirty(false)
    onRun({ product, objective, segments, provider, keys, openrouterModel: keys.openrouterModel ?? 'openai/gpt-4o-mini', force })
  }

  return (
    <aside
      className="flex flex-col h-full w-full"
      style={{
        background: '#13131A',
        borderRight: '1px solid #1E1E2E',
        color: '#E6E6EC',
        fontSize: 13,
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid #1E1E2E', height: 48, flexShrink: 0 }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center text-white font-bold"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #534AB7, #7B6FE0)',
              fontSize: 11,
              letterSpacing: '-0.5px',
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.2px', color: '#D0D0DC' }}>
            swot<span style={{ color: '#555567', fontWeight: 400 }}>explorer</span>
          </span>
        </div>
        <SettingsPanel
          provider={provider}
          onProviderChange={(p) => { setProvider(p); saveProvider(p) }}
        />
      </div>

      {/* Form body */}
      <div className="flex flex-col gap-5 p-4 flex-1 overflow-y-auto">
        {/* Product */}
        <SidebarSection label="Product">
          <textarea
            value={product}
            onChange={(e) => { setProduct(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="e.g. Electric Cars"
            rows={1}
            className="w-full px-3 py-2 rounded-lg outline-none placeholder-[#3A3A4C] transition-colors resize-none overflow-hidden"
            style={{
              background: '#0D0D14',
              border: '1px solid #252535',
              color: '#E6E6EC',
              fontSize: 13,
              lineHeight: '1.5',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#534AB7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#252535')}
          />
        </SidebarSection>

        {/* Objective */}
        <SidebarSection label="Objective">
          <textarea
            value={objective}
            onChange={(e) => { setObjective(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="e.g. Increase Awareness"
            rows={1}
            className="w-full px-3 py-2 rounded-lg outline-none placeholder-[#3A3A4C] transition-colors resize-none overflow-hidden"
            style={{
              background: '#0D0D14',
              border: '1px solid #252535',
              color: '#E6E6EC',
              fontSize: 13,
              lineHeight: '1.5',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#534AB7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#252535')}
          />
        </SidebarSection>

        {/* Segments */}
        <SidebarSection label="Segments">
          <div className="flex flex-col gap-1">
            {segments.map((seg) => (
              <div
                key={seg}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                style={{ fontSize: 12 }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#7A7A8C' }}
                />
                <span className="flex-1 truncate" style={{ color: '#E6E6EC' }}>{seg}</span>
                <button
                  onClick={() => removeSegment(seg)}
                  className="text-[#5A5A6C] hover:text-[#E6E6EC] transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            {/* Add segment input */}
            {segments.length < 6 && (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  value={segmentInput}
                  onChange={(e) => setSegmentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add segment…"
                  className="flex-1 px-2.5 rounded-md outline-none placeholder-[#3A3A4C]"
                  style={{
                    height: 30,
                    background: '#0D0D14',
                    border: '1px solid #252535',
                    color: '#E6E6EC',
                    fontSize: 12,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#534AB7')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#252535')}
                />
                <button
                  onClick={addSegment}
                  className="flex items-center justify-center rounded-md transition-colors hover:bg-[#1B1B26]"
                  style={{
                    width: 30,
                    height: 30,
                    background: '#0D0D14',
                    border: '1px solid #252535',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={12} color="#6B6B80" />
                </button>
              </div>
            )}
          </div>
        </SidebarSection>
      </div>

      {/* Run CTA */}
      <div className="p-4" style={{ borderTop: '1px solid #1E1E2E' }}>
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="w-full flex items-center justify-center gap-2 rounded-lg font-medium text-white transition-all disabled:opacity-35 hover:brightness-110 active:scale-[0.98]"
          style={{
            height: 36,
            background: isDirty
              ? 'linear-gradient(135deg, #92400E, #B45309)'
              : 'linear-gradient(135deg, #534AB7, #6B62D1)',
            border: isDirty ? '1px solid #D97706' : '1px solid #7B6FE0',
            fontSize: 13,
            letterSpacing: '0.01em',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {hasRun && !isRunning ? (
            <>
              <RotateCcw size={12} />
              {isDirty ? 'Re-run with changes' : 'Re-run analysis'}
            </>
          ) : (
            <>
              <Play size={12} fill="white" stroke="white" strokeWidth={0} />
              Run analysis
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="mb-2"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6B6B80',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
