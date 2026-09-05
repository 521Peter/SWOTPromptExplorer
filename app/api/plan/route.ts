import { NextResponse } from 'next/server'
import { getLLM, getMissingProviderKeyError, resolveProviderKeys, type Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec } from '@/lib/types'
import { parseJsonResponse } from '@/lib/langgraph/response'

const ALLOWED_ICONS = [
  'Target', 'TrendingUp', 'AlertTriangle', 'Sparkles', 'Shield',
  'Crosshair', 'User', 'BarChart2', 'Share2', 'Zap', 'Globe',
  'DollarSign', 'Clock', 'Star',
]

const ALLOWED_RELATIONS = ['amplifies', 'informs', 'shapes', 'enables', 'activates']

const SYSTEM_PROMPT = `你是一名战略分析架构师，负责为商业战略设计定制分析 DAG。
所有面向用户的内容（包括节点 label 和 prompt）必须使用简体中文；品牌名、产品名及必要缩写可以保留原文。
始终只返回有效 JSON，不要使用 Markdown 代码块，也不要解释。`

function buildUserPrompt(product: string, objective: string, segment: string): string {
  return `请为以下商业场景设计定制分析 DAG：

产品："${product}"
目标："${objective}"
客户群体："${segment}"

规则：
- 返回 6–10 个节点，每个节点代表互不重叠的独立分析视角。
- 选择与当前产品、目标和客户群体最相关的节点。
- 不要机械套用通用 SWOT 清单，应选择真正重要的分析维度。
- 边表示分析之间的逻辑或因果依赖。
- 每个节点 id 必须唯一，只能使用小写英文和下划线（例如 "price_sensitivity"）。
- label 必须是简洁、自然的简体中文。
- prompt 必须使用简体中文且自包含，在其中明确写出产品、目标和客户群体，并要求最终分析使用简体中文。
- iconName 必须是以下值之一：${ALLOWED_ICONS.join(', ')}
- relation 必须是以下值之一：${ALLOWED_RELATIONS.join(', ')}
- 边仅用于展示，保持精简且有意义，最多 2–5 条。
- 边的 "from" 和 "to" 必须引用已有节点 id。

只返回以下结构的 JSON：
{
  "nodes": [
    { "id": "string", "label": "string", "prompt": "string", "color": "#hex", "iconName": "string" }
  ],
  "edges": [
    { "from": "string", "to": "string", "relation": "string" }
  ]
}`
}

function parseDagSpec(content: Parameters<typeof parseJsonResponse>[0]): DagSpec {
  const parsed = parseJsonResponse<DagSpec>(content, 'DAG 规划失败')

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('DAG 结构必须包含 nodes[] 和 edges[] 数组')
  }

  const nodeIds = new Set<string>()
  for (const n of parsed.nodes) {
    if (!n.id || !n.label || !n.prompt || !n.color || !n.iconName) {
      throw new Error(`节点缺少必填字段：${JSON.stringify(n)}`)
    }
    nodeIds.add(n.id)
    if (!ALLOWED_ICONS.includes(n.iconName)) n.iconName = 'BarChart2'
  }

  for (const e of parsed.edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) {
      throw new Error(`边引用了未知节点：${e.from} -> ${e.to}`)
    }
    if (!ALLOWED_RELATIONS.includes(e.relation)) {
      throw new Error(`未知的边关系：${e.relation}`)
    }
  }

  return parsed as DagSpec
}

export async function POST(req: Request) {
  let body: {
    product?: string
    objective?: string
    segment?: string
    provider?: Provider
    keys?: Partial<ApiKeys>
    openrouterModel?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求内容不是有效的 JSON' }, { status: 400 })
  }

  const { product, objective, segment, provider, keys = {} } = body

  if (!product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: '缺少必填字段：product、objective、segment 或 provider' },
      { status: 400 }
    )
  }

  const effectiveKeys = resolveProviderKeys(keys)
  const keyError = getMissingProviderKeyError(provider, effectiveKeys)
  if (keyError) return NextResponse.json({ error: keyError }, { status: 400 })

  const llm = getLLM(provider, effectiveKeys, { jsonMode: true })
  const userPrompt = buildUserPrompt(product, objective, segment)

  // 最多尝试 2 次，因为大模型偶尔会输出格式略有问题的 JSON
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await llm.invoke([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ])

      const dagSpec = parseDagSpec(response.content)
      return NextResponse.json({ dagSpec })
    } catch (err) {
      if (attempt === 2) {
        console.error('[/api/plan] Failed after 2 attempts:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : '生成 DAG 分析规划失败' },
          { status: 500 }
        )
      }
    }
  }
}
