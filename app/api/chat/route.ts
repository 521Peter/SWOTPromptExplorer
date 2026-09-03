import { NextResponse } from 'next/server'
import { getLLM, getMissingProviderKeyError, resolveProviderKeys, type Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, ChatMessage, DagSpec, DagNode, DagEdge } from '@/lib/types'
import { messageContentToText } from '@/lib/langgraph/response'

const ALLOWED_ICONS = [
  'Target', 'TrendingUp', 'AlertTriangle', 'Sparkles', 'Shield',
  'Crosshair', 'User', 'BarChart2', 'Share2', 'Zap', 'Globe',
  'DollarSign', 'Clock', 'Star',
]
const ALLOWED_RELATIONS = ['amplifies', 'informs', 'shapes', 'enables', 'activates']

function buildSystemPrompt(dagSpec: DagSpec, product: string, objective: string, segment: string): string {
  const existingIds = dagSpec.nodes.map((n) => `"${n.id}" (${n.label})`).join(', ')
  return `你是一名战略分析助手，负责协助扩展商业分析 DAG。无论用户使用何种语言，都必须使用简体中文回答。

背景：
- 产品："${product}"
- 目标："${objective}"
- 客户群体："${segment}"
- 已有节点：${existingIds || '无'}

范围限制——你只能回答与上述产品、目标和客户群体直接相关的问题，包括：商业战略、市场分析、竞争格局、客户行为、产品定位、定价、分销、营销、增长和风险等。

如果用户的问题偏离主题（例如个人建议、通用知识、编程帮助、烹饪、政治或其他与当前商业分析无关的内容），只回复以下内容，不要添加其他文字：
"我只能协助分析与 ${product} 和 ${segment} 客群相关的问题。你可以询问定价策略、竞争风险、增长渠道或类似主题。"
不要为偏题问题添加 additions 代码块。

对于相关问题，必须返回两部分：
1. 用简体中文简洁回答用户的问题（2–4 句话）。
2. 建议一个图节点，将回答中的核心洞察整理为独立分析。

对于相关问题，始终在回答末尾追加一个标记为 "additions" 的 JSON 代码块：

\`\`\`additions
{
  "nodes": [
    { "id": "snake_case_id", "label": "中文节点名称", "prompt": "使用简体中文编写的完整自包含分析提示词，其中明确包含产品、目标和客户群体。", "color": "#hexcolor", "iconName": "IconName" }
  ],
  "edges": [
    { "from": "most_relevant_existing_node_id", "to": "new_node_id", "relation": "informs" }
  ]
}
\`\`\`

约束：
- 节点 id 只能包含小写英文和下划线，且不得与以下 id 重复：${dagSpec.nodes.map((n) => n.id).join(', ') || '无'}
- label 和 prompt 必须使用简体中文
- iconName 必须是以下值之一：${ALLOWED_ICONS.join(', ')}
- relation 必须是以下值之一：${ALLOWED_RELATIONS.join(', ')}
- prompt 必须自包含，并明确写出产品、目标和客户群体
- 每次回答只建议 1 个节点
- 边的 "from" 必须是已有节点 id，"to" 必须是新节点 id
- 不得建议修改或删除已有节点`
}

function parseAdditions(raw: string): { reply: string; additions?: { nodes: DagNode[]; edges: DagEdge[] } } {
  const fenceRegex = /```additions\s*([\s\S]*?)```/i
  const match = raw.match(fenceRegex)

  const reply = raw.replace(fenceRegex, '').trim()

  if (!match) return { reply }

  try {
    const parsed = JSON.parse(match[1].trim())
    const nodes: DagNode[] = (parsed.nodes ?? []).map((n: DagNode) => ({
      ...n,
      iconName: ALLOWED_ICONS.includes(n.iconName) ? n.iconName : 'BarChart2',
    }))
    const edges: DagEdge[] = (parsed.edges ?? []).filter(
      (e: DagEdge) => ALLOWED_RELATIONS.includes(e.relation)
    )
    return { reply, additions: { nodes, edges } }
  } catch {
    return { reply }
  }
}

export async function POST(req: Request) {
  let body: {
    message?: string
    dagSpec?: DagSpec
    product?: string
    objective?: string
    segment?: string
    history?: ChatMessage[]
    provider?: Provider
    keys?: Partial<ApiKeys>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求内容不是有效的 JSON' }, { status: 400 })
  }

  const { message, dagSpec, product, objective, segment, history = [], provider, keys = {} } = body

  if (!message || !dagSpec || !product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: '缺少必填字段：message、dagSpec、product、objective、segment 或 provider' },
      { status: 400 }
    )
  }

  const effectiveKeys = resolveProviderKeys(keys)
  const keyError = getMissingProviderKeyError(provider, effectiveKeys)
  if (keyError) return NextResponse.json({ error: keyError }, { status: 400 })

  const llm = getLLM(provider, effectiveKeys)

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(dagSpec, product, objective, segment) },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await llm.invoke(messages)
    const { reply, additions } = parseAdditions(messageContentToText(response.content))
    return NextResponse.json({ reply, additions })
  } catch (err) {
    console.error('[/api/chat] error:', err)
    const msg = err instanceof Error ? err.message.split('\n')[0] : '对话请求失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
