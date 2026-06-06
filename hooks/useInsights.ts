'use client'

import { useRef, useState, useCallback } from 'react'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec, SegmentSession } from '@/lib/types'

type RunConfig = {
  product: string
  objective: string
  provider: Provider
  keys: Partial<ApiKeys>
  openrouterModel: string
  force?: boolean
}

export function useInsights() {
  const sessions = useRef<Record<string, SegmentSession>>({})
  const [tick, forceUpdate] = useState(0)

  const getSession = useCallback(
    (segment: string, provider: Provider): SegmentSession => {
      const key = `${segment}:${provider}`
      return (
        sessions.current[key] ?? {
          status: 'idle',
          dagSpec: null,
          insights: null,
          provider,
          generatedAt: null,
        }
      )
    },
    []
  )

  const planSegment = useCallback(
    async (segment: string, config: RunConfig): Promise<DagSpec | null> => {
      const key = `${segment}:${config.provider}`

      sessions.current[key] = {
        ...sessions.current[key],
        status: 'planning',
        dagSpec: null,
        insights: null,
        provider: config.provider,
        generatedAt: null,
        error: undefined,
      }
      forceUpdate((n) => n + 1)

      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: config.product,
            objective: config.objective,
            segment,
            provider: config.provider,
            keys: config.keys,
            openrouterModel: config.openrouterModel,
          }),
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? `HTTP ${res.status}`)
        }

        const { dagSpec } = await res.json()
        sessions.current[key] = { ...sessions.current[key], dagSpec }
        forceUpdate((n) => n + 1)
        return dagSpec as DagSpec
      } catch (err) {
        sessions.current[key] = {
          ...sessions.current[key],
          status: 'error',
          error: err instanceof Error ? err.message : 'Planning failed',
        }
        forceUpdate((n) => n + 1)
        return null
      }
    },
    []
  )

  const runSegment = useCallback(
    async (segment: string, config: RunConfig) => {
      const key = `${segment}:${config.provider}`
      const session = sessions.current[key]

      if (!config.force && session?.status === 'ready') return

      const dagSpec = session?.dagSpec
      if (!dagSpec) {
        console.error('[useInsights] runSegment called before planSegment completed')
        return
      }

      sessions.current[key] = {
        ...session,
        status: 'loading',
        insights: null,
        generatedAt: null,
        error: undefined,
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
            dagSpec,
          }),
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? `HTTP ${res.status}`)
        }

        const { insights } = await res.json()
        sessions.current[key] = {
          ...session,
          status: 'ready',
          insights: insights as Record<string, string>,
          generatedAt: new Date(),
          error: undefined,
        }
      } catch (err) {
        sessions.current[key] = {
          ...session,
          status: 'error',
          insights: null,
          generatedAt: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      forceUpdate((n) => n + 1)
    },
    []
  )

  const runAll = useCallback(
    (segments: string[], config: RunConfig) => {
      Promise.all(
        segments.map(async (seg) => {
          const dagSpec = await planSegment(seg, config)
          if (dagSpec) await runSegment(seg, config)
        })
      )
    },
    [planSegment, runSegment]
  )

  return { getSession, planSegment, runSegment, runAll, tick }
}
