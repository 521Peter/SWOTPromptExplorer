import { NextResponse } from 'next/server'

const MODELS = ['meta-llama/llama-3.2-3b-instruct:free', 'openai/gpt-4o-mini']

const PROMPT = (product: string, objective: string, segments: string[]) => `You are a business analyst validating form inputs. For each input decide: is it a real, meaningful business term, or is it gibberish/nonsense?

Inputs:
- product: "${product}"
- objective: "${objective}"
- segments: ${JSON.stringify(segments)}

Definitions:
- Valid product: a real product, service, app, brand, company, or industry category (e.g. "Electric Cars", "Notion", "SaaS CRM", "Nike shoes")
- Valid objective: a genuine business goal sentence (e.g. "Increase brand awareness", "Reduce churn by 20%")
- Valid segment: a recognisable customer group (e.g. "Enterprise teams", "Gen Z consumers", "Solo founders")
- Invalid: random letters, nonsense words (e.g. "yywiwisis", "asdfgh"), keyboard mash, or meaningless strings

For each field respond with "ok" if valid, or a short user-facing error message (max 8 words) if invalid.
If segments array is empty respond with an empty array.

Respond ONLY with valid JSON, no markdown, no explanation:
{"product":"ok","objective":"ok","segments":[]}`

async function callModel(model: string, product: string, objective: string, segments: string[], apiKey: string) {
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
      messages: [{ role: 'user', content: PROMPT(product, objective, segments) }],
      max_tokens: 128,
      temperature: 0,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = `OpenRouter ${res.status}`
    try { msg = JSON.parse(text)?.error?.message ?? msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0]) as { product: string; objective: string; segments: string[] }
}

export async function POST(req: Request) {
  let body: { product?: string; objective?: string; segments?: string[]; openrouterKey?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { product = '', objective = '', segments = [], openrouterKey } = body
  const apiKey = openrouterKey || process.env.NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key required.' }, { status: 400 })

  let result: { product: string; objective: string; segments: string[] } | null = null
  let lastError = 'Validation failed'

  for (const model of MODELS) {
    try {
      result = await callModel(model, product, objective, segments, apiKey)
      break
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[/api/validate] ${model} failed:`, lastError)
    }
  }

  if (!result) return NextResponse.json({ error: lastError }, { status: 500 })

  // Build field-level errors — anything not "ok" is an error message
  const errors: { product?: string; objective?: string; segments?: string[] } = {}
  if (product !== '__trusted__' && result.product && result.product !== 'ok')
    errors.product = `"${product}" doesn't look like a real product. Please enter a valid product name.`
  if (objective !== '__trusted__' && result.objective && result.objective !== 'ok')
    errors.objective = `"${objective}" doesn't look like a real objective. Please enter a valid business goal.`
  const segErrors = (result.segments ?? [])
    .map((s, i) => s !== 'ok' ? `"${segments[i]}" doesn't look like a real customer segment.` : null)
    .filter(Boolean) as string[]
  if (segErrors.length) errors.segments = segErrors

  return NextResponse.json({ valid: Object.keys(errors).length === 0, errors })
}
