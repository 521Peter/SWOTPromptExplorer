export const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini',                       label: 'GPT-4o Mini (OpenAI)' },
  { id: 'openai/gpt-4o',                            label: 'GPT-4o (OpenAI)' },
  { id: 'meta-llama/llama-3.3-70b-instruct',        label: 'Llama 3.3 70B (Meta)' },
  { id: 'google/gemini-2.0-flash-001',              label: 'Gemini 2.0 Flash (Google)' },
  { id: 'deepseek/deepseek-chat-v3-0324',           label: 'DeepSeek Chat V3' },
  { id: 'anthropic/claude-haiku-4-5',               label: 'Claude Haiku 4.5 (Anthropic)' },
  { id: 'mistralai/mistral-small-3.2-24b-instruct', label: 'Mistral Small 3.2 24B' },
]

export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini'

export const VALID_OPENROUTER_MODEL_IDS = new Set(OPENROUTER_MODELS.map((m) => m.id))
