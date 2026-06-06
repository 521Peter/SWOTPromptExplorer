import { NextResponse } from 'next/server'
import { getLLM } from '@/lib/langgraph/providers'
import type { Provider } from '@/lib/langgraph/providers'
import type { ApiKeys, ChatMessage, DagSpec, DagNode, DagEdge } from '@/lib/types'

const ALLOWED_ICONS = [
  'Target', 'TrendingUp', 'AlertTriangle', 'Sparkles', 'Shield',
  'Crosshair', 'User', 'BarChart2', 'Share2', 'Zap', 'Globe',
  'DollarSign', 'Clock', 'Star',
]
const ALLOWED_RELATIONS = ['amplifies', 'informs', 'shapes', 'enables', 'activates']

function buildSystemPrompt(dagSpec: DagSpec, product: string, objective: string, segment: string): string {
  const existingIds = dagSpec.nodes.map((n) => `"${n.id}" (${n.label})`).join(', ')
  return `You are a strategic analysis assistant helping to extend a business analysis DAG.

Context:
- Product: "${product}"
- Objective: "${objective}"
- Segment: "${segment}"
- Existing nodes: ${existingIds || 'none'}

Behaviour rules:
1. If the user asks a question or makes a comment that does NOT require adding a new analysis node, reply in plain text only.
2. If the user wants a new analysis lens, angle, or topic added to the DAG, include your text reply AND append a JSON block.
3. The JSON block must be fenced with triple backticks and tagged "additions":

\`\`\`additions
{
  "nodes": [
    { "id": "snake_case_id", "label": "Human Label", "prompt": "Full self-contained prompt...", "color": "#hexcolor", "iconName": "IconName" }
  ],
  "edges": [
    { "from": "existing_or_new_id", "to": "existing_or_new_id", "relation": "informs" }
  ]
}
\`\`\`

Constraints for additions:
- Node ids: lowercase, underscores only, must NOT duplicate: ${dagSpec.nodes.map((n) => n.id).join(', ')}
- iconName must be one of: ${ALLOWED_ICONS.join(', ')}
- relation must be one of: ${ALLOWED_RELATIONS.join(', ')}
- Prompts must include product, objective, and segment inline — they are self-contained
- Add 1–3 nodes per response maximum
- Edges may reference existing node ids as source or target
- Keep edges sparse and meaningful
- Never modify or reference deleting existing nodes`
}

function parseAdditions(raw: string): { reply: string; additions?: { nodes: DagNode[]; edges: DagEdge[] } } {
  const fenceRegex = /```additions\s*([\s\S]*?)```/i
  const match = raw.match(fenceRegex)

  const reply = raw.replace(fenceRegex, '').trim()

  if (!match) return { reply }

  try {
    const parsed = JSON.parse(match[1].trim())
    const nodes: DagNode[] = (parsed.nodes ?? []).map((n: DagNode) => ({
      ...n,
      iconName: ALLOWED_ICONS.includes(n.iconName) ? n.iconName : 'BarChart2',
    }))
    const edges: DagEdge[] = (parsed.edges ?? []).filter(
      (e: DagEdge) => ALLOWED_RELATIONS.includes(e.relation)
    )
    return { reply, additions: { nodes, edges } }
  } catch {
    return { reply }
  }
}

export async function POST(req: Request) {
  let body: {
    message?: string
    dagSpec?: DagSpec
    product?: string
    objective?: string
    segment?: string
    history?: ChatMessage[]
    provider?: Provider
    keys?: Partial<ApiKeys>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, dagSpec, product, objective, segment, history = [], provider, keys = {} } = body

  if (!message || !dagSpec || !product || !objective || !segment || !provider) {
    return NextResponse.json(
      { error: 'Missing required fields: message, dagSpec, product, objective, segment, provider' },
      { status: 400 }
    )
  }

  const llm = getLLM(provider, keys)

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(dagSpec, product, objective, segment) },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await llm.invoke(messages)
    const { reply, additions } = parseAdditions(response.content as string)
    return NextResponse.json({ reply, additions })
  } catch (err) {
    console.error('[/api/chat] error:', err)
    const msg = err instanceof Error ? err.message.split('\n')[0] : 'Chat request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
