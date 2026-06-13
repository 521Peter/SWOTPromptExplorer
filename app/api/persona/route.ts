import { NextResponse } from 'next/server'
import { getLLM } from '@/lib/langgraph/providers'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec } from '@/lib/types'

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

  return `You are a regional market analyst for ${region}.

Product: ${product}
Objective: ${objective}
Customer Segment: ${segment}

Existing strategic analysis:
${context}

Rate the market fit for ${region} on a 0–100 scale and give exactly 3 concise reasons (max 12 words each).
Scoring: 0–25 poor fit · 26–50 weak · 51–75 moderate · 76–100 strong

Respond with valid JSON only, no markdown:
{
  "pct": <integer 0-100>,
  "explanation": "<2-3 sentence narrative on why this region has this fit score, covering market dynamics, risks, and opportunity>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"]${coordField}
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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const llm = getLLM(provider, keys)
    const prompt = buildPrompt(product, objective, segment, region, dagSpec, insights, returnCoordinates)
    const response = await llm.invoke([{ role: 'user', content: prompt }])
    const text = typeof response.content === 'string' ? response.content : String(response.content)

    let parsed: { pct: number; explanation: string; reasons: string[]; coordinates?: [number, number] }
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('No JSON in LLM response')
      parsed = JSON.parse(m[0])
    }

    parsed.pct = Math.max(0, Math.min(100, Math.round(parsed.pct)))

    return NextResponse.json(parsed)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
