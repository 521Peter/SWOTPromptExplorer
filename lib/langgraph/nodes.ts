import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { PROMPT_CONFIG } from '@/constants/prompt-config'
import type { PromptType } from '@/lib/types'
import type { InsightState } from './state'

export function makeInsightNode(promptKey: PromptType, llm: BaseChatModel) {
  return async (state: typeof InsightState.State) => {
    const config = PROMPT_CONFIG[promptKey]
    const prompt = config.prompt(state.product, state.objective, state.segment)

    const response = await llm.invoke([
      {
        role: 'system',
        content:
          'You are a senior market strategist. Be specific, not generic. Format responses in markdown.',
      },
      { role: 'user', content: prompt },
    ])

    return { [promptKey]: response.content as string }
  }
}
