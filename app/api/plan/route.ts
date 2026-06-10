import { NextResponse } from 'next/server'
import { getLLM } from '@/lib/langgraph/providers'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, DagSpec } from '@/lib/types'

const ALLOWED_ICONS = [
  'Target', 'TrendingUp', 'AlertTriangle', 'Sparkles', 'Shield',
  'Crosshair', 'User', 'BarChart2', 'Share2', 'Zap', 'Globe',
  'DollarSign', 'Clock', 'Star',
]

const ALLOWED_RELATIONS = ['amplifies', 'informs', 'shapes', 'enables', 'activates']

const SYSTEM_PROMPT = `You are a strategic analysis architect. Design custom analysis DAGs for business strategy.
Always respond with valid JSON only — no markdown fences, no explanation.`

function buildUserPrompt(product: string, objective: string, segment: string): string {
  return `Design a custom analysis DAG for this business context:

Product: "${product}"
Objective: "${objective}"
Segment: "${segment}"

Rules:
- Return 6-10 nodes. Each node is a distinct, non-overlapping analysis lens.
- Choose nodes that are most relevant to THIS specific product, objective, and segment.
- Do not default to a generic SWOT list — pick what genuinely matters here.
- Edges represent logical/causal dependencies between analyses.
- Every node id must be unique, lowercase, underscore-separated (e.g. "price_sensitivity").
- iconName must be one of: ${ALLOWED_ICONS.join(', ')}
- relation must be one of: ${ALLOWED_RELATIONS.join(', ')}
- Edges are display-only; keep them sparse and meaningful (2-5 edges max).
- All edge "from" and "to" values must reference existing node ids.
- Prompts should be self-contained — include the product, objective, and segment inline.

Return ONLY this JSON shape:
{
  "nodes": [
    { "id": "string", "label": "string", "prompt": "string", "color": "#hex", "iconName": "string" }
  ],
  "edges": [
    { "from": "string", "to": "string", "relation": "string" }
  ]
}`
}

function parseDagSpec(raw: string): DagSpec {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(cleaned)

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('DagSpec must have nodes[] and edges[] arrays')
  }

  const nodeIds = new Set<string>()
  for (const n of parsed.nodes) {
    if (!n.id || !n.label || !n.prompt || !n.color || !n.iconName) {
      throw new Error(`Node missing required fields: ${JSON.stringify(n)}`)
    }
    nodeIds.add(n.id)
    if (!ALLOWED_ICONS.includes(n.iconName)) n.iconName = 'BarChart2'
  }

  for (const e of parsed.edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) {
      throw new Error(`Edge references unknown node: ${e.from} -> ${e.to}`)
    }
    if (!ALLOWED_RELATIONS.includes(e.relation)) {
      throw new Error(`Unknown edge relation: ${e.relation}`)
    }
  }

  return parsed as DagSpec
}

export async function POST(req: Request) {
  let body: {
    product?: string
    objective?: string
    segment?: string
    provider?: Provider
    keys?: Partial<ApiKeys>
    openrouterModel?: string
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

  const llm = getLLM(provider, keys)
  const userPrompt = buildUserPrompt(product, objective, segment)

  // Try up to 2 times — LLMs occasionally emit slightly malformed JSON
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await llm.invoke([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ])

      const dagSpec = parseDagSpec(response.content as string)
      return NextResponse.json({ dagSpec })
    } catch (err) {
      if (attempt === 2) {
        console.error('[/api/plan] Failed after 2 attempts:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Failed to generate DAG plan' },
          { status: 500 }
        )
      }
    }
  }
}
