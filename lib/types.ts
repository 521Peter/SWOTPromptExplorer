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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  additions?: { nodes: DagNode[]; edges: DagEdge[] }
}

export interface SegmentSession {
  status: 'idle' | 'planning' | 'loading' | 'ready' | 'error'
  dagSpec: DagSpec | null
  insights: Record<string, string> | null
  provider: Provider
  generatedAt: Date | null
  error?: string
  chat: ChatMessage[]
  staleNodeIds: Set<string>
  inputSnapshot: { product: string; objective: string; segment: string } | null
}

export interface ApiKeys {
  anthropic: string
  openai: string
  groq: string
  openrouter: string
  openrouterModel: string
}
