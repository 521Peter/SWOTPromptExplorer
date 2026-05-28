'use client'

import { useState } from 'react'
import { Plus, X, Play } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { ProviderSelector } from './ProviderSelector'
import { loadKeys } from '@/lib/settings/keys'
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
  }) => void
  isRunning: boolean
}

export function Sidebar({ onRun, isRunning }: Props) {
  const [product, setProduct] = useState('')
  const [objective, setObjective] = useState('')
  const [segments, setSegments] = useState<string[]>([])
  const [segmentInput, setSegmentInput] = useState('')
  const [provider, setProvider] = useState<Provider>('claude')
  const [openrouterModel, setOpenrouterModel] = useState('mistralai/mistral-7b-instruct')

  const keys = loadKeys()

  const canRun =
    product.trim() &&
    objective.trim() &&
    segments.length > 0 &&
    !isRunning

  const hasKeyForProvider = !!keys[
    provider === 'claude' ? 'anthropic'
    : provider === 'openai' ? 'openai'
    : provider === 'groq' ? 'groq'
    : 'openrouter'
  ]

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
    if (!canRun || !hasKeyForProvider) return
    onRun({ product, objective, segments, provider, keys, openrouterModel })
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full"
      style={{
        width: 232,
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
        <SettingsPanel />
      </div>

      {/* Form body */}
      <div className="flex flex-col gap-5 p-4 flex-1 overflow-y-auto">
        {/* Product */}
        <SidebarSection label="Product">
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Electric Cars"
            className="w-full px-3 rounded-lg outline-none placeholder-[#3A3A4C] transition-colors"
            style={{
              height: 34,
              background: '#0D0D14',
              border: '1px solid #252535',
              color: '#E6E6EC',
              fontSize: 13,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#534AB7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#252535')}
          />
        </SidebarSection>

        {/* Objective */}
        <SidebarSection label="Objective">
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Increase Awareness"
            className="w-full px-3 rounded-lg outline-none placeholder-[#3A3A4C] transition-colors"
            style={{
              height: 34,
              background: '#0D0D14',
              border: '1px solid #252535',
              color: '#E6E6EC',
              fontSize: 13,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#534AB7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#252535')}
          />
        </SidebarSection>

        {/* Provider */}
        <SidebarSection label="Provider">
          <ProviderSelector
            activeProvider={provider}
            keys={keys}
            openrouterModel={openrouterModel}
            onProviderChange={setProvider}
            onModelChange={setOpenrouterModel}
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
        {!hasKeyForProvider ? (
          <p className="text-center" style={{ color: '#5A5A6C', fontSize: 12 }}>
            Open Settings to add an API key
          </p>
        ) : (
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full flex items-center justify-center gap-2 rounded-lg font-medium text-white transition-all disabled:opacity-35 hover:brightness-110 active:scale-[0.98]"
            style={{
              height: 36,
              background: 'linear-gradient(135deg, #534AB7, #6B62D1)',
              border: '1px solid #7B6FE0',
              fontSize: 13,
              letterSpacing: '0.01em',
            }}
          >
            <Play size={12} fill="white" stroke="white" strokeWidth={0} />
            Run analysis
          </button>
        )}
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
