import { NextResponse } from 'next/server'

// Try free model first, fall back to the standard cheap model
const MODELS = ['meta-llama/llama-3.2-3b-instruct:free', 'openai/gpt-4o-mini']

const PROMPT = (product: string) => `You are a business strategy assistant. Given the product below, return exactly 3 objectives and 3 customer segments in JSON.

Product: ${product}

Rules:
- objectives: concise marketing/business goals (under 8 words each)
- segments: specific customer groups (2-4 words each)
- Return ONLY valid JSON, no markdown, no explanation

Format:
{"objectives":["...","...","..."],"segments":["...","...","..."]}`

async function callModel(model: string, product: string, apiKey: string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swot-explorer.vercel.app',
      'X-Title': 'SWOT Prompt Explorer',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: PROMPT(product) }],
      max_tokens: 256,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let message = `OpenRouter ${res.status}`
    try {
      const parsed = JSON.parse(errText)
      message = parsed?.error?.message ?? parsed?.message ?? message
    } catch { /* not JSON */ }
    throw new Error(message)
  }

  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  const parsed = JSON.parse(jsonMatch[0]) as { objectives?: string[]; segments?: string[] }
  if (!parsed.objectives?.length || !parsed.segments?.length) throw new Error('Empty suggestions')
  return {
    objectives: parsed.objectives.slice(0, 3),
    segments: parsed.segments.slice(0, 3),
  }
}

export async function POST(req: Request) {
  let body: { product?: string; openrouterKey?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product, openrouterKey } = body
  if (!product?.trim()) return NextResponse.json({ error: 'product is required' }, { status: 400 })

  const apiKey = openrouterKey || process.env.NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key is required for suggestions.' }, { status: 400 })

  let lastError = 'Suggestion failed'
  for (const model of MODELS) {
    try {
      const result = await callModel(model, product.trim(), apiKey)
      return NextResponse.json(result)
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[/api/suggest] ${model} failed:`, lastError)
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 })
}
