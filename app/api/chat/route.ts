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

SCOPE RESTRICTION — you may ONLY answer questions directly related to:
business strategy, market analysis, competitive landscape, customer behaviour,
product positioning, pricing, distribution, marketing, growth, risks, or other
topics that are relevant to the product/objective/segment above.

If the user's question is off-topic (personal advice, general knowledge, coding help,
cooking, politics, or anything unrelated to this business analysis context), respond
with exactly this and nothing else:
"I can only help with analysis questions related to ${product} and the ${segment} segment. Try asking about pricing strategy, competitive risks, growth channels, or similar topics."
Do NOT include an additions block for off-topic questions.

For on-topic questions, you MUST respond with TWO parts:
1. A concise plain-text answer to the user's question (2-4 sentences).
2. A suggested graph node that captures the core insight from your answer as a standalone analysis.

Always append the node suggestion as a fenced JSON block tagged "additions" for on-topic questions:

\`\`\`additions
{
  "nodes": [
    { "id": "snake_case_id", "label": "Human Label", "prompt": "Full self-contained analysis prompt for this topic including product, objective and segment inline.", "color": "#hexcolor", "iconName": "IconName" }
  ],
  "edges": [
    { "from": "most_relevant_existing_node_id", "to": "new_node_id", "relation": "informs" }
  ]
}
\`\`\`

Constraints:
- Node id: lowercase, underscores only, must NOT duplicate: ${dagSpec.nodes.map((n) => n.id).join(', ') || 'none'}
- iconName must be one of: ${ALLOWED_ICONS.join(', ')}
- relation must be one of: ${ALLOWED_RELATIONS.join(', ')}
- Prompt must be fully self-contained — include product, objective, and segment inline
- Suggest exactly 1 node per response
- Edge "from" must be an existing node id; "to" must be the new node id
- Never suggest modifying or deleting existing nodes`
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
