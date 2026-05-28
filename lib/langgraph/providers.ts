import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGroq } from '@langchain/groq'
import type { ApiKeys } from '@/lib/types'

export type Provider = 'openai' | 'claude' | 'groq' | 'openrouter'

export function getLLM(provider: Provider, keys: Partial<ApiKeys>) {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 400,
        openAIApiKey: keys.openai,
      })
    case 'claude':
      return new ChatAnthropic({
        model: 'claude-haiku-4-5-20251001',
        temperature: 0.7,
        maxTokens: 400,
        anthropicApiKey: keys.anthropic,
      })
    case 'groq':
      return new ChatGroq({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        maxTokens: 400,
        apiKey: keys.groq,
      })
    case 'openrouter':
      return new ChatOpenAI({
        model: keys.openrouterModel || 'mistralai/mistral-7b-instruct',
        temperature: 0.7,
        maxTokens: 400,
        openAIApiKey: keys.openrouter,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://swot-explorer.vercel.app',
            'X-Title': 'SWOT Prompt Explorer',
          },
        },
      })
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
