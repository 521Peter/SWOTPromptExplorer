'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SegmentGraph } from '@/components/graphs/SegmentGraph'
import { useInsights } from '@/hooks/useInsights'
import { useGraphState } from '@/hooks/useGraphState'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

export default function Home() {
  const [segments, setSegments] = useState<string[]>([])
  const { getSession, runAll } = useInsights()
  const { state, selectSegment } = useGraphState()

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0F' }}>
      <Sidebar onRun={handleRun} isRunning={isRunning} />
      <main className="flex-1 flex overflow-hidden">
        <SegmentGraph
          segments={segments}
          provider={state.provider}
          getSession={getSession}
          onSegmentClick={selectSegment}
        />
      </main>
    </div>
  )
}
