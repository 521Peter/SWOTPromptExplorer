import { StateGraph, START, END } from '@langchain/langgraph'
import { InsightState } from './state'
import { makeInsightNode } from './nodes'
import { getLLM, type Provider } from './providers'
import { PROMPT_CONFIG } from '@/constants/prompt-config'
import type { ApiKeys, PromptType } from '@/lib/types'

export function buildInsightGraph(provider: Provider, keys: Partial<ApiKeys>) {
  const llm = getLLM(provider, keys)
  const graph = new StateGraph(InsightState)

  const promptKeys = Object.keys(PROMPT_CONFIG) as PromptType[]

  // Prefix node names to avoid collision with state attribute names
  promptKeys.forEach((key) => {
    graph.addNode(`node_${key}`, makeInsightNode(key, llm))
  })

  // Fan out from START to all nodes in parallel
  promptKeys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.addEdge(START, `node_${key}` as any)
  })

  // Fan in from all nodes to END
  promptKeys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.addEdge(`node_${key}` as any, END)
  })

  return graph.compile()
}
