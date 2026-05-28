'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, X, Check, Eye, EyeOff } from 'lucide-react'
import { saveKeys, loadKeys, clearKeys } from '@/lib/settings/keys'
import type { ApiKeys } from '@/lib/types'

const PROVIDERS: {
  id: keyof Pick<ApiKeys, 'anthropic' | 'openai' | 'groq' | 'openrouter'>
  label: string
  badge: string
  placeholder: string
  color: string
}[] = [
  { id: 'anthropic',  label: 'Anthropic',  badge: 'Claude',      placeholder: 'sk-ant-...',  color: '#D97757' },
  { id: 'openai',     label: 'OpenAI',     badge: 'GPT-4o',      placeholder: 'sk-...',      color: '#19C37D' },
  { id: 'groq',       label: 'Groq',       badge: 'Llama',       placeholder: 'gsk_...',     color: '#F97316' },
  { id: 'openrouter', label: 'OpenRouter', badge: 'Multi-model', placeholder: 'sk-or-...',   color: '#8B5CF6' },
]

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState<Partial<ApiKeys>>(loadKeys)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
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
    saveKeys(keys)
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

  return (
    <>
      {/* Gear trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Settings"
        className="inline-flex items-center justify-center rounded-md transition-colors"
        style={{
          width: 28,
          height: 28,
          color: '#6B6B80',
          background: 'transparent',
        }}
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
          width: 340,
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
              API Keys
            </div>
            <div style={{ fontSize: 11, color: '#5A5A6C', marginTop: 1 }}>
              Stored in browser only
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

        {/* Fields */}
        <div className="flex flex-col gap-5 px-5 py-5 flex-1 overflow-y-auto">
          <p style={{ fontSize: 12, color: '#5A5A6C', lineHeight: 1.6 }}>
            Keys go directly to each provider. They are never logged or stored on any server.
          </p>

          {PROVIDERS.map((p) => {
            const hasKey = !!keys[p.id]
            const isVisible = !!visible[p.id]
            return (
              <div key={p.id} className="flex flex-col gap-1.5">
                {/* Label row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full"
                      style={{ width: 7, height: 7, background: p.color, flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#B0B0C0', letterSpacing: '0.02em' }}>
                      {p.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#484858' }}>{p.badge}</span>
                  </div>
                  {hasKey ? (
                    <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#22C55E' }}>
                      <Check size={11} />
                      Connected
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#484858' }}>Not set</span>
                  )}
                </div>

                {/* Input */}
                <div className="relative flex items-center">
                  <input
                    id={p.id}
                    type={isVisible ? 'text' : 'password'}
                    placeholder={p.placeholder}
                    value={keys[p.id] ?? ''}
                    onChange={(e) =>
                      setKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="w-full pr-9 pl-3 rounded-lg outline-none placeholder-[#333345] font-mono"
                    style={{
                      height: 36,
                      background: '#0A0A12',
                      border: `1px solid ${hasKey ? p.color + '40' : '#252535'}`,
                      color: '#D0D0DC',
                      fontSize: 12,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = p.color + '80')}
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = hasKey ? p.color + '40' : '#252535')
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisible(p.id)}
                    className="absolute right-2.5 flex items-center justify-center"
                    style={{ color: '#484858', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#8A8A9A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#484858')}
                  >
                    {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
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
            className="flex items-center justify-center rounded-lg font-medium transition-all hover:brightness-110"
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
