import { StateGraph, START, END } from '@langchain/langgraph'
import { InsightState } from './state'
import { makeInsightNode } from './nodes'
import { getLLM, type Provider } from './providers'
import type { ApiKeys, DagSpec } from '@/lib/types'

export function buildInsightGraph(provider: Provider, keys: Partial<ApiKeys>, dagSpec: DagSpec) {
  if (!dagSpec.nodes || dagSpec.nodes.length === 0) {
    throw new Error('dagSpec must contain at least one node')
  }
  const llm = getLLM(provider, keys)
  const graph = new StateGraph(InsightState)

  dagSpec.nodes.forEach((node) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.addNode(`node_${node.id}`, makeInsightNode(node, llm))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.addEdge(START, `node_${node.id}` as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.addEdge(`node_${node.id}` as any, END)
  })

  return graph.compile()
}
