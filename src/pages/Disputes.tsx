import { useMemo, useState } from "react";
import { Eye, MessageSquare, Search, X } from "lucide-react";

type DisputeStatus = "open" | "investigating" | "resolved" | "escalated";
type DisputeReason = "damaged" | "missing" | "wrong_item" | "overcharged" | "other";

interface Dispute {
  id: string;
  orderId: string;
  clientName: string;
  jeeberName: string;
  reason: DisputeReason;
  status: DisputeStatus;
  createdAt: number;
  amount: number;
  messageCount: number;
  assignee: string | null;
  resolution: string | null;
}

const REASON_LABELS: Record<DisputeReason, string> = {
  damaged: "Damaged goods",
  missing: "Missing items",
  wrong_item: "Wrong item delivered",
  overcharged: "Overcharged",
  other: "Other",
};

const NOW = Date.parse("2026-05-16T10:30:00Z");
const HOUR = 3_600_000;
const MIN = 60_000;

const SEED: Dispute[] = [
  { id: "dsp_a1", orderId: "ord_4821", clientName: "Ahmad K.", jeeberName: "Salem A.", reason: "damaged", status: "open", createdAt: NOW - 2 * HOUR, amount: 45000, messageCount: 3, assignee: null, resolution: null },
  { id: "dsp_a2", orderId: "ord_4819", clientName: "Lina H.", jeeberName: "مازن ع.", reason: "missing", status: "investigating", createdAt: NOW - 5 * HOUR, amount: 22000, messageCount: 8, assignee: "ouday", resolution: null },
  { id: "dsp_a3", orderId: "ord_4802", clientName: "Mira S.", jeeberName: "Khalid R.", reason: "overcharged", status: "open", createdAt: NOW - 8 * HOUR, amount: 15000, messageCount: 1, assignee: null, resolution: null },
  { id: "dsp_a4", orderId: "ord_4795", clientName: "Omar Z.", jeeberName: "Hala M.", reason: "wrong_item", status: "escalated", createdAt: NOW - 24 * HOUR, amount: 80000, messageCount: 14, assignee: "noor", resolution: null },
  { id: "dsp_a5", orderId: "ord_4780", clientName: "Rami N.", jeeberName: "Salem A.", reason: "damaged", status: "resolved", createdAt: NOW - 48 * HOUR, amount: 35000, messageCount: 6, assignee: "ouday", resolution: "Full refund issued" },
];

type StatusFilter = "all" | DisputeStatus;

export function DisputeQueuePage() {
  const [disputes] = useState<Dispute[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Dispute | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return disputes
      .filter((d) => {
        if (statusFilter !== "all" && d.status !== statusFilter) return false;
        if (!q) return true;
        return d.clientName.toLowerCase().includes(q) || d.orderId.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [disputes, query, statusFilter]);

  const metrics = useMemo(() => {
    const open = disputes.filter((d) => d.status === "open").length;
    const investigating = disputes.filter((d) => d.status === "investigating").length;
    const escalated = disputes.filter((d) => d.status === "escalated").length;
    const resolved = disputes.filter((d) => d.status === "resolved").length;
    return { open, investigating, escalated, resolved };
  }, [disputes]);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="border-b border-border-subtle pb-5">
        <h1 className="text-xl font-semibold text-fg">Dispute resolution queue</h1>
        <p className="mt-1 text-sm text-fg-muted">Open disputes with delivery context, chat history, and resolution tools.</p>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Open" value={String(metrics.open)} />
        <MetricCard label="Investigating" value={String(metrics.investigating)} />
        <MetricCard label="Escalated" value={String(metrics.escalated)} />
        <MetricCard label="Resolved" value={String(metrics.resolved)} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dispute, order, or client…" aria-label="Search disputes" className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg outline-none focus:border-brand" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Filter by status" className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Dispute</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Messages</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-fg-muted">No disputes match these filters.</td></tr>
            )}
            {visible.map((d) => (
              <tr key={d.id} className="border-t border-border-subtle align-middle">
                <td className="px-4 py-3">
                  <div className="font-medium text-fg">{d.clientName} vs {d.jeeberName}</div>
                  <div className="text-xs text-fg-faint">{d.id}</div>
                </td>
                <td className="px-4 py-3 text-fg-muted">{d.orderId}</td>
                <td className="px-4 py-3 text-fg-muted">{REASON_LABELS[d.reason]}</td>
                <td className="px-4 py-3 text-fg">LBP {d.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-fg-muted">
                    <MessageSquare size={14} strokeWidth={1.5} aria-hidden />{d.messageCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setSelected(d)} aria-label={`View dispute ${d.id}`} className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-hover hover:text-fg">
                      <Eye size={14} strokeWidth={1.5} aria-hidden />View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <DisputeDrawer dispute={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function DisputeDrawer({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex bg-black/40" onClick={onClose}>
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-border-subtle bg-surface shadow-elev-2" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5">
          <div>
            <h2 className="text-base font-semibold text-fg">{dispute.clientName} vs {dispute.jeeberName}</h2>
            <p className="text-xs text-fg-muted">{dispute.id} · Order {dispute.orderId} · {REASON_LABELS[dispute.reason]}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md text-fg-faint hover:bg-hover hover:text-fg">
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <section className="rounded-md border border-border-subtle bg-surface-2 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-fg-faint">Details</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-fg-muted">Amount</dt>
              <dd className="text-fg">LBP {dispute.amount.toLocaleString()}</dd>
              <dt className="text-fg-muted">Status</dt>
              <dd><StatusPill status={dispute.status} /></dd>
              <dt className="text-fg-muted">Assignee</dt>
              <dd className="text-fg">{dispute.assignee ?? "Unassigned"}</dd>
              <dt className="text-fg-muted">Created</dt>
              <dd className="text-fg">{formatRelative(dispute.createdAt)}</dd>
            </dl>
          </section>
          {dispute.resolution && (
            <section className="rounded-md border border-border-subtle bg-surface-2 p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-fg-faint">Resolution</h3>
              <p className="mt-2 text-sm text-fg">{dispute.resolution}</p>
            </section>
          )}
          <section className="rounded-md border border-border-subtle bg-surface-2 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-fg-faint">Chat transcript</h3>
            <p className="mt-2 text-sm text-fg-muted">{dispute.messageCount} messages in thread (loads from chat-service via jeeb-gateway)</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DisputeStatus }) {
  const map: Record<DisputeStatus, { cls: string; label: string }> = {
    open: { cls: "bg-warning/12 text-warning", label: "Open" },
    investigating: { cls: "bg-brand/12 text-brand", label: "Investigating" },
    escalated: { cls: "bg-danger/12 text-danger", label: "Escalated" },
    resolved: { cls: "bg-success/12 text-success", label: "Resolved" },
  };
  const { cls, label } = map[status];
  return <span className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <h2 className="text-xs font-medium uppercase tracking-wide text-fg-faint">{label}</h2>
      <p className="mt-1.5 text-lg font-semibold text-fg">{value}</p>
    </article>
  );
}

function formatRelative(ms: number): string {
  const diff = NOW - ms;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)}h ago`;
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
