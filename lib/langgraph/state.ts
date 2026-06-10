import { Annotation } from '@langchain/langgraph'
import type { DagSpec } from '@/lib/types'

export const InsightState = Annotation.Root({
  // Inputs
  product:   Annotation<string>(),
  objective: Annotation<string>(),
  segment:   Annotation<string>(),
  provider:  Annotation<string>(),
  dagSpec:   Annotation<DagSpec | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Dynamic outputs — each node merges its key into this map
  outputs: Annotation<Record<string, string>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
})
