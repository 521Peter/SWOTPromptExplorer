'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Play, RotateCcw, Sparkles, Loader2 } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { loadKeys, loadProvider, saveProvider } from '@/lib/settings/keys'
import { validateForm, validateField, hasErrors, type ValidationErrors } from '@/lib/validate'
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

interface Suggestions {
  objectives: string[]
  segments: string[]
}

export function Sidebar({ onRun, onProviderInit, isRunning }: Props) {
  const [product, setProduct] = useState('')
  const [objective, setObjective] = useState('')
  const [segments, setSegments] = useState<string[]>([])
  const [segmentInput, setSegmentInput] = useState('')
  const [provider, setProvider] = useState<Provider>('openrouter')
  const [hasRun, setHasRun] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [segInputError, setSegInputError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const lastRun = useRef<{ product: string; objective: string; segments: string[] } | null>(null)
  // Values that came from AI suggestions are already trusted — skip validation for them
  const trustedValues = useRef<Set<string>>(new Set())

  useEffect(() => {
    const saved = loadProvider()
    setProvider(saved)
    onProviderInit(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear suggestions when product changes
  useEffect(() => {
    setSuggestions(null)
    setSuggestError(null)
  }, [product])

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
    !isRunning &&
    !isValidating

  async function fetchSuggestions() {
    if (!product.trim() || isSuggesting) return
    setIsSuggesting(true)
    setSuggestions(null)
    setSuggestError(null)
    setErrors((prev) => ({ ...prev, product: undefined }))
    try {
      const keys = loadKeys()

      // Validate product before suggesting
      const valRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product.trim(), objective: 'placeholder', segments: [], openrouterKey: keys.openrouter }),
      })
      const valData = await valRes.json()
      if (valRes.ok && !valData.valid && valData.errors?.product) {
        setErrors((prev) => ({ ...prev, product: valData.errors.product }))
        return
      }

      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product.trim(), provider, keys }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '获取建议失败，请检查设置中的 OpenRouter API Key。')
      setSuggestions(data as Suggestions)
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : '获取建议失败。')
    } finally {
      setIsSuggesting(false)
    }
  }

  function addSegment(name?: string) {
    const trimmed = (name ?? segmentInput).trim()
    if (!trimmed || segments.includes(trimmed) || segments.length >= 6) return
    // Only validate manually typed segments — suggestion-sourced ones are trusted
    if (!name) {
      const err = validateField('segment', trimmed)
      if (err) { setSegInputError(err); return }
    } else {
      trustedValues.current.add(trimmed)
    }
    setSegments((prev) => [...prev, trimmed])
    setErrors((prev) => ({ ...prev, segments: undefined }))
    setSegInputError(null)
    if (!name) setSegmentInput('')
  }

  function removeSegment(name: string) {
    setSegments((prev) => prev.filter((s) => s !== name))
    setErrors((prev) => ({ ...prev, segments: undefined }))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addSegment()
  }

  async function handleRun() {
    if (!canRun || isValidating) return

    // Fast local check first
    const localErrs = validateForm(product, objective, segments)
    setErrors(localErrs)
    if (hasErrors(localErrs)) return

    // Only LLM-validate fields that were manually typed (not from suggestions)
    const trusted = trustedValues.current
    const validateProduct = !trusted.has(product.trim())
    const validateObjective = !trusted.has(objective.trim())
    const manualSegments = segments.filter((s) => !trusted.has(s))

    if (validateProduct || validateObjective || manualSegments.length > 0) {
      setIsValidating(true)
      try {
        const keys = loadKeys()
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: validateProduct ? product.trim() : '__trusted__',
            objective: validateObjective ? objective.trim() : '__trusted__',
            segments: manualSegments,
            openrouterKey: keys.openrouter,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '输入校验失败')

        if (!data.valid) {
          setErrors({
            ...(validateProduct && data.errors?.product ? { product: data.errors.product } : {}),
            ...(validateObjective && data.errors?.objective ? { objective: data.errors.objective } : {}),
            ...(data.errors?.segments?.length ? { segments: data.errors.segments } : {}),
          })
          return
        }
      } catch {
        // If validation call itself fails, allow through — don't block the user
      } finally {
        setIsValidating(false)
      }
    }

    lastRun.current = { product: product.trim(), objective: objective.trim(), segments: [...segments] }
    const force = hasRun
    const keys = loadKeys()
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
        <SidebarSection
          error={errors.product}
          label="产品"
          action={
            <button
              onClick={fetchSuggestions}
              disabled={!product.trim() || isSuggesting}
              title="推荐目标和客户群体"
              className="flex items-center gap-1 rounded transition-colors disabled:opacity-30"
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: isSuggesting ? '#7B6FE0' : '#534AB7',
                background: 'none',
                border: 'none',
                cursor: product.trim() ? 'pointer' : 'default',
                padding: '1px 4px',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={(e) => { if (product.trim() && !isSuggesting) e.currentTarget.style.color = '#9D94F0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isSuggesting ? '#7B6FE0' : '#534AB7' }}
            >
              {isSuggesting
                ? <Loader2 size={10} className="animate-spin" />
                : <Sparkles size={10} />}
              {isSuggesting ? '生成中…' : '智能推荐'}
            </button>
          }
        >
          <textarea
            value={product}
            onChange={(e) => { setProduct(e.target.value); setErrors((prev) => ({ ...prev, product: undefined })); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="例如：智能电动汽车"
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
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.product ? '#EF4444' : '#252535'
              const err = validateField('product', product)
              if (err) setErrors((prev) => ({ ...prev, product: err }))
            }}
          />
          {suggestError && (
            <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{suggestError}</p>
          )}
        </SidebarSection>

        {/* Objective */}
        <SidebarSection label="目标" error={errors.objective}>
          <textarea
            value={objective}
            onChange={(e) => { setObjective(e.target.value); setErrors((prev) => ({ ...prev, objective: undefined })); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="例如：提升品牌知名度"
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
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.objective ? '#EF4444' : '#252535'
              const err = validateField('objective', objective)
              if (err) setErrors((prev) => ({ ...prev, objective: err }))
            }}
          />
          {suggestions && suggestions.objectives.length > 0 && (
            <SuggestionChips
              items={suggestions.objectives}
              onAdd={(val) => { trustedValues.current.add(val); setObjective(val); setErrors((prev) => ({ ...prev, objective: undefined })) }}
              active={objective}
            />
          )}
        </SidebarSection>

        {/* Segments */}
        <SidebarSection label="客户群体" error={errors.segments?.join(' · ')}>
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
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    value={segmentInput}
                    onChange={(e) => { setSegmentInput(e.target.value); setSegInputError(null) }}
                    onKeyDown={handleKeyDown}
                    placeholder="添加客户群体…"
                    className="flex-1 px-2.5 rounded-md outline-none placeholder-[#3A3A4C]"
                    style={{
                      height: 30,
                      background: '#0D0D14',
                      border: `1px solid ${segInputError ? '#EF4444' : '#252535'}`,
                      color: '#E6E6EC',
                      fontSize: 12,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = segInputError ? '#EF4444' : '#534AB7')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = segInputError ? '#EF4444' : '#252535')}
                  />
                  <button
                    onClick={() => addSegment()}
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
                {segInputError && (
                  <p style={{ fontSize: 11, color: '#EF4444', marginLeft: 2 }}>{segInputError}</p>
                )}
              </div>
            )}

            {suggestions && suggestions.segments.length > 0 && segments.length < 6 && (
              <SuggestionChips
                items={suggestions.segments.filter((s) => !segments.includes(s))}
                onAdd={(val) => addSegment(val)}
                active={null}
              />
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
          {isValidating ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              校验中…
            </>
          ) : hasRun && !isRunning ? (
            <>
              <RotateCcw size={12} />
              {isDirty ? '按修改重新分析' : '重新分析'}
            </>
          ) : (
            <>
              <Play size={12} fill="white" stroke="white" strokeWidth={0} />
              开始分析
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function SuggestionChips({
  items,
  onAdd,
  active,
}: {
  items: string[]
  onAdd: (val: string) => void
  active: string | null
}) {
  if (items.length === 0) return null
  return (
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#4A4A5C', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        推荐内容
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((item) => {
          const isActive = active === item
          return (
            <button
              key={item}
              onClick={() => onAdd(item)}
              disabled={isActive}
              className="flex items-center gap-2 text-left rounded-md transition-colors"
              style={{
                padding: '5px 8px',
                background: isActive ? 'rgba(83,74,183,0.12)' : 'rgba(13,13,20,0.6)',
                border: `0.5px solid ${isActive ? '#534AB7' : '#252535'}`,
                color: isActive ? '#9D94F0' : '#9A9AAC',
                fontSize: 11.5,
                cursor: isActive ? 'default' : 'pointer',
                width: '100%',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(83,74,183,0.08)'; e.currentTarget.style.color = '#C0B8F0' } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(13,13,20,0.6)'; e.currentTarget.style.color = '#9A9AAC' } }}
            >
              {!isActive && (
                <Plus size={10} style={{ flexShrink: 0, color: '#534AB7' }} />
              )}
              <span style={{ flex: 1, lineHeight: 1.4 }}>{item}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SidebarSection({
  label,
  children,
  action,
  error,
}: {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <div
        className="mb-2 flex items-center justify-between"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: error ? '#EF4444' : '#6B6B80',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          transition: 'color 0.15s',
        }}
      >
        <span>{label}</span>
        {action}
      </div>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: '#EF4444', marginTop: 5, lineHeight: 1.4 }}>
          {error}
        </p>
      )}
    </div>
  )
}
