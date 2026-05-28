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
- [ ] Supports `NEXT_PUBLIC_DEFAULT_ANTHROPIC_KEY`, `NEXT_PUBLIC_DEFAULT_OPENAI_KEY`, `NEXT_PUBLIC_DEFAULT_GROQ_KEY`, `NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY`
- [ ] Env vars pre-populate the Settings form on first load (if `localStorage` is empty)
- [ ] Users can override env var values with their own keys in the Settings panel
- [ ] Env vars are `NEXT_PUBLIC_` — client-side only, no server-side secret storage

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
- [ ] Clicking a `ready` segment node transitions the canvas from Layer 1 to Layer 2
- [ ] Layer transition is animated (Framer Motion: fade out Layer 1, fade in Layer 2)
- [ ] A breadcrumb or back button shows the active segment name
- [ ] Clicking `idle` or `loading` nodes does nothing (or shows a tooltip: "Run analysis first")
- [ ] Back button returns to Layer 1 with the segment graph intact

**Effort:** M (35 min)
**Depends on:** US-14, US-15

---

### US-17 · Insight DAG Render with dagre Layout
**As a** user,
**I want** to see the 9 insight nodes for a segment auto-arranged in a DAG layout,
**so that** causal relationships flow visually from top to bottom.

**Acceptance Criteria:**
- [ ] `components/graphs/InsightDAG.tsx` renders 9 `InsightNode` nodes
- [ ] `lib/graph-utils.ts` exports `getLayoutedElements(nodes, edges)` using `dagre`
- [ ] dagre config: `rankdir: 'TB'`, `ranksep: 80`, `nodesep: 60`
- [ ] Each node: 180px × 72px, shows icon + label + color from `PROMPT_CONFIG`
- [ ] A central "anchor" node shows the segment name (optional, adds context)
- [ ] `fitView` called after layout

**Effort:** M (45 min)
**Depends on:** US-16, US-07

---

### US-18 · Causal Edges with Styled Labels
**As a** user,
**I want** to see labeled, color-coded dashed edges between insight nodes that have causal relationships,
**so that** I understand how one insight influences another.

**Acceptance Criteria:**
- [ ] Edges derived from `causalEdges` in `PROMPT_CONFIG`
- [ ] Edge styles by relationship type:
  - `amplifies` → dashed red
  - `informs` → dashed blue
  - `shapes` → dashed purple
  - `enables` → dashed green
  - `activates` → dashed orange
- [ ] Edge labels rendered as small text mid-edge
- [ ] All 5 defined causal edges render correctly:
  - threats → weaknesses (amplifies)
  - opportunities → marketingOKRs (informs)
  - buyerPersona → marketPositioning (shapes)
  - strengths → investmentOpportunities (enables)
  - channelsDistribution → marketingOKRs (activates)
- [ ] Standard segment→insight connection edges: solid, 0.5px, muted color

**Effort:** S (30 min)
**Depends on:** US-17

---

## Epic 5 — Insight Panel

### US-19 · Insight Panel Slide-in
**As a** user,
**I want** to click an insight node to see the full LLM-generated response in a side panel,
**so that** I can read the detailed analysis without leaving the graph view.

**Acceptance Criteria:**
- [ ] `components/panels/InsightPanel.tsx` slides in from the right on node click (Framer Motion)
- [ ] Panel shows: insight type label, icon, color accent, and the full LLM response body
- [ ] LLM response is rendered as markdown using `react-markdown`
- [ ] Panel can be closed via × button or pressing Escape
- [ ] Closing the panel deselects the node
- [ ] Clicking a different node while panel is open swaps content (no close/reopen flash)
- [ ] Panel width: ~380px on desktop, does not overlap the graph controls

**Effort:** M (40 min)
**Depends on:** US-17

---

### US-20 · Provider Badge on Segment Nodes
**As a** user,
**I want** each segment node to show which provider generated its analysis,
**so that** I can track which results came from which LLM when comparing.

**Acceptance Criteria:**
- [ ] `ready` segment nodes display a small badge: provider label + brand color
- [ ] Badge shows: "Claude" (amber), "GPT-4o mini" (green), "Llama 3.3" (purple), "OpenRouter" (pink)
- [ ] If a segment has been run with multiple providers (cache has multiple entries), the badge shows the currently selected provider's result
- [ ] Badge is visible at default zoom level without requiring hover

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
- [ ] Layer 1 → Layer 2 transition: Layer 1 fades out (300ms), Layer 2 fades in (300ms)
- [ ] Layer 2 → Layer 1 (back): same fade in reverse
- [ ] Insight panel: slides in from right (300ms ease-out)
- [ ] Insight panel close: slides out to right (200ms ease-in)
- [ ] Segment nodes animate from 0 → 1 opacity on initial render (staggered, 50ms apart)
- [ ] No layout shift during any transition

**Effort:** S (25 min)
**Depends on:** US-16, US-19

---

### US-23 · Dark Mode Visual Design
**As a** user,
**I want** the app to use a consistent dark-mode design system,
**so that** it looks like a professional internal tool, not a demo.

**Acceptance Criteria:**
- [ ] Background: `#0A0A0F`, Surface: `#13131A`, Border: `#1E1E2E`
- [ ] Provider badge colors applied consistently: Claude=#D97706, OpenAI=#10B981, Groq=#8B5CF6, OpenRouter=#EC4899
- [ ] All text readable at WCAG AA contrast on dark backgrounds
- [ ] ReactFlow canvas background matches app background (no white box)
- [ ] Tailwind dark mode class applied at root level

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
- [ ] Build passes without TypeScript errors or lint warnings
- [ ] Live URL added to `ARCHITECTURE.md` Section 1
- [ ] No secrets committed to git

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
- [ ] `components/graphs/InsightNode.tsx` renders using the `color` and `icon` fields from `PROMPT_CONFIG`
- [ ] Each node shows: Lucide icon (from US-D02 mapping) + label, color-coded per type
- [ ] Node color is driven entirely by `PROMPT_CONFIG[key].color` — no separate hardcoded values in the component
- [ ] Node selected state (panel open): highlighted border in the node's color
- [ ] Hover state: subtle glow matching the node's color

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

*Derived from `ARCHITECTURE.md` — Subconscious AI Founding Engineering recruitment process.*
