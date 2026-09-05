import { Annotation } from '@langchain/langgraph'
import type { DagSpec } from '@/lib/types'

export const InsightState = Annotation.Root({
  // 输入
  product:   Annotation<string>(),
  objective: Annotation<string>(),
  segment:   Annotation<string>(),
  provider:  Annotation<string>(),
  dagSpec:   Annotation<DagSpec | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // 动态输出：每个节点都将自己的键合并到此映射中
  outputs: Annotation<Record<string, string>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
})
