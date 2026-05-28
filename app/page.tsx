'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SegmentGraph } from '@/components/graphs/SegmentGraph'
import { InsightDAG } from '@/components/graphs/InsightDAG'
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
      <main className="flex-1 flex overflow-hidden">
        {state.activeLayer === 'insight' && state.activeSegment && activeSession ? (
          <InsightDAG
            segment={state.activeSegment}
            session={activeSession}
            selectedNode={state.selectedNode}
            onNodeClick={(key: PromptType) => selectNode(key)}
            onBack={backToSegments}
          />
        ) : (
          <SegmentGraph
            segments={segments}
            provider={state.provider}
            getSession={getSession}
            onSegmentClick={selectSegment}
          />
        )}
      </main>
    </div>
  )
}
