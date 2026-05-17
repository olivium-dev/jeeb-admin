import { useMemo, useState } from "react";
import { Calendar, Download, Search } from "lucide-react";

type SettlementStatus = "pending" | "processing" | "completed" | "failed";

interface Settlement {
  id: string;
  jeeberId: string;
  jeeberName: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  orderCount: number;
  status: SettlementStatus;
  paidAt: string | null;
}

const SEED: Settlement[] = [
  { id: "stl_001", jeeberId: "jbr_001", jeeberName: "Salem Al-Otaibi", periodStart: "2026-05-05", periodEnd: "2026-05-11", grossAmount: 850000, commission: 85000, netAmount: 765000, orderCount: 34, status: "completed", paidAt: "2026-05-12" },
  { id: "stl_002", jeeberId: "jbr_002", jeeberName: "مازن العتيبي", periodStart: "2026-05-05", periodEnd: "2026-05-11", grossAmount: 620000, commission: 62000, netAmount: 558000, orderCount: 25, status: "completed", paidAt: "2026-05-12" },
  { id: "stl_003", jeeberId: "jbr_003", jeeberName: "Khalid R.", periodStart: "2026-05-05", periodEnd: "2026-05-11", grossAmount: 450000, commission: 45000, netAmount: 405000, orderCount: 18, status: "processing", paidAt: null },
  { id: "stl_004", jeeberId: "jbr_004", jeeberName: "Hala M.", periodStart: "2026-05-05", periodEnd: "2026-05-11", grossAmount: 320000, commission: 32000, netAmount: 288000, orderCount: 13, status: "pending", paidAt: null },
  { id: "stl_005", jeeberId: "jbr_005", jeeberName: "Omar Z.", periodStart: "2026-05-05", periodEnd: "2026-05-11", grossAmount: 180000, commission: 18000, netAmount: 162000, orderCount: 7, status: "failed", paidAt: null },
  { id: "stl_006", jeeberId: "jbr_001", jeeberName: "Salem Al-Otaibi", periodStart: "2026-04-28", periodEnd: "2026-05-04", grossAmount: 920000, commission: 92000, netAmount: 828000, orderCount: 37, status: "completed", paidAt: "2026-05-05" },
];

type StatusFilter = "all" | SettlementStatus;

export function SettlementManagementPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return s.jeeberName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    });
  }, [query, statusFilter]);

  const totals = useMemo(() => ({
    total: SEED.reduce((s, r) => s + r.netAmount, 0),
    completed: SEED.filter((s) => s.status === "completed").reduce((s, r) => s + r.netAmount, 0),
    pending: SEED.filter((s) => s.status === "pending" || s.status === "processing").reduce((s, r) => s + r.netAmount, 0),
    failed: SEED.filter((s) => s.status === "failed").reduce((s, r) => s + r.netAmount, 0),
  }), []);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl font-semibold text-fg">Settlement management</h1>
          <p className="mt-1 text-sm text-fg-muted">Weekly Jeeber payouts, reconciliation, and retry controls.</p>
        </div>
        <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 text-sm font-medium text-fg-muted hover:bg-hover hover:text-fg">
          <Download size={16} strokeWidth={1.5} aria-hidden />Export CSV
        </button>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total net" value={formatCurrency(totals.total)} />
        <MetricCard label="Completed" value={formatCurrency(totals.completed)} tone="success" />
        <MetricCard label="Pending" value={formatCurrency(totals.pending)} tone="warning" />
        <MetricCard label="Failed" value={formatCurrency(totals.failed)} tone="danger" />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Jeeber name or settlement ID…" aria-label="Search settlements" className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg outline-none focus:border-brand" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Filter status" className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Jeeber</th>
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 font-medium">Orders</th>
              <th className="px-4 py-2 font-medium">Gross</th>
              <th className="px-4 py-2 font-medium">Commission</th>
              <th className="px-4 py-2 font-medium">Net payout</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-fg-muted">No settlements match these filters.</td></tr>
            )}
            {visible.map((s) => (
              <tr key={s.id} className="border-t border-border-subtle align-middle">
                <td className="px-4 py-3">
                  <div className="font-medium text-fg">{s.jeeberName}</div>
                  <div className="text-xs text-fg-faint">{s.jeeberId}</div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-muted">
                  <span className="inline-flex items-center gap-1"><Calendar size={12} aria-hidden />{s.periodStart} → {s.periodEnd}</span>
                </td>
                <td className="px-4 py-3 text-fg-muted">{s.orderCount}</td>
                <td className="px-4 py-3 text-fg-muted">{formatCurrency(s.grossAmount)}</td>
                <td className="px-4 py-3 text-fg-muted">{formatCurrency(s.commission)}</td>
                <td className="px-4 py-3 font-medium text-fg">{formatCurrency(s.netAmount)}</td>
                <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {s.status === "failed" && (
                      <button type="button" className="h-7 rounded-md bg-brand px-2.5 text-xs font-medium text-fg-inverse hover:bg-brand-hover">Retry</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" }) {
  const textCls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-fg";
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <h2 className="text-xs font-medium uppercase tracking-wide text-fg-faint">{label}</h2>
      <p className={`mt-1.5 text-lg font-semibold ${textCls}`}>{value}</p>
    </article>
  );
}

function StatusPill({ status }: { status: SettlementStatus }) {
  const map: Record<SettlementStatus, { cls: string; label: string }> = {
    pending: { cls: "bg-surface-2 text-fg-muted", label: "Pending" },
    processing: { cls: "bg-brand/12 text-brand", label: "Processing" },
    completed: { cls: "bg-success/12 text-success", label: "Completed" },
    failed: { cls: "bg-danger/12 text-danger", label: "Failed" },
  };
  const { cls, label } = map[status];
  return <span className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function formatCurrency(amount: number): string {
  return `LBP ${amount.toLocaleString()}`;
}
