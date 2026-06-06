"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SegmentGraph } from "@/components/graphs/SegmentGraph";
import { InsightDAG } from "@/components/graphs/InsightDAG";
import { InsightPanel } from "@/components/panels/InsightPanel";
import { useInsights } from "@/hooks/useInsights";
import { useGraphState } from "@/hooks/useGraphState";
import type { Provider } from "@/lib/langgraph/providers";
import type { ApiKeys } from "@/lib/types";

export default function Home() {
  const [segments, setSegments] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("");
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(
    new Set(),
  );
  const { getSession, runAll, augmentDag, appendChat, markStale, tick } = useInsights();
  const { state, selectSegment, selectNode, backToSegments, setProvider } =
    useGraphState();

  function dismissError(segment: string) {
    setDismissedErrors((prev) => new Set(prev).add(segment));
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
                className="flex-1 h-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={72} minSize={40}>
                    <InsightDAG
                      product={product}
                      objective={objective}
                      segment={state.activeSegment}
                      provider={state.provider}
                      session={activeSession}
                      dagSpec={activeSession.dagSpec}
                      selectedNode={state.selectedNode}
                      onNodeClick={(nodeId: string) => selectNode(nodeId)}
                      onBack={backToSegments}
                    />
                  </ResizablePanel>

                  <ResizableHandle
                    withHandle
                    className="w-px bg-[#1E1E2E] hover:bg-[#534AB7] transition-colors data-[resize-handle-active]:bg-[#534AB7]"
                  />

                  <ResizablePanel defaultSize={28} minSize={15} maxSize={55}>
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
