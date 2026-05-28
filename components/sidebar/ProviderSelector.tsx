'use client'

import { Lock, ChevronDown } from 'lucide-react'
import { tokens } from '@/lib/tokens'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

export const PROVIDERS: {
  id: Provider
  label: string
  model: string
  badge: string
  icon: string
  keyId: keyof ApiKeys
}[] = [
  { id: 'claude',      label: 'Claude',       model: 'claude-haiku-4-5-20251001',       badge: 'Anthropic',   icon: '◆', keyId: 'anthropic'  },
  { id: 'openai',      label: 'GPT-4o mini',  model: 'gpt-4o-mini',                     badge: 'OpenAI',      icon: '⬡', keyId: 'openai'     },
  { id: 'groq',        label: 'Llama 3.3 70B',model: 'llama-3.3-70b-versatile',         badge: 'Groq',        icon: '▲', keyId: 'groq'       },
  { id: 'openrouter',  label: 'OpenRouter',   model: '(pick model)',                     badge: 'OpenRouter',  icon: '◉', keyId: 'openrouter' },
]

export const OPENROUTER_MODELS = [
  { id: 'mistralai/mistral-7b-instruct',    label: 'Mistral 7B' },
  { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { id: 'google/gemini-flash-1.5',          label: 'Gemini Flash 1.5' },
  { id: 'anthropic/claude-3-haiku',         label: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o-mini',              label: 'GPT-4o Mini' },
  { id: 'deepseek/deepseek-chat',           label: 'DeepSeek Chat' },
]

interface Props {
  activeProvider: Provider
  keys: Partial<ApiKeys>
  openrouterModel: string
  onProviderChange: (p: Provider) => void
  onModelChange: (m: string) => void
}

export function ProviderSelector({
  activeProvider,
  keys,
  openrouterModel,
  onProviderChange,
  onModelChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Segmented button group */}
      <div className="flex flex-col gap-1">
        {PROVIDERS.map((p) => {
          const hasKey = !!keys[p.keyId]
          const isActive = activeProvider === p.id
          const color = tokens.providers[p.id as keyof typeof tokens.providers] ?? '#7A7A8C'

          return (
            <button
              key={p.id}
              disabled={!hasKey}
              onClick={() => hasKey && onProviderChange(p.id)}
              title={!hasKey ? 'Add key in Settings →' : p.badge}
              className="flex items-center justify-between px-3 h-8 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: isActive ? '#1B1B25' : '#17171F',
                border: `0.5px solid ${isActive ? '#2A2A3D' : '#1E1E2E'}`,
                color: hasKey ? '#E6E6EC' : '#5A5A6C',
                opacity: hasKey ? 1 : 0.6,
                cursor: hasKey ? 'pointer' : 'not-allowed',
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                {p.label}
              </span>
              <span className="flex items-center gap-1">
                <span style={{ color: '#7A7A8C', fontSize: 10 }}>{p.badge}</span>
                {!hasKey && <Lock size={10} color="#5A5A6C" />}
              </span>
            </button>
          )
        })}
      </div>

      {/* OpenRouter model picker — only shown when openrouter is selected */}
      {activeProvider === 'openrouter' && keys.openrouter && (
        <div className="relative">
          <select
            value={openrouterModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full h-8 px-3 pr-8 rounded-lg text-xs appearance-none"
            style={{
              background: '#17171F',
              border: '0.5px solid #1E1E2E',
              color: '#E6E6EC',
            }}
          >
            {OPENROUTER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            color="#7A7A8C"
          />
        </div>
      )}
    </div>
  )
}
