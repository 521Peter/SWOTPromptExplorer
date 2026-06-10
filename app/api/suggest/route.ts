import { NextResponse } from 'next/server'
import { getLLM } from '@/lib/langgraph/providers'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys } from '@/lib/types'

const PROMPT = (product: string) => `You are a business strategy assistant. Given the product below, return exactly 3 objectives and 3 customer segments in JSON.

Product: ${product}

Rules:
- objectives: concise marketing/business goals (under 8 words each)
- segments: specific customer groups (2-4 words each)
- Return ONLY valid JSON, no markdown, no explanation

Format:
{"objectives":["...","...","..."],"segments":["...","...","..."]}`

export async function POST(req: Request) {
  let body: { product?: string; provider?: Provider; keys?: Partial<ApiKeys> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product, provider = 'openrouter', keys = {} } = body
  if (!product?.trim()) return NextResponse.json({ error: 'product is required' }, { status: 400 })

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
    const llm = getLLM(provider, keys)
    const response = await llm.invoke([{ role: 'user', content: PROMPT(product.trim()) }])
    const raw = response.content as string
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0]) as { objectives?: string[]; segments?: string[] }
    if (!parsed.objectives?.length || !parsed.segments?.length) throw new Error('Empty suggestions')
    return NextResponse.json({
      objectives: parsed.objectives.slice(0, 3),
      segments: parsed.segments.slice(0, 3),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message.split('\n')[0] : 'Suggestion failed'
    console.error('[/api/suggest] failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
