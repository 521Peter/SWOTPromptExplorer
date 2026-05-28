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
    const message = err instanceof Error ? err.message : 'LLM invocation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
