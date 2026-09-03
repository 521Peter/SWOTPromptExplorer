import { NextResponse } from 'next/server'
import { getLLM, getMissingProviderKeyError, resolveProviderKeys, type Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'
import { parseJsonResponse } from '@/lib/langgraph/response'

const PROMPT = (product: string) => `你是一名商业战略助手。根据下方产品，提供恰好 3 个业务目标和 3 个客户群体，并使用简体中文填写所有内容。

产品：${product}

规则：
- objectives：简洁的营销或业务目标，每项不超过 15 个汉字
- segments：具体的客户群体，每项不超过 10 个汉字
- 品牌名、产品名和必要的专业缩写可保留原文
- 只返回有效 JSON，不要使用 Markdown，也不要解释

格式：
{"objectives":["...","...","..."],"segments":["...","...","..."]}`

export async function POST(req: Request) {
  let body: { product?: string; provider?: Provider; keys?: Partial<ApiKeys> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求内容不是有效的 JSON' }, { status: 400 })
  }

  const { product, provider = 'openrouter', keys = {} } = body
  if (!product?.trim()) return NextResponse.json({ error: '请填写产品名称' }, { status: 400 })

  const effectiveKeys = resolveProviderKeys(keys)
  const keyError = getMissingProviderKeyError(provider, effectiveKeys)
  if (keyError) return NextResponse.json({ error: keyError }, { status: 400 })

  try {
    const llm = getLLM(provider, effectiveKeys, { jsonMode: true })
    const response = await llm.invoke([{ role: 'user', content: PROMPT(product.trim()) }])
    const parsed = parseJsonResponse<{ objectives?: string[]; segments?: string[] }>(
      response.content,
      '生成建议失败',
    )
    if (!parsed.objectives?.length || !parsed.segments?.length) throw new Error('模型未返回有效建议')
    return NextResponse.json({
      objectives: parsed.objectives.slice(0, 3),
      segments: parsed.segments.slice(0, 3),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message.split('\n')[0] : '生成建议失败'
    console.error('[/api/suggest] failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
