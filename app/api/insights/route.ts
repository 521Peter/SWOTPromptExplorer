import { NextResponse } from 'next/server'
import { buildInsightGraph } from '@/lib/langgraph/graph'
import type { Provider } from '@/lib/langgraph/providers'
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
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { product, objective, segment, provider, keys = {}, dagSpec } = body

  if (!product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: 'Missing required fields: product, objective, segment, provider' },
      { status: 400 }
    )
  }

  if (!dagSpec) {
    return NextResponse.json({ error: 'dagSpec required' }, { status: 400 })
  }

  const effectiveKeys = { ...keys, openrouter: keys?.openrouter || process.env.DEFAULT_OPENROUTER_KEY || '' }

  if (provider === 'openrouter' && !effectiveKeys.openrouter) {
    return NextResponse.json({ error: 'OpenRouter API key is missing. Open Settings and enter your key.' }, { status: 400 })
  }
  if (provider === 'openai' && !keys?.openai) {
    return NextResponse.json({ error: 'OpenAI API key is missing. Open Settings and enter your key.' }, { status: 400 })
  }
  if (provider === 'claude' && !keys?.anthropic) {
    return NextResponse.json({ error: 'Anthropic API key is missing. Open Settings and enter your key.' }, { status: 400 })
  }
  if (provider === 'groq' && !keys?.groq) {
    return NextResponse.json({ error: 'Groq API key is missing. Open Settings and enter your key.' }, { status: 400 })
  }

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
