import type { ApiKeys } from '@/lib/types'
import type { Provider } from '@/lib/langgraph/providers'
import { VALID_OPENROUTER_MODEL_IDS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openrouter-models'
import { DEFAULT_GLM_MODEL, VALID_GLM_MODEL_IDS } from '@/constants/glm-models'

const STORAGE_KEY = 'swot_api_keys'
const PROVIDER_KEY = 'swot_active_provider'

// 可安全传到客户端的密钥所使用的可选环境变量默认值。
// OpenRouter 密钥仅供服务端使用（DEFAULT_OPENROUTER_KEY），绝不会包含在这里。
function envDefaults(): Partial<ApiKeys> {
  return {
    anthropic:       process.env.NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY ?? '',
    openai:          process.env.NEXT_PUBLIC_DEFAULT_OPENAI_KEY    ?? '',
    groq:            process.env.NEXT_PUBLIC_DEFAULT_GROQ_KEY      ?? '',
    openrouterModel: 'openai/gpt-4o-mini',
    glmModel:        DEFAULT_GLM_MODEL,
  }
}

export function loadProvider(): Provider {
  if (typeof window === 'undefined') return 'openrouter'
  return (localStorage.getItem(PROVIDER_KEY) as Provider) || 'openrouter'
}

export function saveProvider(p: Provider): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROVIDER_KEY, p)
}

export function saveKeys(keys: Partial<ApiKeys>): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

export function loadKeys(): Partial<ApiKeys> {
  if (typeof window === 'undefined') return envDefaults()
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Partial<ApiKeys>
    // 合并时，已存储的密钥优先于环境变量默认值
    const defaults = envDefaults()
    return {
      anthropic:       stored.anthropic      || defaults.anthropic,
      openai:          stored.openai         || defaults.openai,
      groq:            stored.groq           || defaults.groq,
      openrouter:      stored.openrouter     || defaults.openrouter,
      openrouterModel:
        stored.openrouterModel && VALID_OPENROUTER_MODEL_IDS.has(stored.openrouterModel)
          ? stored.openrouterModel
          : DEFAULT_OPENROUTER_MODEL,
      glm:              stored.glm            || defaults.glm,
      glmModel:
        stored.glmModel && VALID_GLM_MODEL_IDS.has(stored.glmModel)
          ? stored.glmModel
          : DEFAULT_GLM_MODEL,
    }
  } catch {
    return envDefaults()
  }
}

export function clearKeys(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
