import { NextResponse } from 'next/server'
import { getLLM, getMissingProviderKeyError, resolveProviderKeys, type Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec } from '@/lib/types'
import { parseJsonResponse } from '@/lib/langgraph/response'

function buildPrompt(
  product: string,
  objective: string,
  segment: string,
  region: string,
  dagSpec: DagSpec,
  insights: Record<string, string> | null,
  includeCoords: boolean,
): string {
  const context = dagSpec.nodes
    .map((n) => {
      const text = insights?.[n.id]
      return `• ${n.label}${text ? ': ' + text.slice(0, 220).replace(/\n/g, ' ') : ''}`
    })
    .join('\n')

  const coordField = includeCoords
    ? ',\n  "coordinates": [<longitude_number>, <latitude_number>]'
    : ''

  return `你是一名负责 ${region} 的区域市场分析师。无论输入使用何种语言，所有分析内容都必须使用简体中文。

产品：${product}
目标：${objective}
客户群体：${segment}

已有战略分析：
${context}

请按 0–100 分评估 ${region} 的市场契合度，并给出恰好 3 条简短理由（每条不超过 20 个汉字）。
评分标准：0–25 契合度低 · 26–50 较弱 · 51–75 中等 · 76–100 较强

只返回有效 JSON，不要使用 Markdown。explanation 和 reasons 必须为简体中文：
{
  "pct": <integer 0-100>,
  "explanation": "<用 2–3 句话说明该评分，涵盖市场动态、风险和机会>",
  "reasons": ["<理由 1>", "<理由 2>", "<理由 3>"]${coordField}
}`
}

export async function POST(req: Request) {
  try {
    const {
      product, objective, segment, region,
      dagSpec, insights, provider, keys,
      returnCoordinates = false,
    } = (await req.json()) as {
      product: string
      objective: string
      segment: string
      region: string
      dagSpec: DagSpec
      insights: Record<string, string> | null
      provider: Provider
      keys: Partial<ApiKeys>
      returnCoordinates?: boolean
    }

    if (!product || !region || !dagSpec) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const effectiveKeys = resolveProviderKeys(keys)
    const keyError = getMissingProviderKeyError(provider, effectiveKeys)
    if (keyError) return NextResponse.json({ error: keyError }, { status: 400 })
    const llm = getLLM(provider, effectiveKeys, { jsonMode: true })
    const prompt = buildPrompt(product, objective, segment, region, dagSpec, insights, returnCoordinates)
    const response = await llm.invoke([{ role: 'user', content: prompt }])
    const parsed = parseJsonResponse<{
      pct: number
      explanation: string
      reasons: string[]
      coordinates?: [number, number]
    }>(response.content, '区域分析失败')

    parsed.pct = Math.max(0, Math.min(100, Math.round(parsed.pct)))

    return NextResponse.json(parsed)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '未知错误' },
      { status: 500 },
    )
  }
}
