import type { ApiKeys } from '@/lib/types'

const STORAGE_KEY = 'swot_api_keys'

// Optional env-var defaults (NEXT_PUBLIC_ so they reach the client).
// Keys entered in the Settings panel always take precedence.
function envDefaults(): Partial<ApiKeys> {
  return {
    anthropic:      process.env.NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY  ?? '',
    openai:         process.env.NEXT_PUBLIC_DEFAULT_OPENAI_KEY     ?? '',
    groq:           process.env.NEXT_PUBLIC_DEFAULT_GROQ_KEY       ?? '',
    openrouter:     process.env.NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY ?? '',
    openrouterModel: 'mistralai/mistral-7b-instruct',
  }
}

export function saveKeys(keys: Partial<ApiKeys>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

export function loadKeys(): Partial<ApiKeys> {
  if (typeof window === 'undefined') return envDefaults()
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<ApiKeys>
    // Merge: stored keys take precedence over env defaults
    const defaults = envDefaults()
    return {
      anthropic:       stored.anthropic      || defaults.anthropic,
      openai:          stored.openai         || defaults.openai,
      groq:            stored.groq           || defaults.groq,
      openrouter:      stored.openrouter     || defaults.openrouter,
      openrouterModel: stored.openrouterModel ?? defaults.openrouterModel,
    }
  } catch {
    return envDefaults()
  }
}

export function clearKeys(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
