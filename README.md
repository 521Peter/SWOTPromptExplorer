# SWOT Prompt Explorer

An agentic LLM-powered market analysis tool. Enter a product, objective, and customer segments — the app dynamically plans a custom analysis DAG per segment using LangGraph, executes all nodes in parallel, and visualises the results as an interactive, draggable graph.

Built with Next.js 16, LangGraph, and ReactFlow.

---

## What it does

1. **Plans** a custom DAG — an LLM designs 6–10 tailored analysis nodes for each segment (not a fixed SWOT template)
2. **Executes** all nodes in parallel using a LangGraph state graph
3. **Visualises** results as a draggable causal DAG with bezier edges
4. **Augments** the graph via a resizable chat panel — ask questions, add new nodes inline
5. **Compares** the same segment across different LLM providers side-by-side

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd SWOTPromptExplorer
npm install
```

### 2. Set up API keys (optional)

Provide default keys via environment variables so the app works without the Settings panel:

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY=sk-or-...
NEXT_PUBLIC_DEFAULT_OPENAI_KEY=sk-...
NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY=sk-ant-...
NEXT_PUBLIC_DEFAULT_GROQ_KEY=gsk_...
```

Keys can also be entered at runtime via the **Settings** (⚙) panel. They are stored in `sessionStorage` (cleared when the tab closes, never written to disk) and take precedence over env vars.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to use

### Step 1 — Fill in the sidebar

| Field | Description |
|---|---|
| **Product** | The product, service, brand, or category to analyse (e.g. `Electric Cars`, `Notion`) |
| **Objective** | The business goal driving the analysis (e.g. `Increase brand awareness`) |
| **Segments** | Up to 6 customer groups to analyse in parallel (e.g. `Gen Z consumers`, `Enterprise teams`) |

Use the **✨ Suggest** button after typing a product name to generate AI-powered objective and segment ideas using your active provider.

### Step 2 — Choose a provider

Open **Settings** (⚙ top-right of the sidebar) to select your LLM provider and paste your API key:

| Provider | Model |
|---|---|
| **OpenRouter** | Configurable — GPT-4o, Llama 3.3, Gemini Flash, Mistral, DeepSeek, and more |
| **OpenAI** | `gpt-4o-mini` |
| **Claude** | `claude-haiku-4-5` |
| **Groq** | `llama-3.3-70b-versatile` |

### Step 3 — Run analysis

Click **Run analysis**. The app:
1. Validates inputs with a lightweight LLM check
2. Calls `/api/plan` — an LLM designs a custom DAG for each segment
3. Renders the DAG skeleton immediately (nodes visible before content arrives)
4. Calls `/api/insights` — all nodes execute in parallel via LangGraph
5. Fills in content node-by-node as responses arrive

Segment node statuses:
- **Idle** — not yet started
- **Planning** (purple spinner) — LLM designing the DAG
- **Analysing** (amber spinner) — LLM running insight nodes
- **Ready** (green) — click to explore

### Step 4 — Explore insights

Click any **Ready** segment node to enter the Insight DAG view:

- **Click any insight node** to read the full analysis in the side panel (markdown with tables, bullet points, headings)
- **Drag nodes** freely — positions are preserved across session updates
- **Stale nodes** (amber ⚠) — shown when inputs changed after a run; click to re-run just that node
- Press `Escape` or click **Back** to return to the segment overview

### Step 5 — Refine with chat

Once analysis is ready, a **chat panel** appears below the DAG canvas (resizable — drag the handle between them).

- Ask any question about the segment
- The LLM always replies with an answer **and** suggests a new graph node capturing the insight
- Click **Add to graph ↗** to append the node below the existing layout and run it immediately

### Step 6 — Compare providers

Run the same segment with a second provider (switch in Settings, click Run again). A **Compare providers** button appears in the DAG toolbar — click it to open a side-by-side panel showing the same node's content from both providers.

---

## Agentic Architecture

### Two-phase plan → execute flow

```
User clicks Run
  │
  ├─▶ POST /api/plan   (LLM designs DAG: 6–10 nodes, edges, labels, icons)
  │     └─▶ DagSpec { nodes[], edges[] } stored in session
  │
  └─▶ POST /api/insights  (LangGraph executes all nodes in parallel)
        ├─▶ node_<id_1>  ──▶ outputs[id_1]
        ├─▶ node_<id_2>  ──▶ outputs[id_2]
        │   ...
        └─▶ node_<id_n>  ──▶ outputs[id_n]
                              └─▶ END
```

The DAG structure is **generated at runtime** — the LLM chooses which analysis lenses are most relevant to the specific product, objective, and segment. No two runs produce the same graph.

### LangGraph state schema

```ts
// lib/langgraph/state.ts
{
  product: string
  objective: string
  segment: string
  provider: string
  dagSpec: DagSpec | null
  outputs: Record<string, string>   // keyed by dynamic node IDs
}
```

### Chat-driven augmentation

```
User sends message
  │
  └─▶ POST /api/chat
        ├─▶ plain-text reply
        └─▶ additions: { nodes[], edges[] }   // new node to append
              └─▶ User clicks "Add to graph"
                    └─▶ POST /api/insights (single-node DagSpec)
                          └─▶ New node content merged into session
```

### Stale node detection

When `product`, `objective`, or `segment` changes after a session is `ready`, all node IDs are marked stale (amber ⚠ badge). Clicking a stale node re-runs only that node via a single-node `DagSpec`, without touching the rest of the session.

---

## Project Structure

```
app/
  page.tsx                  # Root layout, view switching, state wiring
  api/
    plan/route.ts           # LLM plans a custom DagSpec
    insights/route.ts       # Runs LangGraph for one segment (full or single node)
    chat/route.ts           # Chat reply + suggested node additions
    suggest/route.ts        # AI-powered objective + segment suggestions
    validate/route.ts       # LLM input validation gate

components/
  sidebar/
    Sidebar.tsx             # Product / objective / segment form + suggestions
    SettingsPanel.tsx       # Provider + API key management (sessionStorage)
  graphs/
    SegmentGraph.tsx        # Hub-and-spoke overview (product → segments), draggable
    InsightDAG.tsx          # Per-segment causal DAG with resizable chat panel
    ProductNode.tsx         # Root product node
    SegmentNode.tsx         # Segment status node (idle/planning/loading/ready/error)
    InsightNode.tsx         # Insight content node (stale badge, loading pulse)
  panels/
    InsightPanel.tsx        # Markdown side panel for selected node
    DagChatPanel.tsx        # Resizable chat panel docked below DAG
    ComparePanel.tsx        # Side-by-side provider comparison panel

lib/
  langgraph/
    graph.ts                # Dynamic LangGraph builder from DagSpec
    nodes.ts                # makeInsightNode factory
    providers.ts            # LLM factory (OpenAI / Claude / Groq / OpenRouter)
    state.ts                # LangGraph state with dynamic outputs map
  graph-utils.ts            # ReactFlow layout (dagre) + buildInsightElements
  icon-map.ts               # LLM icon name → LucideIcon component map
  tokens.ts                 # Design tokens (colours, provider palette, edge colours)
  settings/keys.ts          # sessionStorage key management + env var fallback
  types.ts                  # DagSpec, DagNode, DagEdge, ChatMessage, SegmentSession

constants/
  openrouter-models.ts      # Valid OpenRouter model IDs

hooks/
  useInsights.ts            # Session state, plan/run/chat/augment/rerun orchestration
  useGraphState.ts          # Active layer / segment / node navigation
```

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| LLM orchestration | LangGraph (`@langchain/langgraph`) |
| LLM providers | LangChain (OpenAI, Anthropic, Groq) + OpenRouter |
| Graph visualisation | ReactFlow (`@xyflow/react`) |
| DAG auto-layout | dagre |
| Animations | Framer Motion |
| Resizable panels | react-resizable-panels v2 |
| Markdown rendering | react-markdown + remark-gfm |
| Styling | Tailwind CSS |

---

## Key Design Decisions

**Dynamic DAG over fixed SWOT** — The planning LLM is explicitly instructed not to default to a generic SWOT structure. It picks analysis lenses based on the specific product and segment, producing more relevant and varied graphs.

**sessionStorage for API keys** — Keys are never written to localStorage or disk. They live only in sessionStorage (cleared on tab close), layered over optional environment variable defaults.

**Position-preserving session updates** — ReactFlow node positions are set once (from dagre layout) and never overwritten by session state changes. `useNodesState`/`useEdgesState` own positions; `session` tick updates patch only `data` fields.

**Single-node re-run** — Stale nodes reuse the same `/api/insights` endpoint with a one-node `DagSpec`. No separate endpoint needed.

**Non-destructive augmentation** — Chat-added nodes are merged into the existing `DagSpec` by ID (no duplicates), positioned below the current layout's max-y, and executed in isolation without touching existing content.
