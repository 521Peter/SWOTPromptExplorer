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
    label: '营销 OKR',
    icon: Target,
    color: '#8B5CF6',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
请为“${s}”客户群体制定 3 个可衡量的营销 OKR。
要求具体、量化且有明确时限，并使用简体中文 Markdown 编号列表。`,
    causalEdges: [],
  },

  strengths: {
    label: '优势',
    icon: TrendingUp,
    color: '#10B981',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
“${p}”的哪些产品优势对“${s}”客户群体最重要？
请使用简体中文给出具体而非空泛的 Markdown 列表。`,
    causalEdges: [{ to: 'investmentOpportunities', label: 'enables' }],
  },

  weaknesses: {
    label: '劣势',
    icon: AlertTriangle,
    color: '#EF4444',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
“${p}”面向“${s}”客户群体时有哪些关键劣势？
请坦诚、具体地使用简体中文 Markdown 列表回答。`,
    causalEdges: [],
  },

  opportunities: {
    label: '机会',
    icon: Sparkles,
    color: '#3B82F6',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
“${p}”在“${s}”客户群体中存在哪些市场机会？
重点分析未满足需求和新兴趋势，并使用简体中文 Markdown 列表。`,
    causalEdges: [{ to: 'marketingOKRs', label: 'informs' }],
  },

  threats: {
    label: '威胁',
    icon: Shield,
    color: '#F59E0B',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
哪些外部威胁可能损害“${p}”在“${s}”客户群体中的市场地位？
请涵盖竞争、监管和行为风险，并使用简体中文 Markdown 列表。`,
    causalEdges: [{ to: 'weaknesses', label: 'amplifies' }],
  },

  marketPositioning: {
    label: '市场定位',
    icon: Crosshair,
    color: '#06B6D4',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
“${p}”应如何面向“${s}”客户群体进行市场定位？
请使用简体中文提出清晰的定位陈述和差异化角度，并用 Markdown 排版。`,
    causalEdges: [],
  },

  buyerPersona: {
    label: '买家画像',
    icon: User,
    color: '#EC4899',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
请描述“${p}”在“${s}”客户群体中的理想买家画像。
使用简体中文涵盖人口特征、动机、痛点和购买触发因素，并用 Markdown 排版。`,
    causalEdges: [{ to: 'marketPositioning', label: 'shapes' }],
  },

  investmentOpportunities: {
    label: '投资机会',
    icon: BarChart2,
    color: '#84CC16',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
“${s}”客户群体为“${p}”带来哪些投资或资源配置机会？
重点分析投资回报潜力和战略优先级，并使用简体中文 Markdown 列表。`,
    causalEdges: [],
  },

  channelsDistribution: {
    label: '渠道与分销',
    icon: Share2,
    color: '#F97316',
    prompt: (p, o, s) =>
      `产品：“${p}”。目标：“${o}”。
触达“${s}”客户群体并向其分销“${p}”的最有效渠道是什么？
请涵盖数字、线下和合作伙伴渠道，并使用简体中文 Markdown 列表。`,
    causalEdges: [{ to: 'marketingOKRs', label: 'activates' }],
  },
}
