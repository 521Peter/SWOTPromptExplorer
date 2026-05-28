import {
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Shield,
  Crosshair,
  User,
  BarChart2,
  Share2,
} from 'lucide-react'
import type { PromptMeta, PromptType } from '@/lib/types'

export const PROMPT_CONFIG: Record<PromptType, PromptMeta> = {
  marketingOKRs: {
    label: 'Marketing OKRs',
    icon: Target,
    color: '#8B5CF6',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
Give 3 measurable marketing OKRs for the "${s}" segment.
Be specific, quantified, and time-bound. Use markdown numbered list.`,
    causalEdges: [],
  },

  strengths: {
    label: 'Strengths',
    icon: TrendingUp,
    color: '#10B981',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What product strengths of "${p}" matter most to the "${s}" segment?
Be concrete, not generic. Markdown bullet list.`,
    causalEdges: [{ to: 'investmentOpportunities', label: 'enables' }],
  },

  weaknesses: {
    label: 'Weaknesses',
    icon: AlertTriangle,
    color: '#EF4444',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What are the key weaknesses of "${p}" for the "${s}" segment?
Be honest and specific. Markdown bullet list.`,
    causalEdges: [{ from: 'threats', label: 'amplifies' }],
  },

  opportunities: {
    label: 'Opportunities',
    icon: Sparkles,
    color: '#3B82F6',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What market opportunities exist for "${p}" with the "${s}" segment?
Focus on untapped demand and emerging trends. Markdown bullet list.`,
    causalEdges: [{ to: 'marketingOKRs', label: 'informs' }],
  },

  threats: {
    label: 'Threats',
    icon: Shield,
    color: '#F59E0B',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What external threats could hurt "${p}"'s position with the "${s}" segment?
Include competitive, regulatory, and behavioral risks. Markdown bullet list.`,
    causalEdges: [{ to: 'weaknesses', label: 'amplifies' }],
  },

  marketPositioning: {
    label: 'Market Positioning',
    icon: Crosshair,
    color: '#06B6D4',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
How should "${p}" be positioned in the market for the "${s}" segment?
Suggest a clear positioning statement and differentiation angle. Markdown.`,
    causalEdges: [{ from: 'buyerPersona', label: 'shapes' }],
  },

  buyerPersona: {
    label: 'Buyer Persona',
    icon: User,
    color: '#EC4899',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
Describe the ideal buyer persona within the "${s}" segment for "${p}".
Include: demographics, motivations, pain points, buying triggers. Markdown.`,
    causalEdges: [{ to: 'marketPositioning', label: 'shapes' }],
  },

  investmentOpportunities: {
    label: 'Investment Opportunities',
    icon: BarChart2,
    color: '#84CC16',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What investment or resource-allocation opportunities does the "${s}" segment represent for "${p}"?
Focus on ROI potential and strategic priority. Markdown bullet list.`,
    causalEdges: [],
  },

  channelsDistribution: {
    label: 'Channels & Distribution',
    icon: Share2,
    color: '#F97316',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
What are the most effective channels to reach and distribute "${p}" to the "${s}" segment?
Include digital, physical, and partnership channels. Markdown bullet list.`,
    causalEdges: [{ to: 'marketingOKRs', label: 'activates' }],
  },
}
