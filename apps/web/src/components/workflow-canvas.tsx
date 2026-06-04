"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PanelChrome, Section, SectionHeader } from "./section";

/* ============================================================================
   Workflow Diagnosis canvas (plate 002).
   Void canvas, 1px white-bordered nodes, mono step names, brutalist drawer.
   ============================================================================ */

type Status = "ok" | "warn" | "fail" | "pending";

interface WorkflowNodeData extends Record<string, unknown> {
  step: string;
  service: string;
  latency: string;
  status: Status;
  log: string;
  insight: string;
  onActivate?: () => void;
}

const STATUS_COLOR: Record<Status, string> = {
  ok: "var(--color-trace)",
  warn: "var(--color-alert)",
  fail: "var(--color-alert)",
  pending: "oklch(78% 0.012 38 / 0.75)",
};

const STATUS_LABEL: Record<Status, string> = {
  ok: "SUCCESS",
  warn: "DEGRADED",
  fail: "FAILED",
  pending: "SKIPPED",
};

const NODE_W = 188;
const NODE_X_STEP = 118;
const NODE_Y_TOP = 22;
const NODE_Y_BOTTOM = 198;

const NODES: Array<{ id: string; data: WorkflowNodeData }> = [
  {
    id: "checkout",
    data: {
      step: "checkout",
      service: "Storefront",
      latency: "82ms",
      status: "ok",
      log: "POST /checkout · 200 OK\ncart_id=c_8q21 · total=$148.20\nuser=u_3781 · region=us-east",
      insight: "Customer completed checkout in 82ms. No issues detected on the entry boundary.",
    },
  },
  {
    id: "persist-order",
    data: {
      step: "persist-order",
      service: "Order Service",
      latency: "143ms",
      status: "ok",
      log: "INSERT orders · order_id=1234\nstatus=created · items=3 · 143ms",
      insight: "Order row written. Latency within normal envelope (p95=160ms).",
    },
  },
  {
    id: "publish-event",
    data: {
      step: "publish-event",
      service: "Event Bus",
      latency: "11ms",
      status: "ok",
      log: "PUBLISH order.created\nkey=order_1234 · subscribers=4 · 11ms",
      insight: "Event fanned out to 4 downstream subscribers as expected.",
    },
  },
  {
    id: "reserve-inventory",
    data: {
      step: "reserve-inventory",
      service: "Inventory Service",
      latency: "212ms",
      status: "ok",
      log: "POST /reserve · 200\nsku_count=3 · reserved=true · 212ms",
      insight: "All 3 SKUs in stock and reserved against the order.",
    },
  },
  {
    id: "authorise-payment",
    data: {
      step: "authorise-payment",
      service: "Payment Service",
      latency: "640ms",
      status: "warn",
      log: "POST /charge · 200\nauth_id=ch_18bx · amount=$148.20 · 640ms\nNOTE: latency p99 elevated (>=500ms for 12m)",
      insight:
        "Charge succeeded but the service is running degraded. Not the cause of the failure, but worth a follow-up.",
    },
  },
  {
    id: "sku-mapping",
    data: {
      step: "sku-mapping",
      service: "Fulfillment OMS",
      latency: "843ms",
      status: "fail",
      log: "POST /pick_lists · 422\nerror=unmapped_sku\nsku=ABC-123 · vendor=ACME · 843ms",
      insight:
        "SKU ABC-123 has no fulfillment mapping defined. This same root cause hit 3 other orders this month (similarity 0.66-0.92). Fix: add mapping for SKU ABC-123 in the OMS.",
    },
  },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const initialNodes: Node<WorkflowNodeData>[] = NODES.map((n, i) => ({
  id: n.id,
  type: "service",
  position: {
    x: i * NODE_X_STEP,
    y: i % 2 === 0 ? NODE_Y_TOP : NODE_Y_BOTTOM,
  },
  data: n.data,
  draggable: false,
}));

const initialEdges: Edge[] = NODES.slice(0, -1).map((n, i) => {
  const nextId = NODES[i + 1]!.id;
  const nextStatus = NODES[i + 1]!.data.status;
  const isFailEdge = nextStatus === "fail";
  return {
    id: `${n.id}-${nextId}`,
    source: n.id,
    target: nextId,
    type: "smoothstep",
    animated: true,
    style: {
      stroke: isFailEdge ? "var(--color-alert)" : "rgba(229,231,234,0.45)",
      strokeWidth: 1,
    },
  };
});

/* ============================================================================
   Custom node — 1px-bordered rectangle on the void canvas
   ============================================================================ */

function ServiceNode({ data, selected, id }: NodeProps<Node<WorkflowNodeData>>) {
  const isFail = data.status === "fail";
  const isWarn = data.status === "warn";

  const border = selected
    ? "border-[var(--color-signal)] shadow-[0_0_0_1px_var(--color-signal)]"
    : isFail
      ? "border-[var(--color-alert)]"
      : isWarn
        ? "border-[var(--color-alert)]/70"
        : "border-[var(--color-concrete)]/70 hover:border-[var(--color-concrete)]";

  return (
    <div
      className={cn(
        "w-[188px] border bg-[var(--color-void)] px-3 py-2.5 transition-[border-color,box-shadow] duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]",
        border,
      )}
      role="button"
      tabIndex={0}
      aria-label={`${data.service}, ${STATUS_LABEL[data.status]}, step ${data.step}, ${data.latency}`}
      aria-pressed={selected}
      data-node-id={id}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          data.onActivate?.();
        }
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-concrete-bright)]">
          {data.service}
        </span>
        <StatusDot status={data.status} />
      </div>
      <div className="mt-1.5 truncate font-mono text-[13px] text-[var(--color-paper)]">
        {data.step}
      </div>
      <div
        className="mt-2 font-mono text-[11px] tabular-nums"
        style={{
          color: isFail || isWarn ? "var(--color-alert)" : "var(--color-concrete-bright)",
        }}
      >
        {data.latency}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="relative inline-flex h-2 w-2 items-center justify-center"
      aria-hidden
    >
      {status === "fail" && (
        <span
          className="absolute inset-0 rounded-full opacity-50 motion-safe:animate-ping"
          style={{ background: color }}
        />
      )}
      <span
        className="relative inline-block h-2 w-2 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}

const nodeTypes: NodeTypes = { service: ServiceNode };

/* ============================================================================
   Drawer
   ============================================================================ */

function AgentDrawer({
  selectedId,
  onClear,
  drawerRef,
}: {
  selectedId: string | null;
  onClear: () => void;
  drawerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const selected = selectedId ? NODE_BY_ID[selectedId] : null;
  const status = selected?.data.status;

  return (
    <div ref={drawerRef} className="flex min-h-[420px] flex-col bg-[var(--color-surface)] md:min-h-[460px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
            {selected ? "INSPECTING" : "ASK_AGENT"}
          </span>
          {selected && (
            <>
              <span className="font-mono text-[13px] text-[var(--color-foreground)]">
                {selected.data.step}
              </span>
              {status && (
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-[2px]"
                  style={{
                    borderColor:
                      status === "fail" || status === "warn"
                        ? "var(--color-alert)"
                        : "var(--color-foreground)",
                  }}
                >
                  <StatusDot status={status} />
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.1em]"
                    style={{
                      color:
                        status === "fail" || status === "warn"
                          ? "var(--color-alert)"
                          : "var(--color-foreground)",
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </span>
              )}
            </>
          )}
        </div>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-6 w-6 items-center justify-center text-[var(--color-foreground-subtle)] transition-colors hover:text-[var(--color-foreground)]"
            aria-label="Clear node selection"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden px-4 pb-4 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {selected ? (
            <NodeConversation key={selected.id} node={selected} />
          ) : (
            <GeneralConversation key="general" />
          )}
        </AnimatePresence>
      </div>

      {/* Pinned CLI input */}
      <div className="border-t border-[var(--color-foreground)] p-3">
        <div className="flex items-stretch border border-[var(--color-foreground)] bg-[var(--color-surface)]">
          <span className="flex select-none items-center border-r border-[var(--color-foreground)] px-3 font-mono text-[13px] text-[var(--color-foreground)]">
            &gt;
          </span>
          <input
            disabled
            placeholder={
              selected
                ? `ask about ${selected.data.step}`
                : "what happened to order-1234?"
            }
            className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-foreground-subtle)]"
          />
          <button
            type="button"
            disabled
            className="flex shrink-0 items-center border-l border-[var(--color-foreground)] bg-[var(--color-signal)] px-3 text-white"
            aria-label="Send"
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
          Press <kbd className="border border-[var(--color-foreground)] px-1 text-[10px]">↵</kbd>{" "}
          to run · demo only
        </p>
      </div>
    </div>
  );
}

function GeneralConversation() {
  const text =
    "order-1234 failed at the sku-mapping step on the Fulfillment OMS. SKU ABC-123 has no mapping defined; the OMS rejected the pick list (422). This is the same root cause that hit 3 other orders this month (similarity 0.66-0.92). Fix: add mapping for SKU ABC-123 in the OMS, then retry.";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="flex h-full flex-col gap-3 overflow-y-auto pr-1"
    >
      <UserBubble>what happened to order-1234?</UserBubble>
      <AgentBubble text={text} />
      <HintBubble />
    </motion.div>
  );
}

function NodeConversation({ node }: { node: (typeof NODES)[number] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="flex h-full flex-col gap-3 overflow-y-auto pr-1"
    >
      <UserBubble>show me {node.data.step}</UserBubble>

      <div className="border border-[var(--color-foreground)] bg-[var(--color-surface-inset)]">
        <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-3 py-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
            step_output
          </span>
          <span className="font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
            {node.data.latency}
          </span>
        </div>
        <pre className="whitespace-pre-wrap p-3 font-mono text-[11.5px] leading-[1.6] text-[var(--color-foreground)]">
          {node.data.log}
        </pre>
      </div>

      <AgentBubble text={node.data.insight} />
    </motion.div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] border border-[var(--color-foreground)] bg-[var(--color-foreground)] px-3 py-2 font-mono text-[12.5px] leading-[1.5] text-[var(--color-paper)]">
        &gt; {children}
      </div>
    </div>
  );
}

function AgentBubble({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const id = window.setInterval(() => {
      setShown((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 3;
      });
    }, 12);
    return () => window.clearInterval(id);
  }, [text]);

  const isDone = shown >= text.length;
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--color-foreground)] bg-[var(--color-foreground)] font-mono text-[10px] text-[var(--color-paper)]"
        aria-hidden
      >
        BL
      </span>
      <div className="min-w-0 flex-1 border border-[var(--color-foreground)] bg-[var(--color-surface)] px-3 py-2 text-[13px] leading-[1.55] text-[var(--color-foreground)]">
        {text.slice(0, shown)}
        {!isDone && <span className="caret bg-[var(--color-foreground)]" />}
      </div>
    </div>
  );
}

function HintBubble() {
  return (
    <div className="mt-auto border border-dashed border-[var(--color-foreground)] px-3 py-2 font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
      Click any node on the left to inspect its raw step output.
    </div>
  );
}

/* ============================================================================
   Public — section wrapper
   ============================================================================ */

export function WorkflowSection() {
  return (
    <Section id="diagnose">
      <SectionHeader
        title={
          <>
            Make sense of what
            <br />
            actually happened.
          </>
        }
        description={
          <>
            The graph is auto-generated from your{" "}
            <code className="bg-[var(--color-surface-inset)] px-1 py-px font-mono text-[12.5px] text-[var(--color-ink)]">
              @workflow
            </code>{" "}
            and{" "}
            <code className="bg-[var(--color-surface-inset)] px-1 py-px font-mono text-[12.5px] text-[var(--color-ink)]">
              recordStep()
            </code>{" "}
            annotations. No diagram setup. Click any step to inspect the raw output.
          </>
        }
      />

      <div className="mt-10 min-w-0">
        <ReactFlowProvider>
          <WorkflowCanvasInner />
        </ReactFlowProvider>
      </div>
    </Section>
  );
}

function WorkflowCanvasInner() {
  const [selectedId, setSelectedId] = useState<string | null>("sku-mapping");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId || !drawerRef.current) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    drawerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedId(node.id);
  }, []);

  const nodes = useMemo<Node<WorkflowNodeData>[]>(
    () =>
      initialNodes.map((n) => ({
        ...n,
        selected: n.id === selectedId,
        data: {
          ...n.data,
          onActivate: () => setSelectedId(n.id),
        },
      })),
    [selectedId],
  );
  const edges = useMemo(
    () =>
      initialEdges.map((e) => ({
        ...e,
        style: {
          ...e.style,
          stroke:
            e.source === selectedId || e.target === selectedId
              ? "var(--color-signal)"
              : e.style?.stroke,
          strokeWidth: e.source === selectedId || e.target === selectedId ? 1.4 : 1,
        },
      })),
    [selectedId],
  );

  const totalContentWidth = (NODES.length - 1) * NODE_X_STEP + NODE_W + 24;

  return (
    <PanelChrome label="Workflow" meta="order-fulfillment / run_1234" onDark className="overflow-visible bg-[var(--color-void)]">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[var(--color-concrete)] px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-concrete)]/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-trace)]" />
          Success
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-alert)]" />
          Failed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border-2 border-[var(--color-accent)] bg-transparent" />
          Selected
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-[480px] border-b border-[var(--color-concrete)] md:border-b-0 md:border-r">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{
              padding: 0.12,
              minZoom: 0.7,
              maxZoom: 1,
              includeHiddenNodes: false,
            }}
            minZoom={0.6}
            maxZoom={1}
            panOnScroll
            panOnScrollMode={PanOnScrollMode.Horizontal}
            panOnScrollSpeed={0.6}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            nodesFocusable
            proOptions={{ hideAttribution: true }}
            translateExtent={[
              [-40, -40],
              [totalContentWidth + 40, 320],
            ]}
            className="brutalist"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(229,231,234,0.08)"
            />
          </ReactFlow>
        </div>

        {/* Drawer */}
        <AgentDrawer selectedId={selectedId} onClear={() => setSelectedId(null)} drawerRef={drawerRef} />
      </div>
    </PanelChrome>
  );
}
