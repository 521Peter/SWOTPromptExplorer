# SWOT Prompt Explorer

A visual LLM-powered market analysis tool that runs structured SWOT-style insights across multiple customer segments in parallel. Built with Next.js 14, LangGraph, and ReactFlow.

**Live demo:** [https://swot-prompt-explorer.vercel.app](https://swot-prompt-explorer.vercel.app)

---

## What it does

Enter a product, an objective, and a set of customer segments. The app fans out 9 parallel LLM analysis nodes per segment using a LangGraph state graph, then visualises the results as an interactive DAG. Click any insight node to read the full analysis in the side panel.

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd SWOTPromptExplorer
npm install
```

### 2. Set up API keys (optional)

You can provide default keys via environment variables so the app works without the Settings panel:

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY=sk-or-...
NEXT_PUBLIC_DEFAULT_OPENAI_KEY=sk-...
NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY=sk-ant-...
NEXT_PUBLIC_DEFAULT_GROQ_KEY=gsk_...
```

Keys can also be entered at runtime via the **Settings** (⚙) panel — they are stored in `localStorage` and take precedence over env vars.

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

Use the **✨ Suggest** button (appears after typing a product name) to generate AI-powered objective and segment suggestions using a lightweight OpenRouter model.

### Step 2 — Choose a provider

Open **Settings** (⚙ top-right of the sidebar) to select your LLM provider and paste your API key:

- **OpenRouter** — access hundreds of models; configure the model in Settings
- **OpenAI** — uses `gpt-4o-mini`
- **Claude** — uses `claude-haiku-4-5`
- **Groq** — uses `llama-3.3-70b-versatile`

### Step 3 — Run analysis

Click **Run analysis**. The app validates your inputs with a lightweight LLM check, then fans out all segment analyses in parallel. Each segment node on the graph updates in real time:

- **Idle** — waiting to start
- **Analysing** (spinner) — LLM running
- **Ready** (green) — click to explore

### Step 4 — Explore insights

Click any **Ready** segment node to enter the Insight DAG view. Nine insight nodes are laid out as a causal graph. Click any node to read its full analysis in the panel on the right. The panel renders markdown including bullet points, headings, and tables.

Use the **Back** button or press `Escape` to return to the segment overview.

---

## LangGraph Architecture

Each segment runs its own compiled LangGraph state graph. The graph fans out from `START` to all 9 insight nodes **in parallel**, then fans back in to `END`.

```
START
  ├─▶ node_strengths
  ├─▶ node_weaknesses
  ├─▶ node_opportunities
  ├─▶ node_threats
  ├─▶ node_marketPositioning
  ├─▶ node_buyerPersona
  ├─▶ node_investmentOpportunities
  ├─▶ node_channelsDistribution
  └─▶ node_marketingOKRs
          └─▶ END (all nodes fan in)
```

### Insight Nodes

| Node | Colour | What it generates |
|---|---|---|
| **Strengths** | Green | Product strengths most relevant to the segment |
| **Weaknesses** | Red | Honest product weaknesses for the segment |
| **Opportunities** | Blue | Untapped demand and emerging market trends |
| **Threats** | Amber | Competitive, regulatory, and behavioural risks |
| **Market Positioning** | Cyan | Positioning statement and differentiation angle |
| **Buyer Persona** | Pink | Demographics, motivations, pain points, buying triggers |
| **Investment Opportunities** | Lime | ROI potential and strategic resource-allocation priorities |
| **Channels & Distribution** | Orange | Digital, physical, and partnership reach channels |
| **Marketing OKRs** | Purple | 3 measurable, time-bound OKRs for the segment |

### Causal edges (visualised in the DAG)

The DAG renders directional causal relationships between nodes to show how insights inform each other:

| Source | → | Target | Label |
|---|---|---|---|
| Opportunities | → | Marketing OKRs | *informs* |
| Channels & Distribution | → | Marketing OKRs | *activates* |
| Strengths | → | Investment Opportunities | *enables* |
| Threats | → | Weaknesses | *amplifies* |
| Buyer Persona | → | Market Positioning | *shapes* |

### State schema

```ts
// lib/langgraph/state.ts
{
  product: string
  objective: string
  segment: string
  provider: Provider
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
  marketPositioning: string
  buyerPersona: string
  investmentOpportunities: string
  channelsDistribution: string
  marketingOKRs: string
}
```

---

## Project Structure

```
app/
  page.tsx                  # Root layout + view switching
  api/
    insights/route.ts       # Runs the LangGraph for one segment
    suggest/route.ts        # Lightweight objective + segment suggestions
    validate/route.ts       # LLM-powered input validation gate

components/
  sidebar/
    Sidebar.tsx             # Product / objective / segment form + suggestions
    SettingsPanel.tsx       # Provider + API key management
  graphs/
    SegmentGraph.tsx        # Hub-and-spoke overview (product → segments)
    InsightDAG.tsx          # Per-segment causal DAG
    ProductNode.tsx         # Root product node (ReactFlow)
    SegmentNode.tsx         # Segment status node (ReactFlow)
    InsightNode.tsx         # Insight content node (ReactFlow)
  panels/
    InsightPanel.tsx        # Markdown side panel for insight content

lib/
  langgraph/
    graph.ts                # Builds + compiles the LangGraph state graph
    nodes.ts                # makeInsightNode factory — one per prompt type
    providers.ts            # LLM factory (OpenAI / Claude / Groq / OpenRouter)
    state.ts                # LangGraph state schema (Annotation)
  graph-utils.ts            # ReactFlow layout helpers + dagre auto-layout
  validate.ts               # Client-side gibberish detection heuristics
  tokens.ts                 # Design tokens (colours, provider palette)

constants/
  prompt-config.ts          # All 9 prompts, labels, colours, icons, causal edges
  openrouter-models.ts      # Valid OpenRouter model IDs

hooks/
  useInsights.ts            # Session state, API orchestration, tick counter
  useGraphState.ts          # Active layer / segment / node navigation state
```

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| LLM orchestration | LangGraph (`@langchain/langgraph`) |
| LLM providers | LangChain (OpenAI, Anthropic, Groq) + OpenRouter |
| Graph visualisation | ReactFlow (`@xyflow/react`) |
| DAG auto-layout | dagre |
| Animations | Framer Motion |
| Resizable panels | react-resizable-panels v2 |
| Markdown rendering | react-markdown + remark-gfm |
| Styling | Tailwind CSS |
