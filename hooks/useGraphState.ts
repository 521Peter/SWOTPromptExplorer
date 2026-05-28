'use client'

import { useState } from 'react'
import type { Provider } from '@/lib/langgraph/providers'

interface GraphState {
  activeLayer: 'segment' | 'insight'
  activeSegment: string | null
  selectedNode: string | null
  provider: Provider
}

export function useGraphState(initialProvider: Provider = 'openrouter') {
  const [state, setState] = useState<GraphState>({
    activeLayer: 'segment',
    activeSegment: null,
    selectedNode: null,
    provider: initialProvider,
  })

  const setLayer = (layer: 'segment' | 'insight') =>
    setState((s) => ({ ...s, activeLayer: layer }))

  const selectSegment = (segment: string) =>
    setState((s) => ({ ...s, activeSegment: segment, activeLayer: 'insight', selectedNode: null }))

  const selectNode = (nodeId: string | null) =>
    setState((s) => ({ ...s, selectedNode: nodeId }))

  const backToSegments = () =>
    setState((s) => ({ ...s, activeLayer: 'segment', activeSegment: null, selectedNode: null }))

  const setProvider = (provider: Provider) =>
    setState((s) => ({ ...s, provider }))

  return { state, setLayer, selectSegment, selectNode, backToSegments, setProvider }
}
