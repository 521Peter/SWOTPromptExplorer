'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SegmentGraph } from '@/components/graphs/SegmentGraph'
import { InsightDAG } from '@/components/graphs/InsightDAG'
import { InsightPanel } from '@/components/panels/InsightPanel'
import { useInsights } from '@/hooks/useInsights'
import { useGraphState } from '@/hooks/useGraphState'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, PromptType } from '@/lib/types'

export default function Home() {
  const [segments, setSegments] = useState<string[]>([])
  const { getSession, runAll } = useInsights()
  const { state, selectSegment, selectNode, backToSegments } = useGraphState()

  function handleRun(config: {
    product: string
    objective: string
    segments: string[]
    provider: Provider
    keys: Partial<ApiKeys>
    openrouterModel: string
  }) {
    setSegments(config.segments)
    runAll(config.segments, config)
  }

  const isRunning = segments.some(
    (seg) => getSession(seg, state.provider).status === 'loading'
  )

  const activeSession =
    state.activeSegment ? getSession(state.activeSegment, state.provider) : null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0F' }}>
      <Sidebar onRun={handleRun} isRunning={isRunning} />
      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {state.activeLayer === 'insight' && state.activeSegment && activeSession ? (
            <motion.div
              key="insight"
              className="flex flex-1 overflow-hidden w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <InsightDAG
                segment={state.activeSegment}
                session={activeSession}
                selectedNode={state.selectedNode}
                onNodeClick={(key: PromptType) => selectNode(key)}
                onBack={backToSegments}
              />
              <InsightPanel
                promptKey={state.selectedNode as PromptType | null}
                content={
                  state.selectedNode && activeSession.insights
                    ? activeSession.insights[state.selectedNode as PromptType]
                    : null
                }
                onClose={() => selectNode(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="segment"
              className="flex flex-1 overflow-hidden w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SegmentGraph
                segments={segments}
                provider={state.provider}
                getSession={getSession}
                onSegmentClick={selectSegment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
