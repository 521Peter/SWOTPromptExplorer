# SWOT Prompt Explorer — Architecture Document
**Subconscious AI Case Study | Author: Manoj Manjunatha**

---

## 1. Overview

A live, internal-grade web application that generates LLM-powered SWOT insights across customer segments — visualized as a **two-layer DAG graph** (ReactFlow) and powered by a **LangGraph parallel execution pipeline** that works across OpenAI, Claude, and Groq providers interchangeably.

**Live URL:** `[to be filled after deployment]`
**Deployment Target:** Vercel
**Time Budget:** 4–6 hours

---

## 2. Goals & Success Criteria

| Goal | Metric |
|------|--------|
| Multi-provider support | OpenAI / Claude / Groq switchable from UI |
| LangGraph pipeline | 9 prompt nodes run as parallel graph branches |
| Two-layer graph UI | Segment graph → click → insight DAG |
| Parallel execution | All 9 prompts fire concurrently |
| Visual quality | Smooth layout, framer-motion transitions, color-coded nodes |
| Deployable | Live Vercel URL |
| Clean code review | Typed, structured, readable |

---

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14 (App Router)** | Fast setup, API routes, Vercel native |
| Styling | **Tailwind CSS + shadcn/ui** | Suggested in case study |
| Graph (UI) | **ReactFlow (@xyflow/react)** | Structured DAG, not physics chaos |
| DAG Layout | **dagre** | Auto-layout for insight nodes |
| LLM Orchestration | **LangGraph + LangChain** | Parallel node execution, provider-agnostic |
| LLM Providers | **OpenAI / Anthropic / Groq** via LangChain | One interface, three backends |
| Streaming | **Vercel AI SDK** | SSE streaming from LangGraph to UI |
| Animation | **Framer Motion** | Panel transitions, node reveal |
| Icons | **Lucide React** | Suggested in case study |
| Markdown | **react-markdown** | Render LLM output in panels |
| Deployment | **Vercel** | One-command deploy |

---

## 4. LangGraph Pipeline Design

This is the core architectural decision. Each of the 9 prompt types is a **node** in a LangGraph `StateGraph`. All 9 nodes run in **parallel branches** off a single `router` node.

### Graph Shape

```
                    ┌─────────────┐
                    │  START node │
                    │  (inject    │
                    │   context)  │
                    └──────┬──────┘
                           │ fan-out (parallel)
        ┌──────────────────┼──────────────────────┐
        │          │       │       │               │
        ▼          ▼       ▼       ▼               ▼
  [marketingOKRs] [strengths] [weaknesses] ... [channels]
        │          │       │       │               │
        └──────────┴───────┴───────┴───────────────┘
                           │ fan-in
                    ┌──────▼──────┐
                    │  END node   │
                    │  (merge     │
                    │   results)  │
                    └─────────────┘
```

### State Definition

```typescript
// lib/langgraph/state.ts
import { Annotation } from '@langchain/langgraph'

export const InsightState = Annotation.Root({
  // 输入
  product:   Annotation<string>(),
  objective: Annotation<string>(),
  segment:   Annotation<string>(),
  provider:  Annotation<'openai' | 'claude' | 'groq'>(),

  // 输出：每个节点写入自己的键
  marketingOKRs:           Annotation<string>(),
  strengths:               Annotation<string>(),
  weaknesses:              Annotation<string>(),
  opportunities:           Annotation<string>(),
  threats:                 Annotation<string>(),
  marketPositioning:       Annotation<string>(),
  buyerPersona:            Annotation<string>(),
  investmentOpportunities: Annotation<string>(),
  channelsDistribution:    Annotation<string>(),
})
```

### Graph Builder

```typescript
// lib/langgraph/graph.ts
import { StateGraph, START, END } from '@langchain/langgraph'
import { InsightState } from './state'
import { makeInsightNode } from './nodes'
import { PROMPT_CONFIG } from '@/constants/prompt-config'

export function buildInsightGraph(provider: string) {
  const llm = getLLM(provider)  // 返回 ChatOpenAI | ChatAnthropic | ChatGroq
  const graph = new StateGraph(InsightState)

  // 为每种提示词类型注册一个节点
  const promptKeys = Object.keys(PROMPT_CONFIG)
  promptKeys.forEach(key => {
    graph.addNode(key, makeInsightNode(key, llm))
  })

  // START 并行分支到所有节点
  promptKeys.forEach(key => {
    graph.addEdge(START, key as any)
  })

  // 所有节点汇聚回 END
  promptKeys.forEach(key => {
    graph.addEdge(key as any, END)
  })

  return graph.compile()
}
```

### Node Factory

```typescript
// lib/langgraph/nodes.ts
import { PROMPT_CONFIG } from '@/constants/prompt-config'

export function makeInsightNode(promptKey: string, llm: BaseChatModel) {
  return async (state: typeof InsightState.State) => {
    const config = PROMPT_CONFIG[promptKey]
    const prompt = config.prompt(state.product, state.objective, state.segment)

    const response = await llm.invoke([
      { role: 'system', content: 'You are a senior market strategist. Be specific, not generic. Format responses in markdown.' },
      { role: 'user',   content: prompt }
    ])

    return { [promptKey]: response.content as string }
  }
}
```

### Provider Factory

```typescript
// lib/langgraph/providers.ts
import { ChatOpenAI }     from '@langchain/openai'
import { ChatAnthropic }  from '@langchain/anthropic'
import { ChatGroq }       from '@langchain/groq'

export type Provider = 'openai' | 'claude' | 'groq'

export function getLLM(provider: Provider) {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 400,
      })
    case 'claude':
      return new ChatAnthropic({
        model: 'claude-haiku-4-5-20251001',
        temperature: 0.7,
        maxTokens: 400,
      })
    case 'groq':
      return new ChatGroq({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        maxTokens: 400,
      })
  }
}
```

---

## 5. Project Structure

```
swot-explorer/
├── app/
│   ├── page.tsx                             # App shell: sidebar + graph canvas
│   ├── layout.tsx                           # Root layout + fonts
│   └── api/
│       └── insights/
│           └── route.ts                     # POST → invoke LangGraph
├── components/
│   ├── graphs/
│   │   ├── SegmentGraph.tsx                 # Layer 1: segments as ReactFlow nodes
│   │   ├── InsightDAG.tsx                   # Layer 2: 9 insight nodes per segment
│   │   ├── SegmentNode.tsx                  # Custom ReactFlow node: segment
│   │   ├── InsightNode.tsx                  # Custom ReactFlow node: insight
│   │   └── GraphLayout.ts                   # dagre auto-layout helper
│   ├── panels/
│   │   ├── InsightPanel.tsx                 # Slide-in panel with full LLM response
│   │   └── ComparePanel.tsx                 # (Bonus) Side-by-side segment diff
│   ├── sidebar/
│   │   ├── Sidebar.tsx                      # Product + Objective + Segment + Provider
│   │   └── ProviderSelector.tsx             # OpenAI / Claude / Groq toggle
│   └── ui/                                  # shadcn components
├── lib/
│   ├── langgraph/
│   │   ├── graph.ts                         # StateGraph builder
│   │   ├── nodes.ts                         # Node factory (makeInsightNode)
│   │   ├── providers.ts                     # getLLM() — returns correct LangChain model
│   │   └── state.ts                         # InsightState Annotation
│   ├── graph-utils.ts                       # ReactFlow node/edge builders
│   └── types.ts                             # TypeScript interfaces
├── hooks/
│   ├── useInsights.ts                       # Fetch + cache per segment+provider
│   └── useGraphState.ts                     # Active layer, selected node, zoom
└── constants/
    └── prompt-config.ts                     # 9 prompts: label, icon, color, causal edges
```

---

## 6. API Route

```typescript
// app/api/insights/route.ts
import { buildInsightGraph } from '@/lib/langgraph/graph'

export async function POST(req: Request) {
  const { product, objective, segment, provider } = await req.json()

  const graph = buildInsightGraph(provider)

  const result = await graph.invoke({
    product,
    objective,
    segment,
    provider,
  })

  // result 包含并行节点写入的全部 9 个键
  const { product: _, objective: __, segment: ___, provider: ____, ...insights } = result

  return Response.json({ segment, provider, insights })
}
```

---

## 7. Two-Layer Graph System (ReactFlow)

### Layer 1 — Segment Graph

All analyzed segments as ReactFlow nodes. Edges = shared behavioral traits.

**Node states:** `idle` → `loading` → `ready` → `active`

**ReactFlow config:**
```typescript
const segmentNodes: Node[] = segments.map((seg, i) => ({
  id: seg.id,
  type: 'segmentNode',
  position: getRadialPosition(i, segments.length),
  data: { label: seg.name, status: seg.status, color: seg.color, provider: seg.provider }
}))
```

### Layer 2 — Insight DAG

9 prompt nodes around the central segment node, auto-laid out by `dagre`.

**Causal edges (pre-defined in `prompt-config.ts`):**
```
Threats ──────────amplifies──▶ Weaknesses
Opportunities ────informs────▶ Marketing OKRs
Buyer Persona ────shapes─────▶ Market Positioning
Strengths ────────enables────▶ Investment Opportunities
Channels ─────────activates──▶ Marketing OKRs
```

**dagre auto-layout:**
```typescript
import dagre from 'dagre'

export function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 })
  nodes.forEach(n => g.setNode(n.id, { width: 180, height: 72 }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map(n => ({
    ...n,
    position: { x: g.node(n.id).x - 90, y: g.node(n.id).y - 36 }
  }))
}
```

---

## 8. Provider Selector UI

```typescript
// components/sidebar/ProviderSelector.tsx
const PROVIDERS = [
  {
    id: 'claude',
    label: 'Claude',
    model: 'claude-haiku-4-5-20251001',
    color: '#D97706',
    icon: '◆',
    badge: 'Anthropic'
  },
  {
    id: 'openai',
    label: 'GPT-4o mini',
    model: 'gpt-4o-mini',
    color: '#10B981',
    icon: '⬡',
    badge: 'OpenAI'
  },
  {
    id: 'groq',
    label: 'Llama 3.3 70B',
    model: 'llama-3.3-70b-versatile',
    color: '#8B5CF6',
    icon: '▲',
    badge: 'Groq'
  }
]
```

- Rendered as a segmented button group in the sidebar
- Selected provider passed in POST body
- Each segment node badge shows which provider generated it
- Allows running the same segment with different providers and comparing

---

## 9. State Management

```typescript
// hooks/useInsights.ts
interface SegmentSession {
  status:      'idle' | 'loading' | 'ready' | 'error'
  insights:    Record<PromptType, string> | null
  provider:    Provider
  generatedAt: Date | null
}

// 缓存键 = `${segmentName}:${provider}`
// 允许同一细分市场针对多个服务商分别缓存
const sessions = useRef<Record<string, SegmentSession>>({})

// hooks/useGraphState.ts
interface GraphState {
  activeLayer:   'segment' | 'insight'
  activeSegment: string | null
  selectedNode:  string | null
  provider:      Provider
}
```

Key behavior: cache key includes provider — running "Gen Z Creators" with Claude vs Groq both stay cached independently. Great for comparison.

---

## 10. Prompt Config (`constants/prompt-config.ts`)

```typescript
export const PROMPT_CONFIG: Record<PromptType, PromptMeta> = {
  marketingOKRs: {
    label:  'Marketing OKRs',
    icon:   'Target',
    color:  'purple',
    prompt: (p, o, s) =>
      `Product: "${p}". Objective: "${o}".
       Give 3 measurable marketing OKRs for ${s}.
       Be specific, quantified, time-bound. Use markdown numbered list.`,
    causalEdges: []
  },
  strengths: {
    label:  'Strengths',
    icon:   'TrendingUp',
    color:  'green',
    prompt: (p, o, s) =>
      `What product strengths of "${p}" matter most to ${s}?
       Be concrete, not generic. Markdown bullet list.`,
    causalEdges: [{ to: 'investmentOpportunities', label: 'enables' }]
  },
  weaknesses:              { color: 'red',    causalEdges: [{ from: 'threats', label: 'amplifies' }], ... },
  opportunities:           { color: 'blue',   causalEdges: [{ to: 'marketingOKRs', label: 'informs' }], ... },
  threats:                 { color: 'amber',  causalEdges: [{ to: 'weaknesses', label: 'amplifies' }], ... },
  marketPositioning:       { color: 'cyan',   causalEdges: [{ from: 'buyerPersona', label: 'shapes' }], ... },
  buyerPersona:            { color: 'pink',   causalEdges: [{ to: 'marketPositioning', label: 'shapes' }], ... },
  investmentOpportunities: { color: 'lime',   causalEdges: [], ... },
  channelsDistribution:    { color: 'orange', causalEdges: [{ to: 'marketingOKRs', label: 'activates' }], ... },
}
```

---

## 11. Visual Design

**Aesthetic:** Dark-mode-first, clean decision tool. Notion × Linear × early Conjoint.ly.

**Color system:**
```
Background:   #0A0A0F
Surface:      #13131A
Border:       #1E1E2E
Provider badge colors:
  Claude:  #D97706  amber
  OpenAI:  #10B981  green
  Groq:    #8B5CF6  purple
```

**Edge styles:**
```
Segment → Insight  : solid 0.5px muted
"amplifies"        : dashed red
"informs"          : dashed blue
"shapes"           : dashed purple
"enables"          : dashed green
"activates"        : dashed orange
```

---

## 12. Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...     # Claude
OPENAI_API_KEY=sk-...            # OpenAI
GROQ_API_KEY=gsk_...             # Groq
```

All keys server-side only. LangGraph runs exclusively in the API route.

---

## 13. Dependencies

```json
{
  "@langchain/langgraph":  "^0.2.x",
  "@langchain/core":       "^0.3.x",
  "@langchain/openai":     "^0.3.x",
  "@langchain/anthropic":  "^0.3.x",
  "@langchain/groq":       "^0.1.x",
  "@xyflow/react":         "^12.x",
  "dagre":                 "^0.8.x",
  "framer-motion":         "^11.x",
  "react-markdown":        "^9.x",
  "lucide-react":          "^0.4.x"
}
```

---

## 14. Deployment

```bash
npx create-next-app@latest swot-explorer --typescript --tailwind --app
npm install @langchain/langgraph @langchain/core
npm install @langchain/openai @langchain/anthropic @langchain/groq
npm install @xyflow/react dagre framer-motion react-markdown lucide-react
npx shadcn-ui@latest init

vercel --prod
# 在 Vercel 控制台中设置：
# ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY
```

---

## 15. Bonus Features

| Feature | Effort | Impact |
|---------|--------|--------|
| Compare same segment across providers | Low | Directly shows multi-provider value |
| LangGraph trace viewer (show node execution order) | Medium | Shows pipeline thinking |
| Streaming tokens per node | Medium | Feels alive, very impressive |
| Export graph as PNG | Low | Useful for internal tool |
| Minimap (ReactFlow built-in) | Near zero | Polished |

---

## 16. What NOT to build

- ❌ Auth / login
- ❌ Database / persistence
- ❌ Mobile optimization (internal tool)
- ❌ LangSmith tracing (nice to have, not for 4–6hr window)

---

## 17. Review Checklist

- [ ] LangGraph StateGraph compiles with 9 parallel nodes
- [ ] Provider switch changes the LLM without touching prompt logic
- [ ] Layer 1 segment graph renders with ReactFlow
- [ ] Click segment → Layer 2 insight DAG with dagre layout
- [ ] Causal edges rendered as dashed with type labels
- [ ] InsightPanel slides in with markdown on node click
- [ ] Segment node badge shows which provider was used
- [ ] All 3 API keys set in Vercel
- [ ] Deployed live

---

*Built for Subconscious AI Founding Engineering recruitment process.*


---

## 18. OpenRouter Integration

OpenRouter is added as a fourth provider. It proxies 100+ models (GPT-4o, Claude, Gemini, Mistral, etc.) through a single OpenAI-compatible endpoint — meaning LangChain's `ChatOpenAI` works with just a `baseURL` swap.

```typescript
// lib/langgraph/providers.ts——已更新
import { ChatOpenAI }    from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGroq }      from '@langchain/groq'

export type Provider = 'openai' | 'claude' | 'groq' | 'openrouter'

export function getLLM(provider: Provider, keys: ApiKeys) {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        model:       'gpt-4o-mini',
        temperature:  0.7,
        maxTokens:    400,
        openAIApiKey: keys.openai,
      })
    case 'claude':
      return new ChatAnthropic({
        model:           'claude-haiku-4-5-20251001',
        temperature:      0.7,
        maxTokens:        400,
        anthropicApiKey:  keys.anthropic,
      })
    case 'groq':
      return new ChatGroq({
        model:    'llama-3.3-70b-versatile',
        temperature: 0.7,
        maxTokens:   400,
        apiKey:      keys.groq,
      })
    case 'openrouter':
      // OpenRouter 兼容 OpenAI，只需替换 baseURL 和密钥
      return new ChatOpenAI({
        model:        keys.openrouterModel || 'mistralai/mistral-7b-instruct',
        temperature:   0.7,
        maxTokens:     400,
        openAIApiKey:  keys.openrouter,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://swot-explorer.vercel.app',
            'X-Title':      'SWOT Prompt Explorer',
          },
        },
      })
  }
}
```

**OpenRouter model picker:** When provider is `openrouter`, a second dropdown appears in the sidebar letting users pick any model. Populate the list from OpenRouter's `/api/v1/models` endpoint on settings open.

```typescript
// 用于预填充的热门 OpenRouter 模型
export const OPENROUTER_MODELS = [
  { id: 'mistralai/mistral-7b-instruct',       label: 'Mistral 7B' },
  { id: 'meta-llama/llama-3.1-8b-instruct',    label: 'Llama 3.1 8B' },
  { id: 'google/gemini-flash-1.5',             label: 'Gemini Flash 1.5' },
  { id: 'anthropic/claude-3-haiku',            label: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o-mini',                  label: 'GPT-4o Mini' },
  { id: 'deepseek/deepseek-chat',              label: 'DeepSeek Chat' },
]
```

---

## 19. Settings Panel — API Key Management

Keys are entered once in a Settings panel and stored in `localStorage` (client-side only, never sent to a server except as the actual API key in the request). This means **zero `.env` setup** for the reviewer — open the app, paste keys, run.

### Storage Design

```typescript
// lib/settings/keys.ts
export interface ApiKeys {
  anthropic:      string
  openai:         string
  groq:           string
  openrouter:     string
  openrouterModel: string
}

const STORAGE_KEY = 'swot_api_keys'

export function saveKeys(keys: ApiKeys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

export function loadKeys(): Partial<ApiKeys> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function clearKeys() {
  localStorage.removeItem(STORAGE_KEY)
}
```

### How Keys Flow to the API Route

Keys are passed in the POST body alongside the prompt config. The API route reads them from the request body and passes them into `getLLM()` — they are **never stored server-side**, never logged.

```typescript
// POST 请求体结构——已更新
{
  product:         string
  objective:       string
  segment:         string
  provider:        Provider
  keys:            ApiKeys          // ← 从客户端 localStorage 传入
  openrouterModel?: string          // ← 仅当 provider = 'openrouter' 时使用
}

// app/api/insights/route.ts——已更新
export async function POST(req: Request) {
  const { product, objective, segment, provider, keys, openrouterModel } = await req.json()
  const graph = buildInsightGraph(provider, { ...keys, openrouterModel })
  const result = await graph.invoke({ product, objective, segment, provider })
  const { product: _, objective: __, segment: ___, provider: ____, ...insights } = result
  return Response.json({ segment, provider, insights })
}
```

### Settings Panel UI

Triggered by a gear icon (⚙) in the top-right corner of the sidebar. Opens as a slide-over sheet (shadcn `Sheet` component).

```
┌─────────────────────────────────────────┐
│  ⚙ Settings                         ✕  │
├─────────────────────────────────────────┤
│  API Keys                               │
│  Keys are stored in your browser only.  │
│  Never sent to any server except the    │
│  provider you select.                   │
│                                         │
│  Anthropic (Claude)                     │
│  ┌──────────────────────────────────┐   │
│  │ sk-ant-••••••••••••••••••••      │   │
│  └──────────────────────────────────┘   │
│  ✓ Connected                            │
│                                         │
│  OpenAI                                 │
│  ┌──────────────────────────────────┐   │
│  │ sk-••••••••••••••••••••          │   │
│  └──────────────────────────────────┘   │
│  ✓ Connected                            │
│                                         │
│  Groq                                   │
│  ┌──────────────────────────────────┐   │
│  │ gsk_•••••••••••••••••            │   │
│  └──────────────────────────────────┘   │
│  ✗ Not set                              │
│                                         │
│  OpenRouter                             │
│  ┌──────────────────────────────────┐   │
│  │ sk-or-•••••••••••••••            │   │
│  └──────────────────────────────────┘   │
│  Default model                          │
│  ┌──────────────────────────────────┐   │
│  │ Mistral 7B              ▾        │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [ Save ]              [ Clear all ]    │
└─────────────────────────────────────────┘
```

### Component

```typescript
// components/sidebar/SettingsPanel.tsx
export function SettingsPanel() {
  const [keys, setKeys] = useState<Partial<ApiKeys>>(loadKeys)

  const providers = [
    { id: 'anthropic',  label: 'Anthropic (Claude)', placeholder: 'sk-ant-...',  docsUrl: 'https://console.anthropic.com' },
    { id: 'openai',     label: 'OpenAI',             placeholder: 'sk-...',      docsUrl: 'https://platform.openai.com/api-keys' },
    { id: 'groq',       label: 'Groq',               placeholder: 'gsk_...',     docsUrl: 'https://console.groq.com/keys' },
    { id: 'openrouter', label: 'OpenRouter',         placeholder: 'sk-or-...',   docsUrl: 'https://openrouter.ai/keys' },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon"><Settings size={16} /></Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Keys are stored in your browser only.
          </SheetDescription>
        </SheetHeader>

        {providers.map(p => (
          <div key={p.id} className="space-y-1">
            <label className="text-sm font-medium">{p.label}</label>
            <Input
              type="password"
              placeholder={p.placeholder}
              value={keys[p.id] || ''}
              onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
            />
            <StatusBadge hasKey={!!keys[p.id]} docsUrl={p.docsUrl} />
          </div>
        ))}

        {keys.openrouter && (
          <OpenRouterModelPicker
            value={keys.openrouterModel}
            onChange={model => setKeys(prev => ({ ...prev, openrouterModel: model }))}
          />
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={() => saveKeys(keys as ApiKeys)}>Save</Button>
          <Button variant="outline" onClick={() => { clearKeys(); setKeys({}) }}>
            Clear all
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### First-run Gate

If no keys are saved, the "Run Analysis" button is disabled and shows a prompt:

```
⚙ Add at least one API key in Settings to get started →
```

Clicking it opens the Settings panel directly.

---

## 20. Updated Provider Selector

```typescript
export const PROVIDERS = [
  {
    id:     'claude',
    label:  'Claude',
    model:  'claude-haiku-4-5-20251001',
    badge:  'Anthropic',
    color:  '#D97706',
    keyId:  'anthropic',      // 要检查 ApiKeys 中的哪个密钥
  },
  {
    id:     'openai',
    label:  'GPT-4o mini',
    model:  'gpt-4o-mini',
    badge:  'OpenAI',
    color:  '#10B981',
    keyId:  'openai',
  },
  {
    id:     'groq',
    label:  'Llama 3.3 70B',
    model:  'llama-3.3-70b-versatile',
    badge:  'Groq',
    color:  '#8B5CF6',
    keyId:  'groq',
  },
  {
    id:     'openrouter',
    label:  'OpenRouter',
    model:  '(pick model)',
    badge:  'OpenRouter',
    color:  '#EC4899',
    keyId:  'openrouter',
  },
]
```

Providers without a saved key are shown as **disabled with a lock icon** and a "Add key in Settings →" tooltip. Only providers with a valid key are selectable.

---

## 21. Updated Environment Variables

With the settings panel approach, **no `.env` is required** for the reviewer.

For production/self-hosting, keys can optionally be set as environment variables as fallbacks:

```env
# 可选——设置后会预填充设置面板
NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY=sk-ant-...
NEXT_PUBLIC_DEFAULT_OPENAI_KEY=sk-...
NEXT_PUBLIC_DEFAULT_GROQ_KEY=gsk_...
NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY=sk-or-...
```

These are `NEXT_PUBLIC_` so they can pre-populate the settings form client-side.
The reviewer can override with their own keys in the Settings panel.

---

## 22. Updated Review Checklist

- [ ] LangGraph StateGraph with 9 parallel nodes
- [ ] All 4 providers work: Claude / OpenAI / Groq / OpenRouter
- [ ] OpenRouter model picker populates from API
- [ ] Settings panel opens via gear icon
- [ ] Keys save/load from localStorage
- [ ] Providers without keys show as disabled + lock icon
- [ ] First-run gate prompts user to add a key
- [ ] Layer 1 segment graph renders in ReactFlow
- [ ] Click segment → Layer 2 insight DAG with dagre layout
- [ ] Causal edges as dashed lines with labels
- [ ] InsightPanel slides in with markdown on node click
- [ ] Segment node badge shows provider used
- [ ] Deployed live on Vercel
