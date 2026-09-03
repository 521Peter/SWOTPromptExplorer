'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, X, Check, Eye, EyeOff, Wifi, Key } from 'lucide-react'
import { saveKeys, loadKeys, clearKeys, saveProvider } from '@/lib/settings/keys'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'
import { DEFAULT_GLM_MODEL, GLM_MODELS } from '@/constants/glm-models'

const OTHER_PROVIDERS: {
  id: Provider
  keyId: keyof Pick<ApiKeys, 'anthropic' | 'openai' | 'groq'>
  label: string
  badge: string
  placeholder: string
  color: string
}[] = [
  { id: 'claude', keyId: 'anthropic', label: 'Anthropic', badge: 'Claude',   placeholder: 'sk-ant-...', color: '#D97757' },
  { id: 'openai', keyId: 'openai',    label: 'OpenAI',    badge: 'GPT-4o',   placeholder: 'sk-...',     color: '#19C37D' },
  { id: 'groq',   keyId: 'groq',      label: 'Groq',      badge: 'Llama',    placeholder: 'gsk_...',    color: '#F97316' },
]

interface Props {
  provider: Provider
  onProviderChange: (p: Provider) => void
}

export function SettingsPanel({ provider, onProviderChange }: Props) {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState<Partial<ApiKeys>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [openrouterConnected, setOpenrouterConnected] = useState(false)
  const [glmConnected, setGlmConnected] = useState(false)
  const [openrouterEnvAvailable, setOpenrouterEnvAvailable] = useState(false)
  const [glmEnvAvailable, setGlmEnvAvailable] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  function handleOpen() {
    const k = loadKeys()
    setKeys(k)
    setOpenrouterConnected(!!k.openrouter)
    setGlmConnected(!!k.glm)
    setOpen(true)
    fetch('/api/env-status')
      .then((r) => r.json())
      .then((data) => {
        setOpenrouterEnvAvailable(!!data.openrouter)
        setGlmEnvAvailable(!!data.glm)
        setOpenrouterConnected(!!k.openrouter || !!data.openrouter)
        setGlmConnected(!!k.glm || !!data.glm)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
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
    saveProvider(provider)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function handleClear() {
    clearKeys()
    setKeys({})
    fetch('/api/env-status')
      .then((r) => r.json())
      .then((data) => {
        setOpenrouterEnvAvailable(!!data.openrouter)
        setGlmEnvAvailable(!!data.glm)
        setOpenrouterConnected(!!data.openrouter)
        setGlmConnected(!!data.glm)
      })
      .catch(() => {
        setOpenrouterConnected(false)
        setGlmConnected(false)
      })
  }

  function toggleVisible(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function selectProvider(p: Provider) {
    if (p === 'openrouter') {
      if (!openrouterConnected) return
    } else if (p === 'glm') {
      if (!glmConnected) return
    } else {
      const keyId = OTHER_PROVIDERS.find((x) => x.id === p)?.keyId
      if (!keyId || !keys[keyId]) return
    }
    onProviderChange(p)
    saveProvider(p)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="设置"
        className="inline-flex items-center justify-center rounded-md transition-colors"
        style={{ width: 28, height: 28, color: '#6B6B80', background: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#C0C0CC'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B80'; e.currentTarget.style.background = 'transparent' }}
      >
        <Settings size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
      )}

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
        <div className="flex items-center justify-between px-5" style={{ height: 56, borderBottom: '1px solid #1E1E2E', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#D0D0DC', letterSpacing: '-0.2px' }}>设置</div>
            <div style={{ fontSize: 11, color: '#5A5A6C', marginTop: 1 }}>API Key 仅保存在浏览器中</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 28, height: 28, color: '#6B6B80', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C0C0CC'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B80'; e.currentTarget.style.background = 'transparent' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          <p style={{ fontSize: 12, color: '#5A5A6C', lineHeight: 1.6, marginBottom: 12 }}>
            默认使用 OpenRouter。填写其他模型服务商的 API Key 后即可切换。
          </p>

          {/* OpenRouter — key input + env fallback */}
          <div
            className="flex flex-col rounded-xl mb-2"
            style={{
              border: `1px solid ${provider === 'openrouter' ? '#8B5CF640' : '#1E1E2E'}`,
              background: provider === 'openrouter' ? '#8B5CF608' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
              <Wifi size={14} style={{ color: openrouterConnected ? '#10B981' : '#5A5A6C', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 600, fontSize: 12, color: provider === 'openrouter' ? '#D0D0DC' : '#7A7A8C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  OpenRouter
                </div>
                <div style={{ fontSize: 11, color: openrouterConnected ? '#10B981' : '#5A5A6C', marginTop: 1 }}>
                  {keys.openrouter ? '已保存 Key' : openrouterConnected ? '已通过环境变量连接' : '未找到 Key'}
                </div>
              </div>
              <button
                onClick={() => selectProvider('openrouter')}
                disabled={!openrouterConnected}
                className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                style={{
                  width: 18, height: 18,
                  border: `2px solid ${provider === 'openrouter' ? '#8B5CF6' : (openrouterConnected ? '#3A3A4C' : '#252535')}`,
                  background: provider === 'openrouter' ? '#8B5CF6' : 'transparent',
                  cursor: openrouterConnected ? 'pointer' : 'default',
                  opacity: openrouterConnected ? 1 : 0.3,
                }}
              >
                {provider === 'openrouter' && <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#fff' }} />}
              </button>
            </div>
            <div className="relative flex items-center px-3 pb-3">
              <Key size={11} style={{ position: 'absolute', left: 20, color: '#333345', pointerEvents: 'none' }} />
              <input
                type={visible['openrouter'] ? 'text' : 'password'}
                placeholder="sk-or-...（覆盖环境变量）"
                value={keys.openrouter ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  setKeys((prev) => ({ ...prev, openrouter: value }))
                  setOpenrouterConnected(!!value || openrouterEnvAvailable)
                }}
                className="w-full pr-9 rounded-lg outline-none placeholder-[#2A2A3C] font-mono"
                style={{
                  height: 34,
                  paddingLeft: 28,
                  background: '#0A0A12',
                  border: `1px solid ${keys.openrouter ? '#8B5CF635' : '#1E1E2E'}`,
                  color: '#C0C0CC',
                  fontSize: 12,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B5CF670')}
                onBlur={(e) => (e.currentTarget.style.borderColor = keys.openrouter ? '#8B5CF635' : '#1E1E2E')}
              />
              <button
                type="button"
                onClick={() => toggleVisible('openrouter')}
                className="absolute right-5 flex items-center justify-center"
                style={{ color: '#333345', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#8A8A9A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#333345')}
              >
                {visible['openrouter'] ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* GLM — OpenAI-compatible Zhipu API with selectable model */}
          <div
            className="flex flex-col rounded-xl mb-2"
            style={{
              border: `1px solid ${provider === 'glm' ? '#2563EB40' : '#1E1E2E'}`,
              background: provider === 'glm' ? '#2563EB08' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
              <Wifi size={14} style={{ color: glmConnected ? '#10B981' : '#5A5A6C', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 600, fontSize: 12, color: provider === 'glm' ? '#D0D0DC' : '#7A7A8C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  GLM
                </div>
                <div style={{ fontSize: 11, color: glmConnected ? '#10B981' : '#5A5A6C', marginTop: 1 }}>
                  {keys.glm ? '已保存 Key' : glmConnected ? '已通过环境变量连接' : '未找到 Key'}
                </div>
              </div>
              <button
                onClick={() => selectProvider('glm')}
                disabled={!glmConnected}
                className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                style={{
                  width: 18, height: 18,
                  border: `2px solid ${provider === 'glm' ? '#2563EB' : (glmConnected ? '#3A3A4C' : '#252535')}`,
                  background: provider === 'glm' ? '#2563EB' : 'transparent',
                  cursor: glmConnected ? 'pointer' : 'default',
                  opacity: glmConnected ? 1 : 0.3,
                }}
              >
                {provider === 'glm' && <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#fff' }} />}
              </button>
            </div>
            <div className="relative flex items-center px-3 pb-2">
              <Key size={11} style={{ position: 'absolute', left: 20, color: '#333345', pointerEvents: 'none' }} />
              <input
                type={visible.glm ? 'text' : 'password'}
                placeholder="智谱 API Key（覆盖环境变量）"
                value={keys.glm ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  setKeys((prev) => ({ ...prev, glm: value }))
                  setGlmConnected(!!value || glmEnvAvailable)
                }}
                className="w-full pr-9 rounded-lg outline-none placeholder-[#2A2A3C] font-mono"
                style={{
                  height: 34,
                  paddingLeft: 28,
                  background: '#0A0A12',
                  border: `1px solid ${keys.glm ? '#2563EB35' : '#1E1E2E'}`,
                  color: '#C0C0CC',
                  fontSize: 12,
                }}
              />
              <button
                type="button"
                onClick={() => toggleVisible('glm')}
                className="absolute right-5 flex items-center justify-center"
                style={{ color: '#333345', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {visible.glm ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <div className="relative px-3 pb-3">
              <select
                value={keys.glmModel ?? DEFAULT_GLM_MODEL}
                onChange={(e) => setKeys((prev) => ({ ...prev, glmModel: e.target.value }))}
                className="w-full h-8 px-3 pr-8 rounded-lg text-xs appearance-none"
                style={{ background: '#17171F', border: '1px solid #1E1E2E', color: '#E6E6EC' }}
              >
                {GLM_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>{model.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Other providers with key inputs */}
          {OTHER_PROVIDERS.map((p) => {
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
                <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                  <span className="inline-block rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: hasKey ? p.color : '#333345' }} />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span style={{ fontWeight: 600, fontSize: 12, color: isActive ? '#D0D0DC' : '#7A7A8C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: '#3A3A4C' }}>{p.badge}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasKey
                      ? <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#22C55E' }}><Check size={10} />已连接</span>
                      : <span style={{ fontSize: 11, color: '#3A3A4C' }}>未填写 Key</span>
                    }
                    <button
                      onClick={() => selectProvider(p.id)}
                      disabled={!hasKey}
                      title={!hasKey ? '请先填写 API Key' : isActive ? '当前服务商' : '使用此服务商'}
                      className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
                      style={{
                        width: 18, height: 18,
                        border: `2px solid ${isActive ? p.color : (hasKey ? '#3A3A4C' : '#252535')}`,
                        background: isActive ? p.color : 'transparent',
                        cursor: hasKey ? 'pointer' : 'default',
                        opacity: hasKey ? 1 : 0.3,
                      }}
                    >
                      {isActive && <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#fff' }} />}
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center px-3 pb-3">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    placeholder={p.placeholder}
                    value={keys[p.keyId] ?? ''}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [p.keyId]: e.target.value }))}
                    className="w-full pr-9 pl-3 rounded-lg outline-none placeholder-[#2A2A3C] font-mono"
                    style={{
                      height: 34,
                      background: '#0A0A12',
                      border: `1px solid ${hasKey ? p.color + '35' : '#1E1E2E'}`,
                      color: '#C0C0CC',
                      fontSize: 12,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = p.color + '70')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = hasKey ? p.color + '35' : '#1E1E2E')}
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
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderTop: '1px solid #1E1E2E', flexShrink: 0 }}>
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              height: 34, paddingInline: 16,
              background: saved ? '#16A34A' : 'linear-gradient(135deg, #534AB7, #6B62D1)',
              border: `1px solid ${saved ? '#22C55E' : '#7B6FE0'}`,
              color: '#fff', fontSize: 13,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {saved ? <><Check size={13} /> 已保存</> : '保存 Key'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center justify-center rounded-lg font-medium transition-all"
            style={{ height: 34, paddingInline: 14, background: 'transparent', border: '1px solid #2A2A3D', color: '#6B6B80', fontSize: 13 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E53E3E'; e.currentTarget.style.color = '#FC8181' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A3D'; e.currentTarget.style.color = '#6B6B80' }}
          >
            全部清除
          </button>
        </div>
      </div>
    </>
  )
}
