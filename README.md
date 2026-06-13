# SWOT Prompt Explorer

An agentic LLM-powered market analysis tool. Enter a product, objective, and customer segments — the app dynamically plans a custom analysis DAG per segment using LangGraph, executes all nodes in parallel, visualises results as an interactive graph, and maps regional market fit across the world.

Built with Next.js 16, LangGraph, ReactFlow, and react-simple-maps.

---

## What it does

1. **Plans** a custom DAG — an LLM designs 6–10 tailored analysis nodes for each segment (not a fixed SWOT template)
2. **Executes** all nodes in parallel using a LangGraph state graph
3. **Visualises** results as a draggable causal DAG with bezier edges
4. **Maps regional fit** — a persona agent scores market fit for 8 world regions in parallel, rendered as radial progress rings on an interactive world map
5. **Augments** the graph via a resizable chat panel — ask questions, add new nodes inline
6. **Compares** the same segment across different LLM providers side-by-side

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

Click any **Ready** segment node to enter the three-panel insight view:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back   product › segment                              Compare    │  ← Navbar
├────────────────────────────┬────────────────────────────┬───────────┤
│                            │                            │           │
│       Insight DAG          │    Regional Fit Map        │  Detail   │
│                            │    (when active)           │  Panel    │
│    [🌐 Regional Fit ●]     │                            │           │
├────────────────────────────┴────────────────────────────┤           │
│  Chat panel (resizable, drag handle to expand)          │           │
└─────────────────────────────────────────────────────────┴───────────┘
```

- **Click any insight node** to read the full analysis in the detail panel (markdown with tables, bullets, headings) plus an *Analysis focus* block showing the node's prompt intent
- **Drag nodes** freely — positions are preserved across session updates
- **Stale nodes** (amber ⚠) — shown when inputs changed after a run; click to re-run just that node
- Press `Escape` or click **Back** to return to the segment overview

### Step 5 — Explore regional fit

Once analysis is ready, click the **🌐 Regional Fit** pill floating at the bottom-centre of the DAG. The world map panel slides in beside the graph and fires 8 parallel persona agent calls:

| Region | | Region | |
|---|---|---|---|
| North America | 🔵 | Latin America | 🩷 |
| Europe | 🟣 | Middle East & N. Africa | 🟡 |
| SE Asia | 🟢 | Africa | 🟦 |
| India | 🟠 | China | 🔴 |

Each region renders as a **radial progress ring** sized by fit score (0–100%). Click a ring to:
- Zoom the map into that region
- Open a detail panel showing a **Market Overview** paragraph and **Key Factors** bullets generated by the persona agent

**Custom regions** — type any region name in the bottom strip (`＋ Analyze a region… e.g. ANZ, Gulf States`) and press Enter. The agent calls the LLM to get coordinates and score the custom region.

**Map controls** (bottom-left, matching ReactFlow style):
- **＋ / −** — zoom in/out
- **⊡** — reset to world view (appears when zoomed)
- Scroll to zoom and drag to pan also work

### Step 6 — Refine with chat

Once analysis is ready, a **chat panel** appears below the DAG and map canvases (resizable — drag the handle between them). The detail panel on the right is unaffected by chat height.

- Ask any question about the segment
- The LLM replies with an answer **and** suggests a new graph node capturing the insight
- Click **Add to graph ↗** to append the node and run it immediately

### Step 7 — Compare providers

Run the same segment with a second provider (switch in Settings, click Run again). A **Compare** button appears in the navbar — click it to open a side-by-side panel showing the same node's content from both providers.

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
```

The DAG structure is **generated at runtime** — the LLM chooses which analysis lenses are most relevant to the specific product, objective, and segment. No two runs produce the same graph.

### Regional persona agents

```
User clicks Regional Fit
  │
  └─▶ Promise.all — 8x POST /api/persona (fired in parallel)
        ├─▶ { region: "North America", ... }  ──▶ { pct, explanation, reasons }
        ├─▶ { region: "Europe", ... }          ──▶ { pct, explanation, reasons }
        │   ...
        └─▶ { region: "Africa", ... }          ──▶ { pct, explanation, reasons }

Custom region
  └─▶ POST /api/persona  { returnCoordinates: true }
        └─▶ { pct, explanation, reasons, coordinates: [lon, lat] }
```

Each persona call receives the full DAG spec and all existing insight content as context, so the regional scoring is grounded in the actual analysis rather than generic market knowledge.

### Chat-driven augmentation

```
User sends message
  │
  └─▶ POST /api/chat
        ├─▶ plain-text reply
        └─▶ additions: { nodes[], edges[] }
              └─▶ User clicks "Add to graph"
                    └─▶ POST /api/insights (single-node DagSpec)
                          └─▶ New node merged into session
```

---

## Project Structure

```
app/
  page.tsx                    # Root layout, three-panel view, state wiring
  api/
    plan/route.ts             # LLM plans a custom DagSpec
    insights/route.ts         # Runs LangGraph (full segment or single node)
    chat/route.ts             # Chat reply + suggested node additions
    persona/route.ts          # Regional persona agent (pct, explanation, reasons)
    suggest/route.ts          # AI objective + segment suggestions
    validate/route.ts         # LLM input validation gate

components/
  sidebar/
    Sidebar.tsx               # Product / objective / segment form + suggestions
    SettingsPanel.tsx         # Provider + API key management (sessionStorage)
  graphs/
    SegmentGraph.tsx          # Hub-and-spoke overview (product → segments)
    InsightDAG.tsx            # Per-segment causal DAG + floating Regional Fit pill
    WorldPersonaMap.tsx       # Interactive world map with radial rings and zoom
    ProductNode.tsx           # Root product node
    SegmentNode.tsx           # Segment status node
    InsightNode.tsx           # Insight content node (stale badge, loading pulse)
  panels/
    InsightNavbar.tsx         # Shared navbar: Back, breadcrumb, Compare
    InsightPanel.tsx          # Markdown detail panel + Analysis focus block
    RegionDetailPanel.tsx     # Region score, Market Overview, Key Factors
    DagChatPanel.tsx          # Resizable chat panel (left column only)
    ComparePanel.tsx          # Side-by-side provider comparison panel

hooks/
  useInsights.ts              # Session state, plan/run/chat/augment/rerun
  usePersona.ts               # Persona session state, runPersona, addCustomRegion
  useGraphState.ts            # Active layer / segment / node navigation

lib/
  langgraph/
    graph.ts                  # Dynamic LangGraph builder from DagSpec
    nodes.ts                  # makeInsightNode factory
    providers.ts              # LLM factory (OpenAI / Claude / Groq / OpenRouter)
    state.ts                  # LangGraph state with dynamic outputs map
  graph-utils.ts              # ReactFlow layout (dagre) + buildInsightElements
  icon-map.ts                 # LLM icon name → LucideIcon map
  types.ts                    # DagSpec, SegmentSession, ChatMessage, ApiKeys

types/
  world-atlas.d.ts            # Manual TypeScript declarations for react-simple-maps
```

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| LLM orchestration | LangGraph (`@langchain/langgraph`) |
| LLM providers | LangChain (OpenAI, Anthropic, Groq) + OpenRouter |
| Graph visualisation | ReactFlow (`@xyflow/react`) |
| World map | react-simple-maps v3 + world-atlas |
| DAG auto-layout | dagre |
| Animations | Framer Motion |
| Resizable panels | react-resizable-panels v2 |
| Markdown rendering | react-markdown + remark-gfm |
| Styling | Tailwind CSS |

---

## Key Design Decisions

**Dynamic DAG over fixed SWOT** — The planning LLM is explicitly instructed not to default to a generic SWOT structure. It picks analysis lenses based on the specific product and segment.

**Persona agents grounded in DAG context** — Each `/api/persona` call receives the full DAG spec and up to 220 characters of each node's insight text. Regional scores reflect the actual analysis, not generic market knowledge.

**Nested resizable layout** — The insight view uses two nested `ResizablePanelGroup` instances: an outer horizontal split (Left | Detail) and an inner vertical split (Maps | Chat). The detail panel spans full height independently of chat size. Chat uses a `collapsible` panel with `ImperativePanelHandle` so it expands/collapses without remounting.

**sessionStorage for API keys** — Keys are never written to localStorage or disk. They live only in sessionStorage (cleared on tab close), layered over optional environment variable defaults.

**Position-preserving session updates** — ReactFlow node positions are set once (from dagre layout) and never overwritten by session state changes. `useNodesState`/`useEdgesState` own positions; session tick updates patch only `data` fields.

**Single-node re-run** — Stale nodes reuse the same `/api/insights` endpoint with a one-node `DagSpec`. No separate endpoint needed.

**ZoomableGroup controlled component** — The world map uses react-simple-maps' `ZoomableGroup` in controlled mode (`zoom` + `center` props, `onMoveEnd` callback). Programmatic zoom (click-to-region, ＋/− buttons) and user scroll/drag are unified through the same state, so zoom always centres on the current viewport.
