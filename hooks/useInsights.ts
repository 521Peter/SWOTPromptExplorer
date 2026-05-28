'use client'

import { useRef, useState, useCallback } from 'react'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, PromptType, SegmentSession } from '@/lib/types'

// Cache key = `${segment}:${provider}` so same segment run with different
// providers are stored independently, enabling comparison.
export function useInsights() {
  const sessions = useRef<Record<string, SegmentSession>>({})
  const [tick, forceUpdate] = useState(0)

  const getSession = useCallback(
    (segment: string, provider: Provider): SegmentSession => {
      const key = `${segment}:${provider}`
      return (
        sessions.current[key] ?? {
          status: 'idle',
          insights: null,
          provider,
          generatedAt: null,
        }
      )
    },
    []
  )

  const runSegment = useCallback(
    async (
      segment: string,
      config: {
        product: string
        objective: string
        provider: Provider
        keys: Partial<ApiKeys>
        openrouterModel: string
      }
    ) => {
      const key = `${segment}:${config.provider}`

      // Use cache if already ready
      if (sessions.current[key]?.status === 'ready') return

      sessions.current[key] = {
        status: 'loading',
        insights: null,
        provider: config.provider,
        generatedAt: null,
      }
      forceUpdate((n) => n + 1)

      try {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: config.product,
            objective: config.objective,
            segment,
            provider: config.provider,
            keys: config.keys,
          }),
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? `HTTP ${res.status}`)
        }

        const { insights } = await res.json()
        sessions.current[key] = {
          status: 'ready',
          insights: insights as Record<PromptType, string>,
          provider: config.provider,
          generatedAt: new Date(),
        }
      } catch (err) {
        sessions.current[key] = {
          status: 'error',
          insights: null,
          provider: config.provider,
          generatedAt: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      forceUpdate((n) => n + 1)
    },
    []
  )

  const runAll = useCallback(
    (
      segments: string[],
      config: {
        product: string
        objective: string
        provider: Provider
        keys: Partial<ApiKeys>
        openrouterModel: string
      }
    ) => {
      Promise.all(segments.map((seg) => runSegment(seg, config)))
    },
    [runSegment]
  )

  return { getSession, runSegment, runAll, tick }
}
