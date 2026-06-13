"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SegmentGraph } from "@/components/graphs/SegmentGraph";
import { InsightDAG } from "@/components/graphs/InsightDAG";
import { InsightPanel } from "@/components/panels/InsightPanel";
import { useInsights } from "@/hooks/useInsights";
import { useGraphState } from "@/hooks/useGraphState";
import { ComparePanel } from "@/components/panels/ComparePanel";
import { WorldPersonaMap } from "@/components/graphs/WorldPersonaMap";
import { DagChatPanel } from "@/components/panels/DagChatPanel";
import { RegionDetailPanel } from "@/components/panels/RegionDetailPanel";
import { usePersona } from "@/hooks/usePersona";
import { InsightNavbar } from "@/components/panels/InsightNavbar";
import type { RegionResult } from "@/hooks/usePersona";
import type { Provider } from "@/lib/langgraph/providers";
import type { ApiKeys } from "@/lib/types";

export default function Home() {
  const [segments, setSegments] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("");
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(
    new Set(),
  );
  const [isComparing, setIsComparing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionResult | null>(null);
  const lastRunConfig = useRef<{ keys: Partial<ApiKeys>; openrouterModel: string } | null>(null);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  const { getSession, runAll, augmentDag, appendChat, markChatNodeAdded, markStale, rerunNode, getProvidersWithResults, tick } = useInsights();
  const { getPersonaSession, runPersona, addCustomRegion } = usePersona();
  const { state, selectSegment, selectNode, backToSegments, setProvider } =
    useGraphState();

  function dismissError(segment: string) {
    setDismissedErrors((prev) => new Set(prev).add(segment));
  }

  function handleRunPersona() {
    if (!state.activeSegment || !activeSession?.dagSpec) return
    runPersona(state.activeSegment, {
      product,
      objective,
      dagSpec: activeSession.dagSpec,
      insights: activeSession.insights,
      provider: state.provider,
      keys: lastRunConfig.current?.keys ?? {},
    })
  }

  function handleAddCustomRegion(regionName: string) {
    if (!state.activeSegment || !activeSession?.dagSpec) return
    addCustomRegion(
      state.activeSegment,
      {
        product,
        objective,
        dagSpec: activeSession.dagSpec,
        insights: activeSession.insights,
        provider: state.provider,
        keys: lastRunConfig.current?.keys ?? {},
      },
      regionName,
    )
  }

  function handleRun(config: {

    product: string;
    objective: string;
    segments: string[];
    provider: Provider;
    keys: Partial<ApiKeys>;
    openrouterModel: string;
    force?: boolean;
  }) {
    setSegments(config.segments);
    setProduct(config.product);
    setObjective(config.objective);
    setProvider(config.provider);
    setDismissedErrors(new Set());
    setIsComparing(false);
    lastRunConfig.current = { keys: config.keys, openrouterModel: config.openrouterModel };
    runAll(config.segments, { ...config, force: config.force });
  }

  // Mark sessions stale when inputs change after they were run
  useEffect(() => {
    segments.forEach((seg) => {
      const s = getSession(seg, state.provider)
      if (s.status !== 'ready' || !s.inputSnapshot) return
      const snap = s.inputSnapshot
      if (snap.product !== product || snap.objective !== objective || snap.segment !== seg) {
        markStale(seg, state.provider)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, objective, segments.join(','), state.provider])

  const isRunning = segments.some((seg) => {
    const s = getSession(seg, state.provider).status
    return s === 'planning' || s === 'loading'
  });

  const activeSession = state.activeSegment
    ? getSession(state.activeSegment, state.provider)
    : null;

  const personaSession = state.activeSegment
    ? getPersonaSession(state.activeSegment, state.provider)
    : null;
  const personaRegions = personaSession ? Object.values(personaSession.regions) : [];
  const showPersonaMap = personaSession?.active ?? false;
  const showChat = activeSession?.status === 'ready' && activeSession?.dagSpec != null;

  useEffect(() => {
    if (showChat) chatPanelRef.current?.expand()
    else chatPanelRef.current?.collapse()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChat])

  // Clear region selection when segment or provider changes
  useEffect(() => {
    setSelectedRegion(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeSegment, state.provider])

  const errors = segments
    .map((seg) => {
      const s = getSession(seg, state.provider);
      return s.status === "error" && s.error && !dismissedErrors.has(seg)
        ? { segment: seg, message: s.error }
        : null;
    })
    .filter(Boolean) as { segment: string; message: string }[];

  useEffect(() => {
    if (errors.length === 0) return;
    const timers = errors.map(({ segment }) =>
      setTimeout(() => dismissError(segment), 5000),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.map((e) => e.segment).join(",")]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
      style={{ background: "#0A0A0F" }}
    >
      {/* Sidebar */}
      <ResizablePanel
        defaultSize={22}
        minSize={18}
        maxSize={32}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Sidebar
          onRun={handleRun}
          onProviderInit={setProvider}
          isRunning={isRunning}
        />
      </ResizablePanel>

      <ResizableHandle
        withHandle
        className="w-px bg-[#1E1E2E] hover:bg-[#534AB7] transition-colors data-[resize-handle-active]:bg-[#534AB7]"
      />

      {/* Main */}
      <ResizablePanel defaultSize={84}>
        <div
          className="h-full flex overflow-hidden relative"
          style={{ background: "#0A0A0F" }}
        >
          {/* Error alerts */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                key="errors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-6 right-4 z-20 flex flex-col gap-2"
                style={{ width: 360, pointerEvents: "auto" }}
              >
                <AnimatePresence initial={false}>
                  {errors.map(({ segment, message }) => (
                    <motion.div
                      key={segment}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Alert
                        variant="destructive"
                        className="flex items-start gap-3"
                        style={{
                          background: "rgba(19,10,10,0.95)",
                          border: "1px solid rgba(239,68,68,0.35)",
                          backdropFilter: "blur(8px)",
                          color: "#FCA5A5",
                          paddingRight: 36,
                        }}
                      >
                        <AlertCircle
                          className="h-4 w-4 mt-0.5 flex-shrink-0"
                          style={{ color: "#EF4444" }}
                        />
                        <div className="flex-1 min-w-0">
                          <AlertTitle
                            style={{
                              color: "#FCA5A5",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {segment} — Analysis failed
                          </AlertTitle>
                          <AlertDescription
                            style={{
                              color: "#F87171",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {message}
                          </AlertDescription>
                        </div>
                        <button
                          onClick={() => dismissError(segment)}
                          className="absolute top-2.5 right-2.5 flex items-center justify-center rounded transition-colors"
                          style={{
                            color: "#7A3A3A",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#FCA5A5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#7A3A3A")
                          }
                        >
                          <X size={13} />
                        </button>
                      </Alert>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Views */}
          <AnimatePresence mode="wait">
            {state.activeLayer === "insight" &&
            state.activeSegment &&
            activeSession ? (
              <motion.div
                key="insight"
                className="flex-1 h-full overflow-hidden flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <InsightNavbar
                  product={product}
                  segment={state.activeSegment!}
                  provider={state.provider}
                  onBack={backToSegments}
                  availableProviders={getProvidersWithResults(state.activeSegment)}
                  isComparing={isComparing}
                  onCompare={() => setIsComparing(true)}
                />
                {/* Outer split: Left (DAG + Map + Chat) | Detail */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">

                  {/* Left column: maps on top, resizable chat below */}
                  <ResizablePanel defaultSize={72} minSize={40}>
                    <ResizablePanelGroup direction="vertical" className="h-full">

                      {/* Maps row */}
                      <ResizablePanel defaultSize={75} minSize={35}>
                        <ResizablePanelGroup
                          key={showPersonaMap ? 'maps-two' : 'maps-one'}
                          direction="horizontal"
                          className="h-full"
                        >
                          <ResizablePanel defaultSize={showPersonaMap ? 54 : 100} minSize={28}>
                            <InsightDAG
                              product={product}
                              objective={objective}
                              segment={state.activeSegment}
                              provider={state.provider}
                              session={activeSession}
                              dagSpec={activeSession.dagSpec}
                              selectedNode={state.selectedNode}
                              onRunPersona={handleRunPersona}
                              personaActive={showPersonaMap}
                              onNodeClick={(nodeId: string) => { selectNode(nodeId); setSelectedRegion(null) }}
                              keys={lastRunConfig.current?.keys ?? {}}
                              onRerunNode={(nodeId: string) =>
                                rerunNode(state.activeSegment!, state.provider, nodeId, {
                                  product, objective,
                                  provider: state.provider,
                                  keys: lastRunConfig.current?.keys ?? {},
                                  openrouterModel: lastRunConfig.current?.openrouterModel ?? '',
                                })
                              }
                            />
                          </ResizablePanel>

                          {showPersonaMap && (
                            <>
                              <ResizableHandle
                                withHandle
                                className="w-px bg-[#1E1E2E] hover:bg-[#534AB7] transition-colors data-[resize-handle-active]:bg-[#534AB7]"
                              />
                              <ResizablePanel defaultSize={46} minSize={25}>
                                <WorldPersonaMap
                                  regions={personaRegions}
                                  onAddRegion={handleAddCustomRegion}
                                  onRegionClick={(r) => { setSelectedRegion(r); selectNode(null) }}
                                  selectedRegionId={selectedRegion?.id ?? null}
                                />
                              </ResizablePanel>
                            </>
                          )}
                        </ResizablePanelGroup>
                      </ResizablePanel>

                      {/* Resize handle — visible only when chat is open */}
                      <ResizableHandle
                        className={`h-px transition-colors data-[resize-handle-active]:bg-[#534AB7] ${showChat ? 'bg-[#1E1E2E] hover:bg-[#534AB7]' : 'bg-transparent pointer-events-none'}`}
                      />

                      {/* Chat — collapsible, never unmounts so expand/collapse is smooth */}
                      <ResizablePanel
                        ref={chatPanelRef}
                        defaultSize={25}
                        minSize={12}
                        maxSize={60}
                        collapsible
                        collapsedSize={0}
                      >
                        {showChat && (
                          <DagChatPanel
                            segment={state.activeSegment!}
                            provider={state.provider}
                            dagSpec={activeSession.dagSpec!}
                            history={activeSession.chat}
                            keys={lastRunConfig.current?.keys ?? {}}
                            product={product}
                            objective={objective}
                            onSend={(userText, assistantMsg) => {
                              const seg = state.activeSegment!
                              const prov = state.provider
                              appendChat(seg, prov, { role: 'user', content: userText })
                              appendChat(seg, prov, assistantMsg)
                            }}
                            onAddNode={(msgIndex, additions) => {
                              const seg = state.activeSegment!
                              const prov = state.provider
                              markChatNodeAdded(seg, prov, msgIndex)
                              augmentDag(seg, prov, additions, {
                                product, objective,
                                provider: prov,
                                keys: lastRunConfig.current?.keys ?? {},
                                openrouterModel: lastRunConfig.current?.openrouterModel ?? '',
                              })
                            }}
                          />
                        )}
                      </ResizablePanel>

                    </ResizablePanelGroup>
                  </ResizablePanel>

                  <ResizableHandle
                    withHandle
                    className="w-px bg-[#1E1E2E] hover:bg-[#534AB7] transition-colors data-[resize-handle-active]:bg-[#534AB7]"
                  />

                  {/* Detail panel — full height, not affected by chat */}
                  <ResizablePanel defaultSize={28} minSize={15} maxSize={55}>
                    {selectedRegion ? (
                      <RegionDetailPanel
                        region={selectedRegion}
                        onClose={() => setSelectedRegion(null)}
                      />
                    ) : isComparing && activeSession.dagSpec ? (
                      <ComparePanel
                        segment={state.activeSegment}
                        primaryProvider={state.provider}
                        availableProviders={getProvidersWithResults(state.activeSegment)}
                        getSession={getSession}
                        dagSpec={activeSession.dagSpec}
                        selectedNode={state.selectedNode}
                        onClose={() => setIsComparing(false)}
                      />
                    ) : (
                      <InsightPanel
                        promptKey={state.selectedNode}
                        dagSpec={activeSession.dagSpec}
                        content={
                          state.selectedNode && activeSession.insights
                            ? activeSession.insights[state.selectedNode]
                            : null
                        }
                        onClose={() => selectNode(null)}
                      />
                    )}
                  </ResizablePanel>

                </ResizablePanelGroup>
              </motion.div>
            ) : (
              <motion.div
                key="segment"
                className="flex-1 h-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SegmentGraph
                  product={product}
                  objective={objective}
                  segments={segments}
                  provider={state.provider}
                  getSession={getSession}
                  tick={tick}
                  onSegmentClick={selectSegment}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
