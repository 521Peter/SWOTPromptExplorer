import { NextResponse } from 'next/server'
import { buildInsightGraph } from '@/lib/langgraph/graph'
import { getMissingProviderKeyError, resolveProviderKeys, type Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec } from '@/lib/types'

export async function POST(req: Request) {
  let body: {
    product?: string
    objective?: string
    segment?: string
    provider?: Provider
    keys?: Partial<ApiKeys>
    dagSpec?: DagSpec
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求内容不是有效的 JSON' }, { status: 400 })
  }

  const { product, objective, segment, provider, keys = {}, dagSpec } = body

  if (!product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: '缺少必填字段：product、objective、segment 或 provider' },
      { status: 400 }
    )
  }

  if (!dagSpec) {
    return NextResponse.json({ error: '缺少 dagSpec' }, { status: 400 })
  }

  const effectiveKeys = resolveProviderKeys(keys)
  const keyError = getMissingProviderKeyError(provider, effectiveKeys)
  if (keyError) return NextResponse.json({ error: keyError }, { status: 400 })

  try {
    const graph = buildInsightGraph(provider, effectiveKeys, dagSpec)
    const result = await graph.invoke({ product, objective, segment, provider, dagSpec, outputs: {} })

    return NextResponse.json({
      segment,
      provider,
      insights: result.outputs as Record<string, string>,
    })
  } catch (err) {
    console.error('[/api/insights] LLM error:', err)
    return NextResponse.json({ error: extractMessage(err) }, { status: 500 })
  }
}

function extractMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed?.error?.message) return parsed.error.message
      if (parsed?.message) return parsed.message
    } catch { /* not valid JSON, fall through */ }
  }
  return raw.split('\n')[0].replace(/\s*Troubleshooting URL:.*$/, '').trim()
}
