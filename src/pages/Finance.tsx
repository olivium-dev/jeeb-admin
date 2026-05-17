import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, DollarSign, TrendingUp } from "lucide-react";

interface FinanceSummary {
  gmv: number;
  commission: number;
  settlements: number;
  pendingPayouts: number;
  gmvDelta: number;
  commissionDelta: number;
}

interface TransactionRow {
  id: string;
  orderId: string;
  type: "commission" | "settlement" | "refund" | "topup";
  amount: number;
  currency: string;
  createdAt: number;
  status: "completed" | "pending" | "failed";
}

const NOW = Date.parse("2026-05-16T10:30:00Z");
const HOUR = 3_600_000;

const SUMMARY: FinanceSummary = {
  gmv: 12_450_000,
  commission: 1_245_000,
  settlements: 980_000,
  pendingPayouts: 265_000,
  gmvDelta: 12.5,
  commissionDelta: 8.3,
};

const TRANSACTIONS: TransactionRow[] = [
  { id: "txn_001", orderId: "ord_4821", type: "commission", amount: 4500, currency: "LBP", createdAt: NOW - 1 * HOUR, status: "completed" },
  { id: "txn_002", orderId: "ord_4819", type: "commission", amount: 2200, currency: "LBP", createdAt: NOW - 2 * HOUR, status: "completed" },
  { id: "txn_003", orderId: "—", type: "settlement", amount: 150000, currency: "LBP", createdAt: NOW - 4 * HOUR, status: "completed" },
  { id: "txn_004", orderId: "ord_4802", type: "refund", amount: 15000, currency: "LBP", createdAt: NOW - 6 * HOUR, status: "pending" },
  { id: "txn_005", orderId: "—", type: "settlement", amount: 320000, currency: "LBP", createdAt: NOW - 12 * HOUR, status: "completed" },
  { id: "txn_006", orderId: "ord_4780", type: "commission", amount: 3500, currency: "LBP", createdAt: NOW - 18 * HOUR, status: "completed" },
  { id: "txn_007", orderId: "—", type: "topup", amount: 50000, currency: "LBP", createdAt: NOW - 20 * HOUR, status: "completed" },
  { id: "txn_008", orderId: "ord_4770", type: "commission", amount: 8000, currency: "LBP", createdAt: NOW - 24 * HOUR, status: "failed" },
];

type TxnFilter = "all" | TransactionRow["type"];

export function FinanceDashboardPage() {
  const [filter, setFilter] = useState<TxnFilter>("all");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const visible = useMemo(
    () => TRANSACTIONS.filter((t) => filter === "all" || t.type === filter),
    [filter],
  );

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl font-semibold text-fg">Finance dashboard</h1>
          <p className="mt-1 text-sm text-fg-muted">GMV, commission, settlements, and reconciliation.</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value as "7d" | "30d" | "90d")} aria-label="Time period" className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="GMV" value={formatCurrency(SUMMARY.gmv)} delta={SUMMARY.gmvDelta} icon={<DollarSign size={18} />} />
        <SummaryCard label="Commission" value={formatCurrency(SUMMARY.commission)} delta={SUMMARY.commissionDelta} icon={<TrendingUp size={18} />} />
        <SummaryCard label="Settled" value={formatCurrency(SUMMARY.settlements)} icon={<ArrowUp size={18} />} />
        <SummaryCard label="Pending payouts" value={formatCurrency(SUMMARY.pendingPayouts)} icon={<ArrowDown size={18} />} />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-fg">Recent transactions</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value as TxnFilter)} aria-label="Filter transactions" className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg">
            <option value="all">All types</option>
            <option value="commission">Commission</option>
            <option value="settlement">Settlement</option>
            <option value="refund">Refund</option>
            <option value="topup">Top-up</option>
          </select>
        </div>

        <div className="mt-3 overflow-hidden rounded-md border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
              <tr>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-t border-border-subtle align-middle">
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{t.id}</td>
                  <td className="px-4 py-3 text-fg-muted">{t.orderId}</td>
                  <td className="px-4 py-3"><TypePill type={t.type} /></td>
                  <td className="px-4 py-3 text-fg">LBP {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><TxnStatusPill status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-fg-faint">{formatRelative(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, delta, icon }: { label: string; value: string; delta?: number; icon: React.ReactNode }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <div className="flex items-center gap-2 text-fg-faint">{icon}<h2 className="text-xs font-medium uppercase tracking-wide">{label}</h2></div>
      <p className="mt-1.5 text-lg font-semibold text-fg">{value}</p>
      {delta !== undefined && (
        <p className={`mt-0.5 text-xs font-medium ${delta >= 0 ? "text-success" : "text-danger"}`}>
          {delta >= 0 ? "+" : ""}{delta}% vs prior period
        </p>
      )}
    </article>
  );
}

function TypePill({ type }: { type: TransactionRow["type"] }) {
  const map: Record<TransactionRow["type"], { cls: string; label: string }> = {
    commission: { cls: "bg-brand/12 text-brand", label: "Commission" },
    settlement: { cls: "bg-success/12 text-success", label: "Settlement" },
    refund: { cls: "bg-warning/12 text-warning", label: "Refund" },
    topup: { cls: "bg-surface-2 text-fg-muted", label: "Top-up" },
  };
  const { cls, label } = map[type];
  return <span className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function TxnStatusPill({ status }: { status: TransactionRow["status"] }) {
  const map: Record<TransactionRow["status"], { cls: string; label: string }> = {
    completed: { cls: "bg-success/12 text-success", label: "Completed" },
    pending: { cls: "bg-warning/12 text-warning", label: "Pending" },
    failed: { cls: "bg-danger/12 text-danger", label: "Failed" },
  };
  const { cls, label } = map[status];
  return <span className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function formatCurrency(amount: number): string {
  return `LBP ${amount.toLocaleString()}`;
}

function formatRelative(ms: number): string {
  const diff = Date.parse("2026-05-16T10:30:00Z") - ms;
  const HOUR = 3_600_000;
  const MIN = 60_000;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)}h ago`;
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
