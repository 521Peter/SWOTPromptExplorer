'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, X, Check, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { saveKeys, loadKeys, clearKeys, saveProvider } from '@/lib/settings/keys'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'
import { OPENROUTER_MODELS } from '@/constants/openrouter-models'

const PROVIDERS: {
  id: Provider
  keyId: keyof Pick<ApiKeys, 'anthropic' | 'openai' | 'groq' | 'openrouter'>
  label: string
  badge: string
  placeholder: string
  color: string
}[] = [
  { id: 'openrouter', keyId: 'openrouter', label: 'OpenRouter', badge: 'Multi-model', placeholder: 'sk-or-...',  color: '#8B5CF6' },
  { id: 'claude',     keyId: 'anthropic',  label: 'Anthropic',  badge: 'Claude',      placeholder: 'sk-ant-...', color: '#D97757' },
  { id: 'openai',     keyId: 'openai',     label: 'OpenAI',     badge: 'GPT-4o',      placeholder: 'sk-...',     color: '#19C37D' },
  { id: 'groq',       keyId: 'groq',       label: 'Groq',       badge: 'Llama',       placeholder: 'gsk_...',    color: '#F97316' },
]


interface Props {
  provider: Provider
  openrouterModel: string
  onProviderChange: (p: Provider) => void
  onModelChange: (m: string) => void
}

export function SettingsPanel({ provider, openrouterModel, onProviderChange, onModelChange }: Props) {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState<Partial<ApiKeys>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { setKeys(loadKeys()) }, [])
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  function handleSave() {
    saveKeys({ ...keys, openrouterModel })
    saveProvider(provider)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function handleClear() {
    clearKeys()
    setKeys({})
  }

  function toggleVisible(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function selectProvider(p: Provider) {
    const keyId = PROVIDERS.find((x) => x.id === p)?.keyId
    if (!keyId || !keys[keyId]) return
    onProviderChange(p)
    saveProvider(p)
  }

  return (
    <>
      {/* Gear trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Settings"
        className="inline-flex items-center justify-center rounded-md transition-colors"
        style={{ width: 28, height: 28, color: '#6B6B80', background: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#C0C0CC'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6B6B80'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <Settings size={14} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 z-50 h-full flex flex-col"
        style={{
          width: 360,
          background: '#111118',
          borderLeft: '1px solid #252535',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5"
          style={{ height: 56, borderBottom: '1px solid #1E1E2E', flexShrink: 0 }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#D0D0DC', letterSpacing: '-0.2px' }}>
              Settings
            </div>
            <div style={{ fontSize: 11, color: '#5A5A6C', marginTop: 1 }}>
              Keys stored in browser only
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 28, height: 28, color: '#6B6B80', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#C0C0CC'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6B6B80'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          <p style={{ fontSize: 12, color: '#5A5A6C', lineHeight: 1.6, marginBottom: 12 }}>
            Select a provider and add its API key. Keys go directly to the provider — never logged or stored server-side.
          </p>

          {PROVIDERS.map((p) => {
            const hasKey = !!keys[p.keyId]
            const isActive = provider === p.id
            const isVisible = !!visible[p.id]

            return (
              <div
                key={p.id}
                className="flex flex-col rounded-xl mb-2"
                style={{
                  border: `1px solid ${isActive ? p.color + '40' : '#1E1E2E'}`,
                  background: isActive ? p.color + '08' : 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Provider row */}
                <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                  {/* Color dot */}
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{ width: 8, height: 8, background: hasKey ? p.color : '#333345' }}
                  />

                  {/* Label + badge */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span style={{ fontWeight: 600, fontSize: 12, color: isActive ? '#D0D0DC' : '#7A7A8C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#3A3A4C' }}>{p.badge}</span>
                  </div>

                  {/* Status + toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasKey ? (
                      <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#22C55E' }}>
                        <Check size={10} />
                        Connected
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#3A3A4C' }}>No key</span>
                    )}

                    {/* Select toggle */}
                    <button
                      onClick={() => selectProvider(p.id)}
                      disabled={!hasKey}
                      title={!hasKey ? 'Add a key first' : isActive ? 'Active provider' : 'Use this provider'}
                      className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                      style={{
                        width: 18,
                        height: 18,
                        border: `2px solid ${isActive ? p.color : (hasKey ? '#3A3A4C' : '#252535')}`,
                        background: isActive ? p.color : 'transparent',
                        cursor: hasKey ? 'pointer' : 'default',
                        opacity: hasKey ? 1 : 0.3,
                      }}
                    >
                      {isActive && (
                        <span
                          className="inline-block rounded-full"
                          style={{ width: 6, height: 6, background: '#fff' }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Key input */}
                <div className="relative flex items-center px-3 pb-3">
                  <input
                    id={p.id}
                    type={isVisible ? 'text' : 'password'}
                    placeholder={p.placeholder}
                    value={keys[p.keyId] ?? ''}
                    onChange={(e) =>
                      setKeys((prev) => ({ ...prev, [p.keyId]: e.target.value }))
                    }
                    className="w-full pr-9 pl-3 rounded-lg outline-none placeholder-[#2A2A3C] font-mono"
                    style={{
                      height: 34,
                      background: '#0A0A12',
                      border: `1px solid ${hasKey ? p.color + '35' : '#1E1E2E'}`,
                      color: '#C0C0CC',
                      fontSize: 12,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = p.color + '70')}
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = hasKey ? p.color + '35' : '#1E1E2E')
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisible(p.id)}
                    className="absolute right-5 flex items-center justify-center"
                    style={{ color: '#333345', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#8A8A9A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#333345')}
                  >
                    {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* OpenRouter model picker — only when this row is active */}
                {p.id === 'openrouter' && isActive && (
                  <div className="relative px-3 pb-3">
                    <div style={{ fontSize: 11, color: '#5A5A6C', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Model
                    </div>
                    <div className="relative">
                      <select
                        value={openrouterModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full pl-3 pr-8 rounded-lg appearance-none outline-none"
                        style={{
                          height: 34,
                          background: '#0A0A12',
                          border: '1px solid #8B5CF640',
                          color: '#C0C0CC',
                          fontSize: 12,
                        }}
                      >
                        {OPENROUTER_MODELS.map((m) => (
                          <option key={m.id} value={m.id} style={{ background: '#0A0A12' }}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        color="#6B6B80"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2.5 px-5 py-4"
          style={{ borderTop: '1px solid #1E1E2E', flexShrink: 0 }}
        >
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              height: 34,
              paddingInline: 16,
              background: saved ? '#16A34A' : 'linear-gradient(135deg, #534AB7, #6B62D1)',
              border: `1px solid ${saved ? '#22C55E' : '#7B6FE0'}`,
              color: '#fff',
              fontSize: 13,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {saved ? <><Check size={13} /> Saved</> : 'Save keys'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center justify-center rounded-lg font-medium transition-all"
            style={{
              height: 34,
              paddingInline: 14,
              background: 'transparent',
              border: '1px solid #2A2A3D',
              color: '#6B6B80',
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#E53E3E'
              e.currentTarget.style.color = '#FC8181'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A2A3D'
              e.currentTarget.style.color = '#6B6B80'
            }}
          >
            Clear all
          </button>
        </div>
      </div>
    </>
  )
}
