# SWOT Prompt Explorer — User Stories
**Subconscious AI Case Study | Author: Manoj Manjunatha**

---

## Design Reference

All visual specs are derived from `/Desgin/frames/shared.jsx` (design tokens + shared components) and `/Desgin/frames/frame1.jsx` (Segment Graph frame). The HTML prototype at `/Desgin/SWOT Explorer.html` is the canonical reference for layout proportions.

---

## Story Map Overview

```
Epic 1: Setup & Config  →  Epic 2: LangGraph Pipeline  →  Epic 3: Segment Graph  →  Epic 4: Insight DAG  →  Epic 5: Insight Panel  →  Epic 6: Polish & Deploy  →  Epic 7: Design Fidelity
```

---

## Epic 1 — Project Setup & API Key Management

### US-01 · Project Scaffold
**As a** developer,
**I want** a Next.js 14 (App Router) project bootstrapped with Tailwind, TypeScript, shadcn/ui, and all required dependencies,
**so that** I have a clean foundation to build on without configuration overhead.

**Acceptance Criteria:**
- [x] `npx create-next-app@latest` with `--typescript --tailwind --app --eslint`
- [x] All deps installed: `@langchain/langgraph`, `@langchain/core`, `@langchain/openai`, `@langchain/anthropic`, `@langchain/groq`, `@xyflow/react`, `dagre`, `framer-motion`, `react-markdown`, `lucide-react`
- [x] shadcn/ui initialized (`npx shadcn-ui@latest init`)
- [x] `npm run dev` starts without errors
- [x] TypeScript strict mode enabled

**Effort:** XS (15 min)
**Depends on:** —

---

### US-02 · API Key Settings Panel
**As a** first-time user (e.g., a code reviewer),
**I want** a settings panel where I can paste my LLM API keys once,
**so that** I don't need to set up `.env` files or redeploy anything to try the app.

**Acceptance Criteria:**
- [x] Gear icon (⚙) in top-right of sidebar opens a shadcn `Sheet` component
- [x] Inputs for: Anthropic (Claude), OpenAI, Groq, OpenRouter
- [x] Input type is `password` — keys are masked
- [x] "Save" persists keys to `localStorage` under key `swot_api_keys`
- [x] "Clear all" removes all keys from `localStorage` and resets form
- [x] On reload, saved keys pre-populate the form (masked)
- [x] Each field shows `✓ Connected` (green) when a key is present, `✗ Not set` (muted) when empty
- [x] Keys are never logged, stored server-side, or persisted beyond `localStorage`

**Effort:** S (30 min)
**Depends on:** US-01

---

### US-03 · First-Run Gate
**As a** new user with no API keys saved,
**I want** the "Run Analysis" button to be disabled with a clear prompt to add keys,
**so that** I get a helpful error state instead of a failed API call.

**Acceptance Criteria:**
- [x] "Run Analysis" button is disabled when no API key exists for the selected provider
- [x] Disabled state shows: `⚙ Add a key in Settings to get started`
- [x] Button becomes active as soon as a valid key is saved for the selected provider

**Effort:** XS (15 min)
**Depends on:** US-02

---

### US-04 · Optional Env Var Pre-fill
**As a** developer self-hosting the app,
**I want** to optionally pre-fill API keys via environment variables,
**so that** a deployed instance can come pre-configured without manual key entry.

**Acceptance Criteria:**
- [x] Supports `NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY`, `NEXT_PUBLIC_DEFAULT_OPENAI_KEY`, `NEXT_PUBLIC_DEFAULT_GROQ_KEY`, `NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY`
- [x] Env vars pre-populate the Settings form on first load (if `localStorage` is empty)
- [x] Users can override env var values with their own keys in the Settings panel
- [x] Env vars are `NEXT_PUBLIC_` — client-side only, no server-side secret storage

**Effort:** XS (15 min)
**Depends on:** US-02

---

## Epic 2 — LangGraph Pipeline & Multi-Provider Support

### US-05 · LangGraph State Definition
**As a** developer,
**I want** a typed `InsightState` annotation that captures input fields and all 9 output slots,
**so that** the graph has a single, well-typed state object flowing through all nodes.

**Acceptance Criteria:**
- [x] `lib/langgraph/state.ts` exports `InsightState` using `Annotation.Root`
- [x] Input fields: `product`, `objective`, `segment`, `provider`
- [x] Output fields: `marketingOKRs`, `strengths`, `weaknesses`, `opportunities`, `threats`, `marketPositioning`, `buyerPersona`, `investmentOpportunities`, `channelsDistribution`
- [x] All fields typed as `Annotation<string>()`
- [x] File compiles without TypeScript errors

**Effort:** XS (10 min)
**Depends on:** US-01

---

### US-06 · Provider Factory
**As a** developer,
**I want** a `getLLM(provider, keys)` function that returns the correct LangChain chat model for each provider,
**so that** the rest of the pipeline is provider-agnostic.

**Acceptance Criteria:**
- [x] `lib/langgraph/providers.ts` exports `getLLM` and `Provider` type
- [x] `'openai'` returns `ChatOpenAI` with model `gpt-4o-mini`, temp 0.7, maxTokens 400
- [x] `'claude'` returns `ChatAnthropic` with model `claude-haiku-4-5-20251001`, temp 0.7, maxTokens 400
- [x] `'groq'` returns `ChatGroq` with model `llama-3.3-70b-versatile`, temp 0.7, maxTokens 400
- [x] `'openrouter'` returns `ChatOpenAI` with `baseURL: 'https://openrouter.ai/api/v1'` and correct `defaultHeaders`
- [x] API keys are passed in via `keys` param, never hardcoded
- [x] Unrecognised provider throws a descriptive error

**Effort:** S (20 min)
**Depends on:** US-05

---

### US-07 · Prompt Config (`constants/prompt-config.ts`)
**As a** developer,
**I want** a single config file that defines all 9 prompt types with their label, icon, color, prompt template, and causal edges,
**so that** adding or changing a prompt type only requires editing one file.

**Acceptance Criteria:**
- [x] `constants/prompt-config.ts` exports `PROMPT_CONFIG` as `Record<PromptType, PromptMeta>`
- [x] All 9 keys present: `marketingOKRs`, `strengths`, `weaknesses`, `opportunities`, `threats`, `marketPositioning`, `buyerPersona`, `investmentOpportunities`, `channelsDistribution`
- [x] Each entry has: `label`, `icon` (Lucide icon name), `color`, `prompt(product, objective, segment): string`, `causalEdges: { to?: string, from?: string, label: string }[]`
- [x] Causal edges defined: threats→weaknesses (amplifies), opportunities→marketingOKRs (informs), buyerPersona→marketPositioning (shapes), strengths→investmentOpportunities (enables), channels→marketingOKRs (activates)
- [x] Prompts instruct the LLM to use markdown formatting

**Effort:** S (25 min)
**Depends on:** US-05

---

### US-08 · Node Factory & Graph Builder
**As a** developer,
**I want** a `makeInsightNode` factory and a `buildInsightGraph` function that wires all 9 nodes into a parallel `StateGraph`,
**so that** a single `graph.invoke()` call fires all prompts concurrently.

**Acceptance Criteria:**
- [x] `lib/langgraph/nodes.ts` exports `makeInsightNode(promptKey, llm)` — returns an async node function
- [x] Each node reads `state.product`, `state.objective`, `state.segment`, calls LLM, writes result to its key
- [x] System prompt: `"You are a senior market strategist. Be specific, not generic. Format responses in markdown."`
- [x] `lib/langgraph/graph.ts` exports `buildInsightGraph(provider, keys)`
- [x] Graph: `START` fans out to all 9 nodes, all 9 nodes fan in to `END`
- [x] `graph.compile()` succeeds without runtime errors
- [x] `graph.invoke({product, objective, segment, provider})` returns an object with all 9 insight keys populated

**Effort:** M (40 min)
**Depends on:** US-05, US-06, US-07

---

### US-09 · API Route (`/api/insights`)
**As a** frontend developer,
**I want** a `POST /api/insights` endpoint that accepts prompt inputs + API keys and returns all 9 insights,
**so that** the client can trigger the full pipeline with a single HTTP call.

**Acceptance Criteria:**
- [x] `app/api/insights/route.ts` exports `POST` handler
- [x] Accepts JSON body: `{ product, objective, segment, provider, keys, openrouterModel? }`
- [x] Invokes `buildInsightGraph(provider, keys)` then calls `graph.invoke(...)`
- [x] Returns `Response.json({ segment, provider, insights })` where `insights` contains all 9 keys
- [x] Returns HTTP 400 for missing required fields
- [x] Returns HTTP 500 with message on LLM errors (no stack traces exposed)
- [x] Keys from request body are used only for the current request — not stored, not logged
- [ ] `curl -X POST localhost:3000/api/insights -d '{"product":"...", ...}'` returns valid JSON

**Effort:** S (20 min)
**Depends on:** US-08

---

### US-10 · Provider Selector UI
**As a** user,
**I want** a segmented button group in the sidebar to switch between Claude, GPT-4o mini, Llama 3.3, and OpenRouter,
**so that** I can choose which LLM generates my analysis without touching any config.

**Acceptance Criteria:**
- [x] `components/sidebar/ProviderSelector.tsx` renders all 4 provider options as a segmented button group
- [x] Each option shows: icon (◆/⬡/▲), label, and badge (e.g., "Anthropic", "OpenAI", "Groq", "OpenRouter")
- [x] Active provider is highlighted with its brand color: Claude `#D97706`, OpenAI `#10B981`, Groq `#8B5CF6`, OpenRouter `#EC4899`
- [x] Providers without a saved API key show a lock icon and are non-clickable
- [x] Hovering a locked provider shows tooltip: `"Add key in Settings →"`
- [x] Selecting a provider updates global `provider` state immediately
- [x] When `openrouter` is selected, a model picker dropdown appears (see US-11)

**Effort:** S (30 min)
**Depends on:** US-02, US-06

---

### US-11 · OpenRouter Model Picker
**As a** user selecting OpenRouter,
**I want** a secondary dropdown that lets me pick any supported model,
**so that** I can test Gemini, Mistral, DeepSeek, or other models without separate accounts.

**Acceptance Criteria:**
- [x] Dropdown appears only when `openrouter` provider is selected
- [x] Pre-populated with 6 curated models: Mistral 7B, Llama 3.1 8B, Gemini Flash 1.5, Claude 3 Haiku, GPT-4o Mini, DeepSeek Chat
- [x] Selected model stored in `localStorage` alongside keys
- [x] Selected model sent as `openrouterModel` in POST body
- [x] Default selection: `mistralai/mistral-7b-instruct`

**Effort:** XS (20 min)
**Depends on:** US-10

---

## Epic 3 — Segment Graph (Layer 1)

### US-12 · Segment Input Form
**As a** user,
**I want** to type a product name, an objective, and one or more customer segments into the sidebar,
**so that** the app knows what to analyze.

**Acceptance Criteria:**
- [x] Sidebar contains: `Product` text input, `Objective` text input, `Segments` list with add/remove capability, `Provider` selector (US-10), settings gear icon (US-02), and "Run Analysis" button
- [x] Segments can be added by pressing Enter or clicking "+"
- [x] Segments can be removed via an × on each entry
- [x] "Run Analysis" button is disabled until product, objective, and at least one segment are filled
- [x] Form state persists across provider switches (don't reset on provider change)
- [x] Max 6 segments (UI constraint, not technical)

**Effort:** S (25 min)
**Depends on:** US-01

---

### US-13 · Segment Graph Render (Layer 1)
**As a** user,
**I want** to see my customer segments as nodes in a ReactFlow graph,
**so that** I can visualize all segments at a glance before drilling in.

**Acceptance Criteria:**
- [x] `components/graphs/SegmentGraph.tsx` renders segments as custom `SegmentNode` nodes
- [x] Canvas background: `#0A0A0F`
- [x] Nodes positioned radially using `getRadialPosition(i, total)`
- [x] Edges connect segments that share behavioral traits; solid `0.5px` muted color
- [x] Each node displays: segment name, status badge (`idle` / `loading` / `ready`), provider badge (when ready)
- [x] `@xyflow/react` canvas fills the main area; sidebar is separate
- [x] `fitView` called after nodes mount
- [x] ReactFlow minimap enabled (bottom-right corner)
- [x] ReactFlow controls enabled (zoom in/out/reset)

**Effort:** M (45 min)
**Depends on:** US-12

---

### US-14 · Segment Node Status States
**As a** user,
**I want** each segment node to visually reflect whether analysis has been run,
**so that** I can tell at a glance which segments are ready to explore.

**Acceptance Criteria:**
- [x] `idle` → neutral border, muted text, no badge
- [x] `loading` → pulsing ring animation (Tailwind `animate-pulse`), spinner icon
- [x] `ready` → colored border matching provider color, provider badge showing which provider was used
- [x] `error` → red border, warning icon, hover shows error message
- [x] Status transitions are smooth (no flash/jump)

**Effort:** S (20 min)
**Depends on:** US-13

---

### US-15 · Run Analysis for a Segment
**As a** user,
**I want** to click "Run Analysis" to trigger LLM analysis for all segments simultaneously,
**so that** I don't have to run each one manually.

**Acceptance Criteria:**
- [ ] Clicking "Run Analysis" fires `POST /api/insights` for every segment in parallel (`Promise.all`)
- [ ] Each segment node transitions to `loading` immediately on click
- [ ] When a segment's response arrives, it transitions to `ready`
- [ ] If one segment fails, it transitions to `error`; others continue
- [ ] Results are cached in `useInsights` hook with key `${segment}:${provider}`
- [ ] Re-clicking "Run Analysis" with the same segment+provider uses the cached result (no new API call)
- [ ] Re-clicking with a different provider fires a new request even for the same segment

**Effort:** M (40 min)
**Depends on:** US-09, US-13

---

## Epic 4 — Insight DAG (Layer 2)

### US-16 · Layer Switch on Segment Click
**As a** user,
**I want** to click a `ready` segment node to drill into its 9 insight nodes,
**so that** I can explore the detailed analysis for that segment.

**Acceptance Criteria:**
- [x] Clicking a `ready` segment node transitions the canvas from Layer 1 to Layer 2
- [ ] Layer transition is animated (Framer Motion: fade out Layer 1, fade in Layer 2)
- [x] A breadcrumb or back button shows the active segment name
- [x] Clicking `idle` or `loading` nodes does nothing (or shows a tooltip: "Run analysis first")
- [x] Back button returns to Layer 1 with the segment graph intact

**Effort:** M (35 min)
**Depends on:** US-14, US-15

---

### US-17 · Insight DAG Render with dagre Layout
**As a** user,
**I want** to see the 9 insight nodes for a segment auto-arranged in a DAG layout,
**so that** causal relationships flow visually from top to bottom.

**Acceptance Criteria:**
- [x] `components/graphs/InsightDAG.tsx` renders 9 `InsightNode` nodes
- [x] `lib/graph-utils.ts` exports `getLayoutedElements(nodes, edges)` using `dagre`
- [x] dagre config: `rankdir: 'TB'`, `ranksep: 80`, `nodesep: 60`
- [x] Each node: 180px × 72px, shows icon + label + color from `PROMPT_CONFIG`
- [x] `fitView` called after layout

**Effort:** M (45 min)
**Depends on:** US-16, US-07

---

### US-18 · Causal Edges with Styled Labels
**As a** user,
**I want** to see labeled, color-coded dashed edges between insight nodes that have causal relationships,
**so that** I understand how one insight influences another.

**Acceptance Criteria:**
- [x] Edges derived from `causalEdges` in `PROMPT_CONFIG`
- [x] Edge styles by relationship type:
  - `amplifies` → dashed red
  - `informs` → dashed blue
  - `shapes` → dashed purple
  - `enables` → dashed green
  - `activates` → dashed orange
- [x] Edge labels rendered as small text mid-edge
- [x] All 5 defined causal edges render correctly
- [x] Standard segment→insight connection edges: solid, 0.5px, muted color

**Effort:** S (30 min)
**Depends on:** US-17

---

## Epic 5 — Insight Panel

### US-19 · Insight Panel Slide-in
**As a** user,
**I want** to click an insight node to see the full LLM-generated response in a side panel,
**so that** I can read the detailed analysis without leaving the graph view.

**Acceptance Criteria:**
- [x] `components/panels/InsightPanel.tsx` slides in from the right on node click (Framer Motion)
- [x] Panel shows: insight type label, icon, color accent, and the full LLM response body
- [x] LLM response is rendered as markdown using `react-markdown`
- [x] Panel can be closed via × button or pressing Escape
- [x] Closing the panel deselects the node
- [x] Clicking a different node while panel is open swaps content (no close/reopen flash)
- [x] Panel width: ~380px on desktop, does not overlap the graph controls

**Effort:** M (40 min)
**Depends on:** US-17

---

### US-20 · Provider Badge on Segment Nodes
**As a** user,
**I want** each segment node to show which provider generated its analysis,
**so that** I can track which results came from which LLM when comparing.

**Acceptance Criteria:**
- [x] `ready` segment nodes display a small badge: provider label + brand color
- [x] Badge shows: "Claude" (amber), "GPT-4o mini" (green), "Llama 3.3" (purple), "OpenRouter" (pink)
- [x] If a segment has been run with multiple providers (cache has multiple entries), the badge shows the currently selected provider's result
- [x] Badge is visible at default zoom level without requiring hover

**Effort:** XS (15 min)
**Depends on:** US-14

---

### US-21 · Provider Comparison (Same Segment, Different Providers)
**As a** user,
**I want** to run the same segment with a different provider and compare results side-by-side,
**so that** I can evaluate which LLM gives more useful SWOT insights.

**Acceptance Criteria:**
- [ ] Cache key is `${segmentName}:${provider}` — both results stay in memory simultaneously
- [ ] Switching provider in the selector shows the cached result for that provider (if available)
- [ ] `ComparePanel.tsx` (bonus) — if two providers have cached results for the same segment, a "Compare" button appears in the sidebar
- [ ] Compare panel shows two insight bodies side-by-side for the same insight type
- [ ] Compare mode is optional — basic provider switch + badge suffices for MVP

**Effort:** M (45 min — compare panel is bonus)
**Depends on:** US-15, US-19

---

## Epic 6 — Polish, Animation & Deployment

### US-22 · Framer Motion Transitions
**As a** user,
**I want** smooth animations when switching layers or opening panels,
**so that** the app feels polished and intentional rather than abrupt.

**Acceptance Criteria:**
- [x] Layer 1 → Layer 2 transition: Layer 1 fades out (300ms), Layer 2 fades in (300ms)
- [x] Layer 2 → Layer 1 (back): same fade in reverse
- [x] Insight panel: slides in from right (300ms ease-out)
- [x] Insight panel close: slides out to right (200ms ease-in)
- [ ] Segment nodes animate from 0 → 1 opacity on initial render (staggered, 50ms apart)
- [x] No layout shift during any transition

**Effort:** S (25 min)
**Depends on:** US-16, US-19

---

### US-23 · Dark Mode Visual Design
**As a** user,
**I want** the app to use a consistent dark-mode design system,
**so that** it looks like a professional internal tool, not a demo.

**Acceptance Criteria:**
- [x] Background: `#0A0A0F`, Surface: `#13131A`, Border: `#1E1E2E`
- [x] Provider badge colors applied consistently: Claude=#D97706, OpenAI=#10B981, Groq=#8B5CF6, OpenRouter=#EC4899
- [x] All text readable at WCAG AA contrast on dark backgrounds
- [x] ReactFlow canvas background matches app background (no white box)
- [x] Tailwind dark mode class applied at root level

**Effort:** S (20 min)
**Depends on:** US-13

---

### US-24 · Vercel Deployment
**As a** recruiter or reviewer,
**I want** a live URL to access the app without running it locally,
**so that** I can evaluate the project immediately.

**Acceptance Criteria:**
- [ ] App deploys to Vercel with `vercel --prod`
- [ ] Vercel environment variables set: `NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY`, `NEXT_PUBLIC_DEFAULT_OPENAI_KEY`, `NEXT_PUBLIC_DEFAULT_GROQ_KEY`, `NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY` (optional — reviewer can use their own)
- [x] Build passes without TypeScript errors or lint warnings
- [ ] Live URL added to `ARCHITECTURE.md` Section 1
- [x] No secrets committed to git

**Effort:** XS (15 min)
**Depends on:** All previous stories

---

## Epic 7 — Design System & UI Fidelity

### US-D01 · Design Token System
**As a** developer,
**I want** a single `tokens.ts` (or Tailwind config extension) that captures the color system from `ARCHITECTURE.md` Section 11,
**so that** every component references the same values and there's one place to update colors.

**Acceptance Criteria:**
- [x] `lib/tokens.ts` (or `tailwind.config.ts` theme extension) defines:
  - **Backgrounds**: `#0A0A0F` (bg), `#13131A` (surface), `#1E1E2E` (border)
  - **Provider badge colors**: Claude `#D97706`, OpenAI `#10B981`, Groq `#8B5CF6`
  - **Edge colors by relationship**: amplifies=red, informs=blue, shapes=purple, enables=green, activates=orange
- [x] All components import from this single source — no hardcoded hex values in component files
- [x] Tailwind dark mode class applied at root (`<html class="dark">`)

**Effort:** XS (15 min)
**Depends on:** US-01

---

### US-D02 · Icon Library (Lucide Icons)
**As a** developer,
**I want** all icons sourced from `lucide-react` (specified in ARCHITECTURE.md Section 3),
**so that** insight nodes and UI controls have consistent iconography.

**Acceptance Criteria:**
- [x] `lucide-react` installed (already in dependency list)
- [x] Insight-type icon mapping per `PROMPT_CONFIG` (from `constants/prompt-config.ts`):
  - `marketingOKRs` → `Target`
  - `strengths` → `TrendingUp`
  - `weaknesses` → `AlertTriangle`
  - `opportunities` → `Sparkles`
  - `threats` → `Shield`
  - `marketPositioning` → `Crosshair`
  - `buyerPersona` → `User`
  - `investmentOpportunities` → `BarChart2`
  - `channelsDistribution` → `Share2`
- [x] Icon names stored in `PROMPT_CONFIG` (each entry has an `icon` field) so the mapping lives in one place

**Effort:** XS (15 min)
**Depends on:** US-07

---

### US-D03 · Insight Node Design (Color + Icon)
**As a** user,
**I want** each insight node in the DAG to have a distinct color and icon matching its category,
**so that** I can identify insight types at a glance without reading labels.

**Acceptance Criteria:**
- [x] `components/graphs/InsightNode.tsx` renders using the `color` and `icon` fields from `PROMPT_CONFIG`
- [x] Each node shows: Lucide icon (from US-D02 mapping) + label, color-coded per type
- [x] Node color is driven entirely by `PROMPT_CONFIG[key].color` — no separate hardcoded values in the component
- [x] Node selected state (panel open): highlighted border in the node's color
- [x] Hover state: subtle glow matching the node's color

**Effort:** S (25 min)
**Depends on:** US-17, US-D01, US-D02

---

## Story Summary

| ID | Title | Epic | Effort | Depends On |
|----|-------|------|--------|------------|
| US-01 | Project Scaffold | Setup | XS | — |
| US-02 | API Key Settings Panel | Setup | S | US-01 |
| US-03 | First-Run Gate | Setup | XS | US-02 |
| US-04 | Env Var Pre-fill | Setup | XS | US-02 |
| US-05 | LangGraph State Definition | Pipeline | XS | US-01 |
| US-06 | Provider Factory | Pipeline | S | US-05 |
| US-07 | Prompt Config | Pipeline | S | US-05 |
| US-08 | Node Factory & Graph Builder | Pipeline | M | US-05–07 |
| US-09 | API Route `/api/insights` | Pipeline | S | US-08 |
| US-10 | Provider Selector UI (segmented group) | Pipeline | S | US-02, US-06 |
| US-11 | OpenRouter Model Picker | Pipeline | XS | US-10 |
| US-12 | Segment Input Form | Segment Graph | S | US-01 |
| US-13 | Segment Graph Render | Segment Graph | M | US-12 |
| US-14 | Segment Node Status States | Segment Graph | S | US-13 |
| US-15 | Run Analysis for a Segment | Segment Graph | M | US-09, US-13 |
| US-16 | Layer Switch on Segment Click | Insight DAG | M | US-14, US-15 |
| US-17 | Insight DAG with dagre | Insight DAG | M | US-16, US-07 |
| US-18 | Causal Edges with Labels | Insight DAG | S | US-17 |
| US-19 | Insight Panel Slide-in | Insight Panel | M | US-17 |
| US-20 | Provider Badge on Nodes | Insight Panel | XS | US-14 |
| US-21 | Provider Comparison | Insight Panel | M | US-15, US-19 |
| US-22 | Framer Motion Transitions | Polish | S | US-16, US-19 |
| US-23 | Dark Mode Visual Design | Polish | S | US-D01 |
| US-24 | Vercel Deployment | Deploy | XS | All |
| US-D01 | Design Token System | Design | XS | US-01 |
| US-D02 | Icon Library (Lucide mapping) | Design | XS | US-07 |
| US-D03 | Insight Node Design (color + icon) | Design | S | US-17, US-D01 |

---

## Effort Key

| Size | Estimated Time |
|------|----------------|
| XS | ≤ 15 min |
| S | 20–30 min |
| M | 35–45 min |
| L | 60+ min |

**Total estimated build time:** ~5–6 hours (within the 4–6h budget; design stories overlap with component builds)

---

## Build Order (Critical Path)

```
US-01 → US-D01                                   [design token foundation]
      → US-05  → US-06  → US-07 → US-08 → US-09 [pipeline ready to curl-test]
               → US-D02 (icon mapping)            [lucide icons per prompt type]
      → US-02  → US-03                            [settings gate]
      → US-10  → US-11                            [provider selector]
      → US-12  → US-13 → US-14 → US-15           [sidebar + segment graph + run]
                         → US-16 → US-17 → US-18 → US-D03  [insight DAG + node design]
                                        → US-19 → US-22     [panel + animation]
               → US-20 → US-21                   [comparison]
               → US-23 → US-24                   [visual polish + deploy]
```

---

## Phase 3 — Dynamic DAG Generation

> **Context:** The current DAG shape (9 fixed nodes, fixed causal edges) is hardcoded in `constants/prompt-config.ts`. Phase 3 replaces this with a two-step agentic flow: an LLM *plans* a custom DAG for the given product/objective/segment, then a second LLM execution step runs all planned nodes in parallel. The UI shows users the DAG skeleton before content arrives, making the planning step visible.

---

## Epic 8 — DAG Planning Agent

### US-25 · DagSpec Type Definitions
**As a** developer,
**I want** shared TypeScript types for the dynamic DAG specification,
**so that** the planning API, LangGraph builder, ReactFlow builder, and UI all speak the same schema.

**Acceptance Criteria:**
- [ ] `lib/types.ts` adds: `DagNode`, `DagEdge`, `DagSpec` interfaces
- [ ] `DagNode`: `{ id: string, label: string, prompt: string, color: string, iconName: string }`
- [ ] `DagEdge`: `{ from: string, to: string, relation: EdgeRelation }`
- [ ] `DagSpec`: `{ nodes: DagNode[], edges: DagEdge[] }`
- [ ] `EdgeRelation` type already exists in `lib/tokens.ts` — reuse it, do not duplicate
- [ ] All new types exported and importable from `@/lib/types`
- [ ] No runtime code — types only, zero bundle impact

**Effort:** XS (10 min)
**Depends on:** US-01

---

### US-26 · Planning API Route (`/api/plan`)
**As a** developer,
**I want** a `POST /api/plan` endpoint that calls an LLM and returns a `DagSpec` tailored to the given product, objective, and segment,
**so that** the DAG structure is generated at runtime rather than hardcoded.

**Acceptance Criteria:**
- [ ] `app/api/plan/route.ts` exports a `POST` handler
- [ ] Accepts JSON body: `{ product, objective, segment, provider, keys, openrouterModel? }`
- [ ] Uses the same `getLLM(provider, keys)` factory as `/api/insights`
- [ ] System prompt instructs the LLM to act as a "strategic analysis architect"
- [ ] User prompt requests 6–10 analysis nodes relevant to the specific product/objective/segment (not always SWOT)
- [ ] Prompt requires icons from the allowed Lucide set: `Target`, `TrendingUp`, `AlertTriangle`, `Sparkles`, `Shield`, `Crosshair`, `User`, `BarChart2`, `Share2`, `Zap`, `Globe`, `DollarSign`, `Clock`, `Star`
- [ ] Prompt requires edge relations from the allowed set: `amplifies`, `informs`, `shapes`, `enables`, `activates`
- [ ] Response is parsed and validated as `DagSpec` before returning
- [ ] Returns `Response.json({ dagSpec })` on success
- [ ] Returns HTTP 400 for missing fields; HTTP 500 with message on LLM/parse errors
- [ ] If LLM returns invalid JSON, retries once before returning 500
- [ ] Keys are never logged or stored beyond the current request

**Effort:** M (45 min)
**Depends on:** US-25, US-06, US-09

---

### US-27 · Icon Name → LucideIcon Map
**As a** developer,
**I want** a lookup map from icon name strings (returned by the LLM) to actual `LucideIcon` components,
**so that** `DagNode.iconName` can be resolved at render time without `eval` or dynamic imports.

**Acceptance Criteria:**
- [ ] `lib/icon-map.ts` exports `ICON_MAP: Record<string, LucideIcon>`
- [ ] Covers all icons the planning prompt allows: `Target`, `TrendingUp`, `AlertTriangle`, `Sparkles`, `Shield`, `Crosshair`, `User`, `BarChart2`, `Share2`, `Zap`, `Globe`, `DollarSign`, `Clock`, `Star`
- [ ] Falls back to `BarChart2` for any unrecognised name (guards against LLM hallucinating icon names)
- [ ] Used in `lib/graph-utils.ts` when building ReactFlow nodes from a `DagSpec`

**Effort:** XS (10 min)
**Depends on:** US-25

---

## Epic 9 — Dynamic LangGraph Execution

### US-28 · Dynamic InsightState (outputs map)
**As a** developer,
**I want** to replace the 9 hardcoded typed annotation fields in `InsightState` with a single `outputs: Record<string, string>` reducer,
**so that** LangGraph can handle an arbitrary set of node IDs at runtime.

**Acceptance Criteria:**
- [ ] `lib/langgraph/state.ts` replaces individual output fields (`marketingOKRs`, `strengths`, etc.) with `outputs: Annotation<Record<string, string>>` using a merge reducer: `(prev, next) => ({ ...prev, ...next })`
- [ ] `dagSpec` field added to state: `Annotation<DagSpec | null>()`
- [ ] Input fields (`product`, `objective`, `segment`, `provider`) unchanged
- [ ] `default` for `outputs` is `() => ({})`
- [ ] `default` for `dagSpec` is `() => null`
- [ ] File compiles without TypeScript errors
- [ ] Existing `lib/langgraph/nodes.ts` updated: each node writes `{ outputs: { [nodeId]: content } }` instead of `{ [promptKey]: content }`

**Effort:** S (25 min)
**Depends on:** US-25, US-05

---

### US-29 · Dynamic Graph Builder
**As a** developer,
**I want** `buildInsightGraph` to accept a `DagSpec` and construct LangGraph nodes dynamically from it,
**so that** execution topology is determined at runtime from the planning output.

**Acceptance Criteria:**
- [ ] `buildInsightGraph(provider, keys, dagSpec: DagSpec)` signature updated
- [ ] For each `dagSpec.nodes` entry, a LangGraph node is created with an inline async function
- [ ] Each node invokes the LLM with the node's `prompt` string from `DagSpec`
- [ ] System prompt unchanged: `"You are a senior market strategist. Be specific, not generic. Format responses in markdown."`
- [ ] Each node writes `{ outputs: { [node.id]: responseContent } }` to state
- [ ] All nodes fan out from `START` and fan in to `END` (parallel execution, same pattern as today)
- [ ] `PROMPT_CONFIG` is no longer imported by `graph.ts`
- [ ] `graph.compile()` succeeds for any valid `DagSpec` with 1–20 nodes

**Effort:** M (35 min)
**Depends on:** US-28, US-06

---

### US-30 · Update `/api/insights` to Accept DagSpec
**As a** developer,
**I want** `/api/insights` to accept a `dagSpec` in its request body and forward it to `buildInsightGraph`,
**so that** the dynamically planned DAG drives execution.

**Acceptance Criteria:**
- [ ] `app/api/insights/route.ts` accepts optional `dagSpec` in the POST body
- [ ] If `dagSpec` is present, it is passed directly to `buildInsightGraph`
- [ ] If `dagSpec` is absent (backwards-compat), the endpoint returns HTTP 400 with message `"dagSpec required"`
- [ ] Response shape changes: returns `{ insights: Record<string, string> }` keyed by node IDs from `DagSpec` (not hardcoded prompt type keys)
- [ ] No other behaviour changes

**Effort:** S (20 min)
**Depends on:** US-29

---

## Epic 10 — Dynamic ReactFlow DAG

### US-31 · `buildInsightElements` Accepts DagSpec
**As a** developer,
**I want** `buildInsightElements` in `lib/graph-utils.ts` to accept a `DagSpec` instead of reading from `PROMPT_CONFIG`,
**so that** the ReactFlow graph structure is driven by the same runtime spec as the LangGraph execution.

**Acceptance Criteria:**
- [ ] `buildInsightElements(segmentId: string, dagSpec: DagSpec)` signature updated
- [ ] ReactFlow nodes built from `dagSpec.nodes`; each node's `data` uses `id`, `label`, `color`, `iconName` (resolved via `ICON_MAP`)
- [ ] ReactFlow edges built from `dagSpec.edges`; style derived from `tokens.edges[relation]` as before
- [ ] dagre layout applied identically to the existing flow
- [ ] `PROMPT_CONFIG` is no longer imported by `graph-utils.ts`
- [ ] Existing dagre node sizing logic preserved

**Effort:** S (25 min)
**Depends on:** US-25, US-27

---

### US-32 · DAG Skeleton Loading State
**As a** user,
**I want** to see the DAG structure (nodes and edges) rendered with loading spinners *before* the insight content arrives,
**so that** I can observe the LLM's planning decision and understand what will be generated.

**Acceptance Criteria:**
- [ ] After segment click, the UI shows a "Planning analysis..." state while `/api/plan` is in flight
- [ ] Once `DagSpec` arrives, all nodes render immediately in `idle` status with correct labels, colors, and icons
- [ ] Nodes transition from `idle` → `loading` when `/api/insights` starts
- [ ] Nodes transition from `loading` → `ready` as their content arrives (keyed by `node.id`)
- [ ] The "Planning..." state is visually distinct from the "Running..." state (different label/icon)
- [ ] If planning fails, a dismissible error banner is shown and the user can retry

**Effort:** M (40 min)
**Depends on:** US-26, US-31, US-16

---

### US-33 · InsightDAG Receives DagSpec as Prop
**As a** developer,
**I want** `InsightDAG` to accept a `dagSpec` prop and pass it to `buildInsightElements`,
**so that** the rendered graph always reflects the planned structure for that segment.

**Acceptance Criteria:**
- [ ] `InsightDAG` props updated: `dagSpec: DagSpec` replaces any dependency on `PROMPT_CONFIG`
- [ ] `dagSpec` is stored per segment in `useInsights` state (alongside `insights`)
- [ ] If `dagSpec` is null (planning not yet complete), `InsightDAG` renders a skeleton or null
- [ ] `onNodeClick` callback passes `node.id` (string) rather than `PromptType` — caller uses this to look up content in `insights` map
- [ ] No `PromptType` union is referenced in `InsightDAG.tsx` after this change

**Effort:** S (30 min)
**Depends on:** US-31, US-32

---

### US-34 · InsightPanel Works with Dynamic Node IDs
**As a** developer,
**I want** `InsightPanel` to look up content by arbitrary node ID string rather than a fixed `PromptType`,
**so that** it renders correctly regardless of what the planning LLM named the nodes.

**Acceptance Criteria:**
- [ ] `InsightPanel` props change: `promptKey: string | null` (was `PromptType | null`)
- [ ] Panel header (label, icon, color) resolved from the session's `DagSpec` by matching `promptKey` to `dagSpec.nodes[].id`
- [ ] Content looked up from `session.insights[promptKey]`
- [ ] Falls back gracefully if `dagSpec` is null or node ID not found
- [ ] `PromptType` import removed from `InsightPanel.tsx`

**Effort:** S (20 min)
**Depends on:** US-33

---

### US-35 · Update `useInsights` Hook for Dynamic Outputs
**As a** developer,
**I want** `useInsights` to store both the `DagSpec` and a `Record<string, string>` insights map per segment session,
**so that** the two-phase flow (plan → execute) is reflected in the session state.

**Acceptance Criteria:**
- [ ] `SegmentSession` type updated: adds `dagSpec: DagSpec | null`; `insights` changes from `Record<PromptType, string>` to `Record<string, string>`
- [ ] `useInsights` exposes a `plan` step: `planSegment(segment, config)` calls `/api/plan`, stores `dagSpec` in session, triggers re-render
- [ ] `runSegment` calls `/api/insights` with `dagSpec` from the session
- [ ] Session status flow: `idle` → `planning` → `running` → `ready` (adds `planning` status)
- [ ] Cache key unchanged: `${segment}:${provider}`
- [ ] `planSegment` and `runSegment` can be called in sequence from the parent (no coupling inside the hook)

**Effort:** M (40 min)
**Depends on:** US-26, US-30

---

## Story Summary (Phase 3 additions)

| ID | Title | Epic | Effort | Depends On |
|----|-------|------|--------|------------|
| US-25 | DagSpec Type Definitions | DAG Planning | XS | US-01 |
| US-26 | Planning API Route `/api/plan` | DAG Planning | M | US-25, US-06, US-09 |
| US-27 | Icon Name → LucideIcon Map | DAG Planning | XS | US-25 |
| US-28 | Dynamic InsightState (outputs map) | Dynamic LangGraph | S | US-25, US-05 |
| US-29 | Dynamic Graph Builder | Dynamic LangGraph | M | US-28, US-06 |
| US-30 | Update `/api/insights` for DagSpec | Dynamic LangGraph | S | US-29 |
| US-31 | `buildInsightElements` Accepts DagSpec | Dynamic ReactFlow | S | US-25, US-27 |
| US-32 | DAG Skeleton Loading State | Dynamic ReactFlow | M | US-26, US-31, US-16 |
| US-33 | InsightDAG Receives DagSpec as Prop | Dynamic ReactFlow | S | US-31, US-32 |
| US-34 | InsightPanel Works with Dynamic Node IDs | Dynamic ReactFlow | S | US-33 |
| US-35 | Update `useInsights` for Dynamic Outputs | Dynamic ReactFlow | M | US-26, US-30 |

**Phase 3 estimated build time:** ~3–4 hours

---

## Phase 3 Build Order (Critical Path)

```
US-25 (types)
  └─ US-27 (icon map)
  └─ US-26 (plan API)  ──────────────────────────────┐
  └─ US-28 (dynamic state)                           │
       └─ US-29 (dynamic graph builder)              │
            └─ US-30 (update /api/insights)          │
  └─ US-31 (buildInsightElements)  ─────────────────►│
       └─ US-32 (skeleton loading) ◄─────────────────┘
            └─ US-33 (InsightDAG prop)  ◄── US-35 (useInsights hook)
                 └─ US-34 (InsightPanel dynamic IDs)
```

---

## Phase 4 — Chat-Driven DAG Augmentation & Stale Node Detection

> **Context:** After the dynamic DAG is generated (Phase 3), users need a way to refine and extend it without redoing the whole analysis. A chat bar docked to the bottom of the DAG canvas (the red-box area) lets users ask the LLM to append new nodes. When input parameters (product/objective/segment) change after a session is ready, affected nodes are flagged stale so users can selectively re-run just those nodes rather than restarting from scratch.

---

## Epic 11 — Chat Panel & DAG Augmentation

### US-36 · ChatMessage Type & Session Chat History
**As a** developer,
**I want** a `ChatMessage` type and a `chat` history array in `SegmentSession`,
**so that** the chat panel has a typed data model and conversation history persists per session.

**Acceptance Criteria:**
- [ ] `lib/types.ts` adds `ChatMessage` interface: `{ role: 'user' | 'assistant', content: string, additions?: { nodes: DagNode[], edges: DagEdge[] } }`
- [ ] `SegmentSession` gains `chat: ChatMessage[]` field, default `[]`
- [ ] `useInsights` initialises `chat: []` in new sessions
- [ ] No runtime code — types and default value only

**Effort:** XS (10 min)
**Depends on:** US-25

---

### US-37 · `/api/chat` Route
**As a** developer,
**I want** a `POST /api/chat` endpoint that takes the user message, current `DagSpec`, and conversation history, and returns either a text reply or a text reply plus new nodes to append,
**so that** the chat panel can extend the DAG non-destructively via LLM.

**Acceptance Criteria:**
- [ ] `app/api/chat/route.ts` exports a `POST` handler
- [ ] Accepts: `{ message, dagSpec, product, objective, segment, history, provider, keys }`
- [ ] System prompt instructs the LLM: respond in plain text for questions/comments; if the user wants a new analysis lens, also return a JSON `additions` block with new nodes + edges
- [ ] LLM is told: node ids must be lowercase underscore, must not duplicate existing `dagSpec.nodes[].id` values, `iconName` and `relation` must be from the allowed sets
- [ ] Response parsed: if raw content contains a fenced `additions` JSON block, extract it; otherwise treat entire content as plain text reply
- [ ] New node `prompt` strings are fully self-contained (include product/objective/segment inline)
- [ ] Validates additions: unknown icon names fall back to `BarChart2`; edges referencing unknown node ids are dropped
- [ ] Returns `{ reply: string, additions?: { nodes: DagNode[], edges: DagEdge[] } }`
- [ ] Returns HTTP 400 for missing required fields; HTTP 500 on LLM error
- [ ] Keys never logged or stored

**Effort:** M (45 min)
**Depends on:** US-36, US-26

---

### US-38 · Chat Panel Component
**As a** user,
**I want** a collapsible chat bar docked to the bottom of the DAG canvas (in the empty red-box area),
**so that** I can ask the LLM to extend the analysis without leaving the graph view.

**Acceptance Criteria:**
- [ ] `components/panels/DagChatPanel.tsx` renders a sticky bar at the bottom of the DAG canvas
- [ ] Panel height: ~160px expanded, collapses to a single row (24px) with a `💬 Chat` toggle chip
- [ ] Collapsed by default; expands on click
- [ ] Message history scrolls inside the panel; newest message always visible
- [ ] User messages: right-aligned, `#1E1E2E` bubble
- [ ] Assistant messages: left-aligned, muted text, with an optional "Added N node(s)" badge if `additions` was returned
- [ ] Input: full-width text field + Send button; Enter submits, Shift+Enter adds newline
- [ ] Send button disabled while a chat request is in flight; shows spinner
- [ ] Panel is only shown when `session.status === 'ready'` or `session.status === 'loading'` (not during planning)
- [ ] Entire panel sits inside the DAG canvas div, above the ReactFlow `<Controls>`

**Effort:** M (50 min)
**Depends on:** US-36

---

### US-39 · DagSpec Augmentation (Append Nodes)
**As a** developer,
**I want** the chat flow to append new nodes and edges to the existing `DagSpec` non-destructively and immediately queue the new nodes for execution,
**so that** the DAG grows incrementally without replacing any existing content.

**Acceptance Criteria:**
- [ ] `useInsights` exposes `augmentDag(segment, provider, additions)` that merges `additions.nodes` and `additions.edges` into `session.dagSpec` (no duplicates by id)
- [ ] After merging, new nodes are immediately run via `runSegment` for only the new node ids
- [ ] Existing node content is untouched
- [ ] `tick` is incremented so ReactFlow re-renders with new nodes
- [ ] If a new edge references an existing node id (as source or target), that is valid and renders correctly

**Effort:** S (25 min)
**Depends on:** US-37, US-35

---

### US-40 · New Nodes Positioned Below Existing Layout
**As a** user,
**I want** appended nodes to appear below the existing DAG layout rather than overlapping it,
**so that** the graph remains readable after augmentation.

**Acceptance Criteria:**
- [ ] `buildInsightElements` detects which nodes in `dagSpec` are "new" (not yet laid out) by comparing against previously positioned nodes
- [ ] New nodes are initially placed below the lowest `y` coordinate of existing laid-out nodes with a `V_GAP` offset
- [ ] Dagre re-layout is then applied to the full updated node+edge set so edges route correctly
- [ ] No existing node positions are meaningfully shifted by the addition (dagre `ranker: 'tight-tree'` or fixed-position option for existing nodes)
- [ ] If no existing nodes are present, standard layout applies

**Effort:** S (30 min)
**Depends on:** US-39, US-31

---

## Epic 12 — Stale Node Detection & Selective Re-run

### US-41 · Stale Node Detection
**As a** developer,
**I want** the app to detect when `product`, `objective`, or `segment` changes after a session is `ready` and mark the session's nodes as stale,
**so that** users are informed which analyses may no longer be accurate.

**Acceptance Criteria:**
- [ ] `SegmentSession` gains `inputSnapshot: { product: string, objective: string, segment: string } | null`
- [ ] `inputSnapshot` is saved when a session transitions to `ready`
- [ ] `app/page.tsx` (or `useInsights`) compares current inputs against `inputSnapshot` on each render
- [ ] When a mismatch is detected, `session.staleNodeIds: Set<string>` is updated to include all node ids whose prompts reference the changed field
- [ ] For simplicity in v1: any input change marks ALL node ids as stale
- [ ] `staleNodeIds` resets to empty when the session is re-run

**Effort:** S (25 min)
**Depends on:** US-35

---

### US-42 · Stale Node UI
**As a** user,
**I want** stale insight nodes to show a yellow `⚠` badge,
**so that** I can see at a glance which analyses were run with different inputs.

**Acceptance Criteria:**
- [ ] `InsightNodeData` gains optional `stale?: boolean` field
- [ ] When `stale === true`, `InsightNode` renders a small yellow `⚠` icon in the top-right corner of the node
- [ ] Node border changes to amber (`#F59E0B`) when stale, regardless of prior status color
- [ ] Tooltip on hover: `"Run with updated inputs"`
- [ ] Stale badge is not shown on `productNode` or `segmentNode`
- [ ] `InsightDAG` passes `stale` flag from `session.staleNodeIds` into each node's data

**Effort:** S (25 min)
**Depends on:** US-41

---

### US-43 · Single-Node Re-run
**As a** user,
**I want** to click a stale insight node and re-run just that node with the current inputs,
**so that** I can refresh specific analyses without discarding the rest of the session.

**Acceptance Criteria:**
- [ ] `useInsights` exposes `rerunNode(segment, provider, nodeId, config)` that:
  - sets the single node's status to `loading` in the insights map
  - calls `/api/insights` with a single-node `DagSpec` (just that one node + its prompt)
  - merges the returned output back into `session.insights` without touching other keys
  - removes `nodeId` from `session.staleNodeIds` on success
- [ ] `InsightDAG` wires a right-click or secondary-click on a stale node to trigger `rerunNode`
- [ ] While the single node is loading, other nodes remain fully interactive
- [ ] On error, the node returns to `error` status; other nodes are unaffected
- [ ] Single-node re-run respects the same provider/keys as the original session

**Effort:** M (40 min)
**Depends on:** US-42, US-30

---

## Story Summary (Phase 4 additions)

| ID | Title | Epic | Effort | Depends On |
|----|-------|------|--------|------------|
| US-36 | ChatMessage type + session history | Chat | XS | US-25 |
| US-37 | `/api/chat` route | Chat | M | US-36, US-26 |
| US-38 | Chat panel component | Chat | M | US-36 |
| US-39 | DagSpec augmentation (append nodes) | Chat | S | US-37, US-35 |
| US-40 | New nodes positioned below existing layout | Chat | S | US-39, US-31 |
| US-41 | Stale node detection | Stale | S | US-35 |
| US-42 | Stale node UI | Stale | S | US-41 |
| US-43 | Single-node re-run | Stale | M | US-42, US-30 |

**Phase 4 estimated build time:** ~3–4 hours

---

## Phase 4 Build Order (Critical Path)

```
US-36 (types)
  ├─ US-37 (/api/chat) ──────────────────────────────┐
  ├─ US-38 (chat panel UI)                           │
  │    └─ US-39 (augment DagSpec) ◄──────────────────┘
  │         └─ US-40 (node positioning)
  └─ US-41 (stale detection)
       └─ US-42 (stale node UI)
            └─ US-43 (single-node re-run)
```

---

*Derived from `ARCHITECTURE.md` — Subconscious AI Founding Engineering recruitment process.*
