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
          chat: [],
          staleNodeIds: new Set<string>(),
          inputSnapshot: null,
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
        chat: [],
        staleNodeIds: new Set<string>(),
        inputSnapshot: null,
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
          staleNodeIds: new Set<string>(),
          inputSnapshot: { product: config.product, objective: config.objective, segment },
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

  const augmentDag = useCallback(
    async (
      segment: string,
      provider: Provider,
      additions: { nodes: import('@/lib/types').DagNode[]; edges: import('@/lib/types').DagEdge[] },
      config: RunConfig
    ) => {
      const key = `${segment}:${provider}`
      const session = sessions.current[key]
      if (!session?.dagSpec) return

      // Merge new nodes/edges, skip duplicates by id
      const existingNodeIds = new Set(session.dagSpec.nodes.map((n) => n.id))
      const newNodes = additions.nodes.filter((n) => !existingNodeIds.has(n.id))
      const existingEdgeIds = new Set(session.dagSpec.edges.map((e) => `${e.from}-${e.to}`))
      const newEdges = additions.edges.filter((e) => !existingEdgeIds.has(`${e.from}-${e.to}`))

      if (newNodes.length === 0) return

      const updatedSpec = {
        nodes: [...session.dagSpec.nodes, ...newNodes],
        edges: [...session.dagSpec.edges, ...newEdges],
      }

      sessions.current[key] = { ...session, dagSpec: updatedSpec }
      forceUpdate((n) => n + 1)

      // Run only the new nodes
      const singleNodeSpec = { nodes: newNodes, edges: [] }
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: config.product,
          objective: config.objective,
          segment,
          provider,
          keys: config.keys,
          dagSpec: singleNodeSpec,
        }),
      })

      if (res.ok) {
        const { insights } = await res.json()
        sessions.current[key] = {
          ...sessions.current[key],
          insights: { ...(sessions.current[key].insights ?? {}), ...insights },
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

  const rerunNode = useCallback(
    async (segment: string, provider: Provider, nodeId: string, config: RunConfig) => {
      const key = `${segment}:${provider}`
      const session = sessions.current[key]
      if (!session?.dagSpec) return

      const node = session.dagSpec.nodes.find((n) => n.id === nodeId)
      if (!node) return

      // Mark just this node as loading in the insights map
      sessions.current[key] = {
        ...session,
        insights: { ...(session.insights ?? {}), [nodeId]: '' },
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
            provider,
            keys: config.keys,
            dagSpec: { nodes: [node], edges: [] },
          }),
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? `HTTP ${res.status}`)
        }

        const { insights } = await res.json()
        const cur = sessions.current[key]
        const updatedStale = new Set(cur.staleNodeIds)
        updatedStale.delete(nodeId)
        sessions.current[key] = {
          ...cur,
          insights: { ...(cur.insights ?? {}), ...insights },
          staleNodeIds: updatedStale,
        }
      } catch {
        // restore previous content on error
        const cur = sessions.current[key]
        sessions.current[key] = {
          ...cur,
          insights: { ...(cur.insights ?? {}), [nodeId]: session.insights?.[nodeId] ?? '' },
        }
      }

      forceUpdate((n) => n + 1)
    },
    []
  )

  const markStale = useCallback(
    (segment: string, provider: Provider) => {
      const key = `${segment}:${provider}`
      const session = sessions.current[key]
      if (!session || session.status !== 'ready') return
      const allIds = new Set((session.dagSpec?.nodes ?? []).map((n) => n.id))
      sessions.current[key] = { ...session, staleNodeIds: allIds }
      forceUpdate((n) => n + 1)
    },
    []
  )

  const appendChat = useCallback(
    (segment: string, provider: Provider, message: import('@/lib/types').ChatMessage) => {
      const key = `${segment}:${provider}`
      const session = sessions.current[key]
      if (!session) return
      sessions.current[key] = { ...session, chat: [...session.chat, message] }
      forceUpdate((n) => n + 1)
    },
    []
  )

  const markChatNodeAdded = useCallback(
    (segment: string, provider: Provider, msgIndex: number) => {
      const key = `${segment}:${provider}`
      const session = sessions.current[key]
      if (!session) return
      const chat = session.chat.map((m, i) =>
        i === msgIndex ? { ...m, addedToGraph: true } : m
      )
      sessions.current[key] = { ...session, chat }
      forceUpdate((n) => n + 1)
    },
    []
  )

  return { getSession, planSegment, runSegment, runAll, augmentDag, appendChat, markChatNodeAdded, markStale, rerunNode, tick }
}
