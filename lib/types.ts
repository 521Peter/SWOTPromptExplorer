import type { LucideIcon } from 'lucide-react'
import type { EdgeRelation, Provider } from './tokens'

export type { EdgeRelation }

export type PromptType =
  | 'marketingOKRs'
  | 'strengths'
  | 'weaknesses'
  | 'opportunities'
  | 'threats'
  | 'marketPositioning'
  | 'buyerPersona'
  | 'investmentOpportunities'
  | 'channelsDistribution'

export interface CausalEdge {
  to?: PromptType
  from?: PromptType
  label: EdgeRelation
}

export interface PromptMeta {
  label: string
  icon: LucideIcon
  color: string
  prompt: (product: string, objective: string, segment: string) => string
  causalEdges: CausalEdge[]
}

export interface SegmentSession {
  status: 'idle' | 'loading' | 'ready' | 'error'
  insights: Record<PromptType, string> | null
  provider: Provider
  generatedAt: Date | null
  error?: string
}

export interface DagNode {
  id: string
  label: string
  prompt: string
  color: string
  iconName: string
}

export interface DagEdge {
  from: string
  to: string
  relation: EdgeRelation
}

export interface DagSpec {
  nodes: DagNode[]
  edges: DagEdge[]
}

export interface ApiKeys {
  anthropic: string
  openai: string
  groq: string
  openrouter: string
  openrouterModel: string
}
