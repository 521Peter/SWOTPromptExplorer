import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { DagNode } from '@/lib/types'
import type { InsightState } from './state'
import { withProviderConcurrency } from './concurrency'
import type { Provider } from './providers'
import { messageContentToText } from './response'

export function makeInsightNode(node: DagNode, llm: BaseChatModel, provider: Provider) {
  return async (_state: typeof InsightState.State) => {
    const response = await withProviderConcurrency(provider, () =>
      llm.invoke([
        {
          role: 'system',
          content: '你是一名资深市场战略顾问。请给出具体、可执行的分析，避免空泛表述。无论用户输入使用何种语言，都必须使用简体中文回答，并使用 Markdown 排版。专业名词、品牌名和必要缩写可保留原文。',
        },
        { role: 'user', content: node.prompt },
      ])
    )

    return { outputs: { [node.id]: messageContentToText(response.content) } }
  }
}
