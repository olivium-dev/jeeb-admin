import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CreditCard,
  FileBadge,
  RefreshCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";

export type KycStatus = "pending" | "approved" | "rejected" | "resubmit";
export type KycTier = "T1" | "T2" | "T3";
export type DocKind = "id_front" | "id_back" | "selfie" | "vehicle_reg";

export interface KycDocument {
  kind: DocKind;
  capturedAt: number;
}

export interface KycSubmission {
  id: string;
  applicantName: string;
  applicantUserId: string;
  tier: KycTier;
  status: KycStatus;
  submittedAt: number;
  decidedAt: number | null;
  riskScore: number;
  riskReasons: string[];
  documents: KycDocument[];
  assignee: string | null;
  decision: KycDecision | null;
  reviewDurationMs: number | null;
}

export interface KycDecision {
  verdict: "approve" | "reject" | "resubmit";
  reasonCode: string;
  note: string;
  reuploadDocs: DocKind[];
  decidedBy: string;
}

const DOC_LABELS: Record<DocKind, string> = {
  id_front: "ID front",
  id_back: "ID back",
  selfie: "Selfie",
  vehicle_reg: "Vehicle registration",
};

const REJECT_REASONS = [
  { code: "id_expired", label: "ID expired" },
  { code: "name_mismatch", label: "Name mismatch with profile" },
  { code: "face_mismatch", label: "Selfie does not match ID" },
  { code: "low_quality", label: "Image too blurry / unreadable" },
  { code: "vehicle_reg_invalid", label: "Vehicle registration invalid" },
  { code: "sanctions_hit", label: "Sanctions / watchlist hit" },
  { code: "other", label: "Other (see note)" },
] as const;

const RESUBMIT_REASONS = [
  { code: "id_glare", label: "ID has glare — retake without flash" },
  { code: "id_cropped", label: "ID corners cropped" },
  { code: "selfie_dark", label: "Selfie too dark" },
  { code: "vehicle_reg_missing", label: "Vehicle registration missing pages" },
  { code: "other", label: "Other (see note)" },
] as const;

const APPROVE_REASONS = [
  { code: "clean", label: "Clean — all signals green" },
  { code: "approved_with_note", label: "Approved with note" },
] as const;

const verdictSchema = z.object({
  verdict: z.enum(["approve", "reject", "resubmit"]),
  reasonCode: z.string().min(1, "Reason is required"),
  note: z.string().trim().max(280),
  reuploadDocs: z.array(
    z.enum(["id_front", "id_back", "selfie", "vehicle_reg"]),
  ),
});

type VerdictDraft = z.infer<typeof verdictSchema>;

const NOW = Date.parse("2026-05-16T10:30:00Z");
const MIN = 60_000;
const HOUR = 60 * MIN;

const SEED: KycSubmission[] = [
  {
    id: "sub_8a31c2",
    applicantName: "Salem Al-Otaibi",
    applicantUserId: "usr_8a31c2",
    tier: "T2",
    status: "pending",
    submittedAt: NOW - 4 * HOUR - 12 * MIN,
    decidedAt: null,
    riskScore: 82,
    riskReasons: ["device-mismatch", "face-low"],
    documents: [
      { kind: "id_front", capturedAt: NOW - 4 * HOUR - 14 * MIN },
      { kind: "id_back", capturedAt: NOW - 4 * HOUR - 13 * MIN },
      { kind: "selfie", capturedAt: NOW - 4 * HOUR - 13 * MIN },
      { kind: "vehicle_reg", capturedAt: NOW - 4 * HOUR - 12 * MIN },
    ],
    assignee: "ouday",
    decision: null,
    reviewDurationMs: null,
  },
  {
    id: "sub_91fa07",
    applicantName: "Lina Haddad",
    applicantUserId: "usr_91fa07",
    tier: "T1",
    status: "pending",
    submittedAt: NOW - 3 * HOUR - 58 * MIN,
    decidedAt: null,
    riskScore: 54,
    riskReasons: ["new-device"],
    documents: [
      { kind: "id_front", capturedAt: NOW - 3 * HOUR - 59 * MIN },
      { kind: "selfie", capturedAt: NOW - 3 * HOUR - 58 * MIN },
    ],
    assignee: null,
    decision: null,
    reviewDurationMs: null,
  },
  {
    id: "sub_7c1d44",
    applicantName: "مازن العتيبي",
    applicantUserId: "usr_7c1d44",
    tier: "T2",
    status: "pending",
    submittedAt: NOW - 3 * HOUR - 41 * MIN,
    decidedAt: null,
    riskScore: 49,
    riskReasons: [],
    documents: [
      { kind: "id_front", capturedAt: NOW - 3 * HOUR - 42 * MIN },
      { kind: "id_back", capturedAt: NOW - 3 * HOUR - 42 * MIN },
      { kind: "selfie", capturedAt: NOW - 3 * HOUR - 41 * MIN },
      { kind: "vehicle_reg", capturedAt: NOW - 3 * HOUR - 41 * MIN },
    ],
    assignee: "ouday",
    decision: null,
    reviewDurationMs: null,
  },
  {
    id: "sub_2bc0e9",
    applicantName: "Khalid R.",
    applicantUserId: "usr_2bc0e9",
    tier: "T2",
    status: "pending",
    submittedAt: NOW - 2 * HOUR - 9 * MIN,
    decidedAt: null,
    riskScore: 78,
    riskReasons: ["id-glare", "ocr-low-confidence"],
    documents: [
      { kind: "id_front", capturedAt: NOW - 2 * HOUR - 10 * MIN },
      { kind: "selfie", capturedAt: NOW - 2 * HOUR - 9 * MIN },
    ],
    assignee: null,
    decision: null,
    reviewDurationMs: null,
  },
  {
    id: "sub_5e8b30",
    applicantName: "Mira Saad",
    applicantUserId: "usr_5e8b30",
    tier: "T1",
    status: "pending",
    submittedAt: NOW - 1 * HOUR - 31 * MIN,
    decidedAt: null,
    riskScore: 12,
    riskReasons: [],
    documents: [
      { kind: "id_front", capturedAt: NOW - 1 * HOUR - 32 * MIN },
      { kind: "selfie", capturedAt: NOW - 1 * HOUR - 31 * MIN },
    ],
    assignee: "noor",
    decision: null,
    reviewDurationMs: null,
  },
  {
    id: "sub_46acf1",
    applicantName: "Rami N.",
    applicantUserId: "usr_46acf1",
    tier: "T2",
    status: "approved",
    submittedAt: NOW - 24 * HOUR,
    decidedAt: NOW - 23 * HOUR - 18 * MIN,
    riskScore: 22,
    riskReasons: [],
    documents: [
      { kind: "id_front", capturedAt: NOW - 24 * HOUR },
      { kind: "id_back", capturedAt: NOW - 24 * HOUR },
      { kind: "selfie", capturedAt: NOW - 24 * HOUR },
      { kind: "vehicle_reg", capturedAt: NOW - 24 * HOUR },
    ],
    assignee: "ouday",
    decision: {
      verdict: "approve",
      reasonCode: "clean",
      note: "All signals green.",
      reuploadDocs: [],
      decidedBy: "ouday",
    },
    reviewDurationMs: 42 * MIN,
  },
  {
    id: "sub_3df099",
    applicantName: "Hala M.",
    applicantUserId: "usr_3df099",
    tier: "T1",
    status: "rejected",
    submittedAt: NOW - 30 * HOUR,
    decidedAt: NOW - 29 * HOUR - 5 * MIN,
    riskScore: 88,
    riskReasons: ["face-mismatch"],
    documents: [
      { kind: "id_front", capturedAt: NOW - 30 * HOUR },
      { kind: "selfie", capturedAt: NOW - 30 * HOUR },
    ],
    assignee: "noor",
    decision: {
      verdict: "reject",
      reasonCode: "face_mismatch",
      note: "Selfie does not match the ID photo.",
      reuploadDocs: [],
      decidedBy: "noor",
    },
    reviewDurationMs: 55 * MIN,
  },
  {
    id: "sub_19c4e2",
    applicantName: "Omar Z.",
    applicantUserId: "usr_19c4e2",
    tier: "T2",
    status: "resubmit",
    submittedAt: NOW - 18 * HOUR,
    decidedAt: NOW - 17 * HOUR - 12 * MIN,
    riskScore: 35,
    riskReasons: [],
    documents: [
      { kind: "id_front", capturedAt: NOW - 18 * HOUR },
      { kind: "selfie", capturedAt: NOW - 18 * HOUR },
      { kind: "vehicle_reg", capturedAt: NOW - 18 * HOUR },
    ],
    assignee: "ouday",
    decision: {
      verdict: "resubmit",
      reasonCode: "id_glare",
      note: "Please retake the ID front without flash.",
      reuploadDocs: ["id_front"],
      decidedBy: "ouday",
    },
    reviewDurationMs: 28 * MIN,
  },
];

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "resubmit";

const SLA_WINDOW_MS = 4 * HOUR;

export function KycQueuePage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [reviewing, setReviewing] = useState<KycSubmission | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!q) return true;
        return (
          s.applicantName.toLowerCase().includes(q) ||
          s.applicantUserId.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.submittedAt - b.submittedAt);
  }, [submissions, query, statusFilter]);

  const metrics = useMemo(() => computeMetrics(submissions), [submissions]);

  function submitVerdict(submissionId: string, draft: VerdictDraft) {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        const status: KycStatus =
          draft.verdict === "approve"
            ? "approved"
            : draft.verdict === "reject"
              ? "rejected"
              : "resubmit";
        const decision: KycDecision = {
          verdict: draft.verdict,
          reasonCode: draft.reasonCode,
          note: draft.note,
          reuploadDocs: draft.reuploadDocs,
          decidedBy: "you",
        };
        return {
          ...s,
          status,
          decision,
          decidedAt: NOW,
          reviewDurationMs: Math.max(MIN, NOW - s.submittedAt),
        };
      }),
    );
    setReviewing(null);
  }

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-fg">KYC review queue</h1>
          <p className="text-sm text-fg-muted">
            Driver and merchant KYC submissions awaiting review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmissions((prev) => [...prev])}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg"
        >
          <RefreshCcw size={16} strokeWidth={1.5} aria-hidden />
          Refresh
        </button>
      </header>

      <MetricsRow metrics={metrics} />

      <div className="mt-5 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicant or submission id…"
            aria-label="Search KYC submissions"
            className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg outline-none transition-colors focus:border-brand"
          />
        </div>
        <StatusTabs
          value={statusFilter}
          onChange={setStatusFilter}
          counts={countByStatus(submissions)}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Applicant</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Documents</th>
              <th className="px-4 py-2 font-medium">Submitted</th>
              <th className="px-4 py-2 font-medium">SLA</th>
              <th className="px-4 py-2 font-medium">Risk</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-fg-muted"
                >
                  No submissions match these filters.
                </td>
              </tr>
            )}
            {visible.map((s) => (
              <tr
                key={s.id}
                className="border-t border-border-subtle align-middle"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-fg">{s.applicantName}</div>
                  <div className="text-xs text-fg-faint">
                    {s.applicantUserId}
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-muted">{s.tier}</td>
                <td className="px-4 py-3 text-fg-muted">
                  {s.documents.map((d) => DOC_LABELS[d.kind]).join(" · ")}
                </td>
                <td className="px-4 py-3 text-xs text-fg-faint">
                  {formatRelative(s.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  {s.status === "pending" ? (
                    <SlaPill submittedAt={s.submittedAt} />
                  ) : (
                    <span className="text-xs text-fg-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RiskPill score={s.riskScore} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={s.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReviewing(s)}
                      aria-label={`Review ${s.applicantName}`}
                      className="inline-flex h-8 items-center rounded-md border border-border-subtle bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-hover hover:text-fg"
                    >
                      {s.status === "pending" ? "Review" : "View"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <ReviewDrawer
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onSubmit={(draft) => submitVerdict(reviewing.id, draft)}
        />
      )}
    </section>
  );
}

interface Metrics {
  queueDepth: number;
  oldestPendingMs: number | null;
  avgReviewTimeMs: number | null;
  decidedToday: number;
}

function computeMetrics(submissions: KycSubmission[]): Metrics {
  const pending = submissions.filter((s) => s.status === "pending");
  const oldest = pending.reduce<number | null>(
    (acc, s) => (acc === null || s.submittedAt < acc ? s.submittedAt : acc),
    null,
  );
  const decided = submissions.filter((s) => s.reviewDurationMs !== null);
  const avg =
    decided.length === 0
      ? null
      : Math.round(
          decided.reduce((sum, s) => sum + (s.reviewDurationMs ?? 0), 0) /
            decided.length,
        );
  const decidedToday = submissions.filter(
    (s) => s.decidedAt !== null && NOW - s.decidedAt < 24 * HOUR,
  ).length;
  return {
    queueDepth: pending.length,
    oldestPendingMs: oldest === null ? null : NOW - oldest,
    avgReviewTimeMs: avg,
    decidedToday,
  };
}

function MetricsRow({ metrics }: { metrics: Metrics }) {
  return (
    <div
      role="group"
      aria-label="Queue metrics"
      className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      <MetricCard
        label="Queue depth"
        value={String(metrics.queueDepth)}
        hint="Pending submissions"
      />
      <MetricCard
        label="Oldest pending"
        value={
          metrics.oldestPendingMs === null
            ? "—"
            : formatDuration(metrics.oldestPendingMs)
        }
        hint="Time since submission"
      />
      <MetricCard
        label="Avg review time"
        value={
          metrics.avgReviewTimeMs === null
            ? "—"
            : formatDuration(metrics.avgReviewTimeMs)
        }
        hint="Across decided submissions"
      />
      <MetricCard
        label="Decided last 24h"
        value={String(metrics.decidedToday)}
        hint="Approve / reject / resubmit"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <h2 className="text-xs font-medium uppercase tracking-wide text-fg-faint">
        {label}
      </h2>
      <p className="mt-1.5 text-lg font-semibold text-fg">{value}</p>
      <p className="mt-0.5 text-xs text-fg-faint">{hint}</p>
    </article>
  );
}

function countByStatus(submissions: KycSubmission[]) {
  return submissions.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      acc.all += 1;
      return acc;
    },
    {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      resubmit: 0,
    } as Record<StatusFilter, number>,
  );
}

function StatusTabs({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}) {
  const tabs: { id: StatusFilter; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "resubmit", label: "Resubmit" },
    { id: "all", label: "All" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Status filter"
      className="inline-flex h-9 rounded-md border border-border-subtle bg-surface p-0.5"
    >
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={
              active
                ? "rounded-[5px] bg-selected px-3 text-sm font-medium text-brand"
                : "rounded-[5px] px-3 text-sm text-fg-muted hover:text-fg"
            }
          >
            {t.label}
            <span className="ml-1 text-xs text-fg-faint">{counts[t.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { cls: string; label: string }> = {
    pending: { cls: "bg-surface-2 text-fg-muted", label: "Pending" },
    approved: { cls: "bg-success/12 text-success", label: "Approved" },
    rejected: { cls: "bg-danger/12 text-danger", label: "Rejected" },
    resubmit: { cls: "bg-warning/12 text-warning", label: "Resubmit" },
  };
  const { cls, label } = map[status];
  return (
    <span
      className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function RiskPill({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-danger/12 text-danger"
      : score >= 40
        ? "bg-warning/12 text-warning"
        : "bg-success/12 text-success";
  return (
    <span
      className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold ${cls}`}
    >
      {score}
    </span>
  );
}

function SlaPill({ submittedAt }: { submittedAt: number }) {
  const ageMs = NOW - submittedAt;
  const remainingMs = SLA_WINDOW_MS - ageMs;
  if (remainingMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-danger/12 px-2 py-0.5 text-[10px] font-semibold text-danger">
        <AlertTriangle size={11} strokeWidth={2} aria-hidden />
        Breached
      </span>
    );
  }
  const warn = remainingMs < HOUR;
  const cls = warn
    ? "bg-warning/12 text-warning"
    : "bg-success/12 text-success";
  return (
    <span
      className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold ${cls}`}
    >
      {formatDuration(remainingMs)} left
    </span>
  );
}

interface ReviewDrawerProps {
  submission: KycSubmission;
  onClose: () => void;
  onSubmit: (draft: VerdictDraft) => void;
}

function ReviewDrawer({ submission, onClose, onSubmit }: ReviewDrawerProps) {
  const readOnly = submission.status !== "pending";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-drawer-title"
      className="fixed inset-0 z-50 flex bg-black/40"
      onClick={onClose}
    >
      <div
        className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-border-subtle bg-surface shadow-elev-2"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5">
          <div className="space-y-1">
            <h2
              id="kyc-drawer-title"
              className="text-base font-semibold text-fg"
            >
              {submission.applicantName}
            </h2>
            <p className="text-xs text-fg-muted">
              {submission.applicantUserId} · Tier {submission.tier} · submitted{" "}
              {formatRelative(submission.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-md text-fg-faint hover:bg-hover hover:text-fg"
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <DocumentViewer documents={submission.documents} />

          <section className="mt-5 rounded-md border border-border-subtle bg-surface-2 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-fg-faint">
              Signals
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-fg-muted">Risk score</dt>
              <dd className="text-fg">
                {submission.riskScore} / 100
                {submission.riskReasons.length > 0 && (
                  <span className="ml-2 text-fg-faint">
                    ({submission.riskReasons.join(", ")})
                  </span>
                )}
              </dd>
              <dt className="text-fg-muted">Assignee</dt>
              <dd className="text-fg">{submission.assignee ?? "—"}</dd>
              <dt className="text-fg-muted">Status</dt>
              <dd className="text-fg">
                <StatusPill status={submission.status} />
              </dd>
            </dl>
          </section>

          {readOnly && submission.decision && (
            <DecisionSummary decision={submission.decision} />
          )}

          {!readOnly && (
            <VerdictForm submission={submission} onSubmit={onSubmit} />
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentViewer({ documents }: { documents: KycDocument[] }) {
  const [active, setActive] = useState<DocKind>(documents[0]?.kind ?? "id_front");
  const current = documents.find((d) => d.kind === active);
  return (
    <section aria-labelledby="kyc-docs-heading">
      <h3
        id="kyc-docs-heading"
        className="text-xs font-medium uppercase tracking-wide text-fg-faint"
      >
        Documents
      </h3>
      <div
        role="tablist"
        aria-label="Document tabs"
        className="mt-2 inline-flex rounded-md border border-border-subtle bg-surface p-0.5"
      >
        {documents.map((d) => {
          const isActive = d.kind === active;
          return (
            <button
              key={d.kind}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(d.kind)}
              className={
                isActive
                  ? "inline-flex items-center gap-1.5 rounded-[5px] bg-selected px-3 py-1.5 text-xs font-medium text-brand"
                  : "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
              }
            >
              <DocIcon kind={d.kind} />
              {DOC_LABELS[d.kind]}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        aria-label={`${DOC_LABELS[active]} preview`}
        className="mt-3 grid h-72 place-items-center rounded-md border border-dashed border-border-subtle bg-surface-2 text-center text-fg-faint"
      >
        <div className="space-y-2 px-6">
          <DocIcon kind={active} large />
          <p className="text-sm font-medium text-fg-muted">
            {DOC_LABELS[active]}
          </p>
          {current && (
            <p className="text-xs">
              Captured {formatRelative(current.capturedAt)}
            </p>
          )}
          <p className="text-xs">
            (Live image fetch ships with NSwag client integration — T-web-002.1)
          </p>
        </div>
      </div>
    </section>
  );
}

function DocIcon({ kind, large = false }: { kind: DocKind; large?: boolean }) {
  const size = large ? 28 : 14;
  const props = { size, strokeWidth: 1.5, "aria-hidden": true } as const;
  switch (kind) {
    case "id_front":
    case "id_back":
      return <CreditCard {...props} />;
    case "selfie":
      return <Camera {...props} />;
    case "vehicle_reg":
      return <FileBadge {...props} />;
  }
}

function DecisionSummary({ decision }: { decision: KycDecision }) {
  return (
    <section
      aria-label="Decision summary"
      className="mt-5 rounded-md border border-border-subtle bg-surface-2 p-4"
    >
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg-faint">
        Decision
      </h3>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex gap-3">
          <dt className="w-24 text-fg-muted">Verdict</dt>
          <dd className="text-fg">{decision.verdict}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 text-fg-muted">Reason</dt>
          <dd className="text-fg">{decision.reasonCode}</dd>
        </div>
        {decision.note && (
          <div className="flex gap-3">
            <dt className="w-24 text-fg-muted">Note</dt>
            <dd className="text-fg">{decision.note}</dd>
          </div>
        )}
        {decision.reuploadDocs.length > 0 && (
          <div className="flex gap-3">
            <dt className="w-24 text-fg-muted">Resubmit</dt>
            <dd className="text-fg">
              {decision.reuploadDocs.map((d) => DOC_LABELS[d]).join(", ")}
            </dd>
          </div>
        )}
        <div className="flex gap-3">
          <dt className="w-24 text-fg-muted">By</dt>
          <dd className="text-fg">{decision.decidedBy}</dd>
        </div>
      </dl>
    </section>
  );
}

function VerdictForm({
  submission,
  onSubmit,
}: {
  submission: KycSubmission;
  onSubmit: (draft: VerdictDraft) => void;
}) {
  const [verdict, setVerdict] = useState<VerdictDraft["verdict"] | null>(null);
  const [reasonCode, setReasonCode] = useState<string>("");
  const [note, setNote] = useState("");
  const [reuploadDocs, setReuploadDocs] = useState<DocKind[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<"verdict" | "reasonCode" | "reuploadDocs", string>>
  >({});

  const reasons =
    verdict === "approve"
      ? APPROVE_REASONS
      : verdict === "reject"
        ? REJECT_REASONS
        : verdict === "resubmit"
          ? RESUBMIT_REASONS
          : [];

  function chooseVerdict(next: VerdictDraft["verdict"]) {
    setVerdict(next);
    setReasonCode("");
    setReuploadDocs([]);
    setErrors({});
  }

  function toggleReupload(kind: DocKind) {
    setReuploadDocs((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind],
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verdict) {
      setErrors({ verdict: "Pick a verdict" });
      return;
    }
    if (verdict === "resubmit" && reuploadDocs.length === 0) {
      setErrors({ reuploadDocs: "Select at least one document to resubmit" });
      return;
    }
    const parsed = verdictSchema.safeParse({
      verdict,
      reasonCode,
      note,
      reuploadDocs,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const next: Partial<
        Record<"verdict" | "reasonCode" | "reuploadDocs", string>
      > = {};
      if (flat.fieldErrors.reasonCode?.[0])
        next.reasonCode = flat.fieldErrors.reasonCode[0];
      setErrors(next);
      return;
    }
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-wide text-fg-faint">
          Verdict
        </legend>
        <div
          role="radiogroup"
          aria-label="Verdict"
          className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <VerdictRadio
            checked={verdict === "approve"}
            onChange={() => chooseVerdict("approve")}
            icon={<CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />}
            tone="success"
            label="Approve"
          />
          <VerdictRadio
            checked={verdict === "reject"}
            onChange={() => chooseVerdict("reject")}
            icon={<XCircle size={16} strokeWidth={1.75} aria-hidden />}
            tone="danger"
            label="Reject"
          />
          <VerdictRadio
            checked={verdict === "resubmit"}
            onChange={() => chooseVerdict("resubmit")}
            icon={<RefreshCcw size={16} strokeWidth={1.75} aria-hidden />}
            tone="warning"
            label="Request resubmit"
          />
        </div>
        {errors.verdict && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {errors.verdict}
          </p>
        )}
      </fieldset>

      {verdict && (
        <div className="space-y-1.5">
          <label
            htmlFor="kyc-reason"
            className="block text-sm font-medium text-fg-muted"
          >
            Reason
          </label>
          <select
            id="kyc-reason"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            aria-invalid={!!errors.reasonCode}
            className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-brand"
          >
            <option value="">Select reason…</option>
            {reasons.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.reasonCode && (
            <p role="alert" className="text-xs text-danger">
              {errors.reasonCode}
            </p>
          )}
        </div>
      )}

      {verdict === "resubmit" && (
        <fieldset>
          <legend className="text-sm font-medium text-fg-muted">
            Documents to resubmit
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {submission.documents.map((d) => {
              const checked = reuploadDocs.includes(d.kind);
              return (
                <label
                  key={d.kind}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-muted hover:bg-hover"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleReupload(d.kind)}
                    aria-label={`Resubmit ${DOC_LABELS[d.kind]}`}
                  />
                  {DOC_LABELS[d.kind]}
                </label>
              );
            })}
          </div>
          {errors.reuploadDocs && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.reuploadDocs}
            </p>
          )}
        </fieldset>
      )}

      {verdict && (
        <div className="space-y-1.5">
          <label
            htmlFor="kyc-note"
            className="block text-sm font-medium text-fg-muted"
          >
            Note
            <span className="ml-1 text-fg-faint">
              {verdict === "reject" || verdict === "resubmit"
                ? "(visible to applicant)"
                : "(optional)"}
            </span>
          </label>
          <textarea
            id="kyc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={280}
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-brand"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={!verdict}
          className="h-9 rounded-md bg-brand px-3 text-sm font-medium text-fg-inverse transition-colors hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit verdict
        </button>
      </div>
    </form>
  );
}

function VerdictRadio({
  checked,
  onChange,
  label,
  icon,
  tone,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: React.ReactNode;
  tone: "success" | "danger" | "warning";
}) {
  const activeRing =
    tone === "success"
      ? "border-success text-success"
      : tone === "danger"
        ? "border-danger text-danger"
        : "border-warning text-warning";
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border bg-surface px-3 py-2 text-sm transition-colors ${
        checked
          ? activeRing
          : "border-border-subtle text-fg-muted hover:bg-hover"
      }`}
    >
      <input
        type="radio"
        name="verdict"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={label}
      />
      {icon}
      {label}
    </label>
  );
}

function formatRelative(ms: number): string {
  const diff = NOW - ms;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < 24 * HOUR) {
    const h = Math.floor(diff / HOUR);
    const m = Math.round((diff % HOUR) / MIN);
    return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
  }
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / MIN))}m`;
  const h = Math.floor(ms / HOUR);
  const m = Math.round((ms % HOUR) / MIN);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
