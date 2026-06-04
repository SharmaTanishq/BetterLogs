"use client";

import { useCallback, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BETTERLOG_API_URL ?? "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_BETTERLOG_API_KEY ?? "blg_dev_localonly";

interface WorkflowSummary {
  id: string;
  name: string;
  status: string;
  business_keys: Record<string, string>;
  started_at: string;
  ended_at: string | null;
}

interface StepRow {
  id: string;
  name: string;
  service: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  error: { message: string; code?: string } | null;
  input: unknown;
  output: unknown;
}

function formatLatency(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return `${ms}ms`;
}

export default function WorkflowsPage() {
  const [keyName, setKeyName] = useState("order_id");
  const [keyValue, setKeyValue] = useState("");
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [selected, setSelected] = useState<{ workflow: WorkflowSummary; steps: StepRow[] } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authHeaders = { Authorization: `Bearer ${API_KEY}` };

  const search = useCallback(async () => {
    if (!keyValue.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await fetch(
        `${API_URL}/v1/workflows?key=${encodeURIComponent(keyName)}&value=${encodeURIComponent(keyValue.trim())}`,
        { headers: authHeaders },
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = (await res.json()) as { workflows: WorkflowSummary[] };
      setWorkflows(data.workflows);
      if (data.workflows.length === 1) {
        await loadWorkflow(data.workflows[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [keyName, keyValue]);

  const loadWorkflow = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/workflows/${id}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = (await res.json()) as { workflow: WorkflowSummary; steps: StepRow[] };
      setSelected(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-10">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">Workflow search</h1>
      <p className="mt-2 text-sm text-[var(--color-foreground-subtle)]">
        Find a workflow by business key — e.g. what happened to order 1234.
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          className="border border-[var(--color-foreground)] bg-transparent px-3 py-2 font-mono text-sm"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="key name"
          aria-label="Business key name"
        />
        <input
          className="min-w-[12rem] flex-1 border border-[var(--color-foreground)] bg-transparent px-3 py-2 font-mono text-sm"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="key value"
          aria-label="Business key value"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-[var(--color-foreground)] bg-[var(--color-signal)] px-4 py-2 font-mono text-sm text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-4 border border-[var(--color-alert)] px-3 py-2 font-mono text-sm text-[var(--color-alert)]">
          {error}
        </p>
      )}

      {workflows.length > 1 && (
        <ul className="mt-6 space-y-2">
          {workflows.map((wf) => (
            <li key={wf.id}>
              <button
                type="button"
                className="w-full border border-[var(--color-foreground)] px-3 py-2 text-left font-mono text-sm hover:bg-[var(--color-surface-inset)]"
                onClick={() => void loadWorkflow(wf.id)}
              >
                {wf.name} · {wf.status} · {wf.started_at}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <section className="mt-8">
          <header className="border-b border-[var(--color-foreground)] pb-3">
            <h2 className="font-mono text-lg">{selected.workflow.name}</h2>
            <p className="mt-1 font-mono text-xs text-[var(--color-foreground-subtle)]">
              {selected.workflow.id} · {selected.workflow.status}
            </p>
          </header>

          <ol className="mt-4 space-y-3">
            {selected.steps.map((step, i) => {
              const failed = step.status === "failed";
              return (
                <li
                  key={step.id}
                  className={`border px-4 py-3 ${
                    failed
                      ? "border-[var(--color-alert)] bg-[var(--color-alert)]/5"
                      : "border-[var(--color-foreground)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-foreground-subtle)]">
                      {String(i + 1).padStart(2, "0")} · {step.service}
                    </span>
                    <span
                      className={`font-mono text-xs uppercase ${failed ? "text-[var(--color-alert)]" : ""}`}
                    >
                      {step.status} · {formatLatency(step.started_at, step.ended_at)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm">{step.name}</p>
                  {step.error && (
                    <p className="mt-2 font-mono text-xs text-[var(--color-alert)]">
                      {step.error.message}
                      {step.error.code ? ` (${step.error.code})` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </main>
  );
}
