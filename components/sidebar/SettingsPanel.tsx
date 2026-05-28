'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, X, Wifi } from 'lucide-react'
import { loadKeys } from '@/lib/settings/keys'

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = loadKeys().openrouter
    setConnected(!!key)
  }, [open])

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
          width: 320,
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
          <div style={{ fontWeight: 600, fontSize: 14, color: '#D0D0DC', letterSpacing: '-0.2px' }}>
            Settings
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
        <div className="flex flex-col px-5 py-6 gap-4">
          <p style={{ fontSize: 12, color: '#5A5A6C', lineHeight: 1.6 }}>
            This tool runs on OpenRouter. Your API key is configured server-side.
          </p>

          {/* OpenRouter status card */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: connected ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            <Wifi size={16} style={{ color: connected ? '#10B981' : '#EF4444', flexShrink: 0 }} />
            <div className="flex flex-col gap-0.5">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#D0D0DC' }}>OpenRouter</span>
              <span style={{ fontSize: 11, color: connected ? '#10B981' : '#EF4444' }}>
                {connected ? 'Connected' : 'API key not found — check .env.local'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
