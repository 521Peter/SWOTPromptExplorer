import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { DagNode } from '@/lib/types'
import type { InsightState } from './state'

export function makeInsightNode(node: DagNode, llm: BaseChatModel) {
  return async (_state: typeof InsightState.State) => {
    const response = await llm.invoke([
      {
        role: 'system',
        content: 'You are a senior market strategist. Be specific, not generic. Format responses in markdown.',
      },
      { role: 'user', content: node.prompt },
    ])

    return { outputs: { [node.id]: response.content as string } }
  }
}
