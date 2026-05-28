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
        width: 220,
        background: '#13131A',
        borderRight: '0.5px solid #1E1E2E',
        color: '#E6E6EC',
        fontSize: 13,
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '0.5px solid #1E1E2E' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center text-white text-xs font-semibold"
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: 'linear-gradient(135deg, #534AB7, #6B62D1)',
            }}
          >
            S
          </div>
          <span className="text-sm font-medium tracking-tight">
            swot<span style={{ color: '#7A7A8C' }}>explorer</span>
          </span>
        </div>
        <SettingsPanel />
      </div>

      {/* Form body */}
      <div className="flex flex-col gap-4 p-3 flex-1 overflow-y-auto">
        {/* Product */}
        <SidebarSection label="Product">
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Electric Cars"
            className="w-full h-8 px-3 rounded-lg text-xs outline-none"
            style={{
              background: '#17171F',
              border: '0.5px solid #1E1E2E',
              color: '#E6E6EC',
            }}
          />
        </SidebarSection>

        {/* Objective */}
        <SidebarSection label="Objective">
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Increase Awareness"
            className="w-full h-8 px-3 rounded-lg text-xs outline-none"
            style={{
              background: '#17171F',
              border: '0.5px solid #1E1E2E',
              color: '#E6E6EC',
            }}
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
              <div className="flex items-center gap-1 mt-1">
                <input
                  value={segmentInput}
                  onChange={(e) => setSegmentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add segment…"
                  className="flex-1 h-7 px-2 rounded-md text-xs outline-none"
                  style={{
                    background: '#17171F',
                    border: '0.5px solid #1E1E2E',
                    color: '#E6E6EC',
                  }}
                />
                <button
                  onClick={addSegment}
                  className="flex items-center justify-center h-7 w-7 rounded-md transition-colors"
                  style={{ background: '#17171F', border: '0.5px solid #1E1E2E' }}
                >
                  <Plus size={11} color="#7A7A8C" />
                </button>
              </div>
            )}
          </div>
        </SidebarSection>
      </div>

      {/* Run CTA */}
      <div className="p-3" style={{ borderTop: '0.5px solid #1E1E2E' }}>
        {!hasKeyForProvider ? (
          <p className="text-center text-xs" style={{ color: '#7A7A8C' }}>
            ⚙ Add a key in Settings to get started
          </p>
        ) : (
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-40"
            style={{
              background: '#534AB7',
              border: '0.5px solid #6B62D1',
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
        className="mb-1.5 px-0.5"
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: '#5A5A6C',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
