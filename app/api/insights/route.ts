import { NextResponse } from 'next/server'
import { buildInsightGraph } from '@/lib/langgraph/graph'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, PromptType } from '@/lib/types'

export async function POST(req: Request) {
  let body: {
    product?: string
    objective?: string
    segment?: string
    provider?: Provider
    keys?: Partial<ApiKeys>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { product, objective, segment, provider, keys = {} } = body

  if (!product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: 'Missing required fields: product, objective, segment, provider' },
      { status: 400 }
    )
  }

  // Reject clearly empty keys rather than letting the LLM call fail opaquely
  if (provider === 'openrouter' && !keys?.openrouter) {
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
    const graph = buildInsightGraph(provider, keys)
    const result = await graph.invoke({ product, objective, segment, provider })

    // Strip input fields, return only the 9 insight keys
    const { product: _p, objective: _o, segment: _s, provider: _pr, ...insights } = result

    return NextResponse.json({
      segment,
      provider,
      insights: insights as Record<PromptType, string>,
    })
  } catch (err) {
    console.error('[/api/insights] LLM error:', err)
    const e = err as Record<string, unknown>
    const taskErrors = Array.isArray(e?.errors)
      ? (e.errors as Error[]).map((x) => x?.message ?? String(x))
      : null
    const message = err instanceof Error ? err.message : 'LLM invocation failed'
    const first = taskErrors?.[0] ?? message
    return NextResponse.json({ error: first }, { status: 500 })
  }
}
