import { useState, useCallback } from 'react'
import type { DagSpec } from '@/lib/types'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

export interface RegionResult {
  id: string
  name: string
  coordinates: [number, number]
  color: string
  pct: number
  explanation: string
  reasons: string[]
  status: 'loading' | 'ready' | 'error'
  error?: string
}

interface PersonaSession {
  active: boolean
  regions: Record<string, RegionResult>
}

export interface RunConfig {
  product: string
  objective: string
  dagSpec: DagSpec
  insights: Record<string, string> | null
  provider: Provider
  keys: Partial<ApiKeys>
}

const PRESET_REGIONS: Omit<RegionResult, 'pct' | 'explanation' | 'reasons' | 'status'>[] = [
  { id: 'na',     name: 'North America', coordinates: [-98,  42], color: '#3B82F6' },
  { id: 'eu',     name: 'Europe',        coordinates: [ 12,  52], color: '#8B5CF6' },
  { id: 'sea',    name: 'SE Asia',       coordinates: [112,   6], color: '#10B981' },
  { id: 'india',  name: 'India',         coordinates: [ 79,  20], color: '#F97316' },
  { id: 'china',  name: 'China',         coordinates: [104,  35], color: '#EF4444' },
  { id: 'latam',  name: 'Latin America', coordinates: [-58, -14], color: '#EC4899' },
  { id: 'mena',   name: 'Middle East',   coordinates: [ 44,  26], color: '#EAB308' },
  { id: 'africa', name: 'Africa',        coordinates: [ 20,   3], color: '#6366F1' },
]

function sessionKey(segment: string, provider: Provider) {
  return `${segment}::${provider}`
}

export function usePersona() {
  const [state, setState] = useState<Record<string, PersonaSession>>({})

  function getPersonaSession(segment: string, provider: Provider): PersonaSession {
    return state[sessionKey(segment, provider)] ?? { active: false, regions: {} }
  }

  async function callApi(
    k: string,
    segment: string,
    regionId: string,
    regionName: string,
    coordinates: [number, number],
    color: string,
    config: RunConfig,
    returnCoordinates = false,
  ) {
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: config.product,
          objective: config.objective,
          segment,
          region: regionName,
          dagSpec: config.dagSpec,
          insights: config.insights,
          provider: config.provider,
          keys: config.keys,
          returnCoordinates,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { pct: number; explanation: string; reasons: string[]; coordinates?: [number, number] }
      setState((prev) => ({
        ...prev,
        [k]: {
          ...prev[k],
          regions: {
            ...prev[k]?.regions,
            [regionId]: {
              id: regionId, name: regionName, color,
              coordinates: data.coordinates ?? coordinates,
              pct: data.pct, explanation: data.explanation ?? '', reasons: data.reasons, status: 'ready',
            },
          },
        },
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        [k]: {
          ...prev[k],
          regions: {
            ...prev[k]?.regions,
            [regionId]: {
              id: regionId, name: regionName, color, coordinates,
              pct: 0, explanation: '', reasons: [], status: 'error',
              error: err instanceof Error ? err.message : 'Failed',
            },
          },
        },
      }))
    }
  }

  const runPersona = useCallback(async (segment: string, config: RunConfig) => {
    const k = sessionKey(segment, config.provider)
    const initial: Record<string, RegionResult> = {}
    PRESET_REGIONS.forEach((r) => {
      initial[r.id] = { ...r, pct: 0, explanation: '', reasons: [], status: 'loading' }
    })
    setState((prev) => ({ ...prev, [k]: { active: true, regions: initial } }))
    await Promise.all(
      PRESET_REGIONS.map((r) => callApi(k, segment, r.id, r.name, r.coordinates, r.color, config)),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCustomRegion = useCallback(async (
    segment: string,
    config: RunConfig,
    regionName: string,
  ) => {
    const k = sessionKey(segment, config.provider)
    const regionId = `custom_${regionName.toLowerCase().replace(/\s+/g, '_')}`
    const color = '#A78BFA'
    setState((prev) => ({
      ...prev,
      [k]: {
        ...(prev[k] ?? { active: true, regions: {} }),
        regions: {
          ...prev[k]?.regions,
          [regionId]: { id: regionId, name: regionName, coordinates: [0, 0], color, pct: 0, explanation: '', reasons: [], status: 'loading' },
        },
      },
    }))
    await callApi(k, segment, regionId, regionName, [0, 0], color, config, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { getPersonaSession, runPersona, addCustomRegion }
}
