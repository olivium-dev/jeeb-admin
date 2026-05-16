import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  Ban,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react";

export type UserRole =
  | "rider"
  | "merchant"
  | "courier"
  | "support_agent"
  | "kyc_reviewer"
  | "finance_ops"
  | "ops_admin"
  | "superuser";

export type UserStatus = "active" | "suspended";

export type DeliveryStatus =
  | "delivered"
  | "cancelled_by_customer"
  | "cancelled_by_courier"
  | "failed"
  | "in_progress";

export interface DeliveryHistoryEntry {
  id: string;
  createdAt: number;
  status: DeliveryStatus;
  fromCity: string;
  toCity: string;
  amountSar: number;
  courierName: string;
  rating: number | null;
}

export interface SuspensionRecord {
  reasonCode: SuspensionReason;
  note: string;
  suspendedAt: number;
  suspendedBy: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  roles: UserRole[];
  status: UserStatus;
  rating: number | null;
  ratingCount: number;
  deliveryCount: number;
  joinedAt: number;
  lastActiveAt: number;
  deliveries: DeliveryHistoryEntry[];
  suspension: SuspensionRecord | null;
}

export type SuspensionReason =
  | "fraud_suspected"
  | "policy_violation"
  | "abusive_behavior"
  | "unverified_identity"
  | "chargeback_history"
  | "law_enforcement_request"
  | "other";

const ROLE_LABELS: Record<UserRole, string> = {
  rider: "Rider",
  merchant: "Merchant",
  courier: "Courier",
  support_agent: "Support agent",
  kyc_reviewer: "KYC reviewer",
  finance_ops: "Finance ops",
  ops_admin: "Ops admin",
  superuser: "Superuser",
};

const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  delivered: "Delivered",
  cancelled_by_customer: "Cancelled (customer)",
  cancelled_by_courier: "Cancelled (courier)",
  failed: "Failed",
  in_progress: "In progress",
};

const SUSPENSION_REASONS: { code: SuspensionReason; label: string }[] = [
  { code: "fraud_suspected", label: "Fraud suspected" },
  { code: "policy_violation", label: "Policy violation" },
  { code: "abusive_behavior", label: "Abusive behavior toward staff or peers" },
  { code: "unverified_identity", label: "Unverified identity" },
  { code: "chargeback_history", label: "Repeated chargebacks" },
  { code: "law_enforcement_request", label: "Law enforcement request" },
  { code: "other", label: "Other (see note)" },
];

const suspensionSchema = z.object({
  reasonCode: z.enum([
    "fraud_suspected",
    "policy_violation",
    "abusive_behavior",
    "unverified_identity",
    "chargeback_history",
    "law_enforcement_request",
    "other",
  ]),
  note: z.string().trim().min(8, "Add at least 8 characters of context").max(280),
});

type SuspensionDraft = z.infer<typeof suspensionSchema>;

const NOW = Date.parse("2026-05-16T10:30:00Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const SEED: AdminUser[] = [
  {
    id: "usr_8a31c2",
    fullName: "Salem Al-Otaibi",
    phone: "+966 50 123 4567",
    email: "salem.alotaibi@example.com",
    city: "Riyadh",
    roles: ["rider", "courier"],
    status: "active",
    rating: 4.8,
    ratingCount: 132,
    deliveryCount: 184,
    joinedAt: NOW - 220 * DAY,
    lastActiveAt: NOW - 2 * HOUR,
    deliveries: [
      {
        id: "del_a1",
        createdAt: NOW - 6 * HOUR,
        status: "delivered",
        fromCity: "Riyadh",
        toCity: "Riyadh",
        amountSar: 42,
        courierName: "Mira Saad",
        rating: 5,
      },
      {
        id: "del_a2",
        createdAt: NOW - 2 * DAY,
        status: "delivered",
        fromCity: "Riyadh",
        toCity: "Diriyah",
        amountSar: 65,
        courierName: "Omar Z.",
        rating: 4,
      },
      {
        id: "del_a3",
        createdAt: NOW - 6 * DAY,
        status: "cancelled_by_courier",
        fromCity: "Riyadh",
        toCity: "Riyadh",
        amountSar: 0,
        courierName: "Khalid R.",
        rating: null,
      },
    ],
    suspension: null,
  },
  {
    id: "usr_91fa07",
    fullName: "Lina Haddad",
    phone: "+966 55 887 2211",
    email: "lina.haddad@example.com",
    city: "Jeddah",
    roles: ["rider"],
    status: "active",
    rating: 4.6,
    ratingCount: 41,
    deliveryCount: 47,
    joinedAt: NOW - 110 * DAY,
    lastActiveAt: NOW - 45 * MIN,
    deliveries: [
      {
        id: "del_b1",
        createdAt: NOW - 1 * HOUR,
        status: "in_progress",
        fromCity: "Jeddah",
        toCity: "Jeddah",
        amountSar: 28,
        courierName: "Rami N.",
        rating: null,
      },
      {
        id: "del_b2",
        createdAt: NOW - 1 * DAY,
        status: "delivered",
        fromCity: "Jeddah",
        toCity: "Jeddah",
        amountSar: 31,
        courierName: "Hala M.",
        rating: 5,
      },
    ],
    suspension: null,
  },
  {
    id: "usr_7c1d44",
    fullName: "مازن العتيبي",
    phone: "+966 53 401 9988",
    email: "mazen.alotaibi@example.com",
    city: "Riyadh",
    roles: ["merchant"],
    status: "active",
    rating: 4.4,
    ratingCount: 88,
    deliveryCount: 312,
    joinedAt: NOW - 405 * DAY,
    lastActiveAt: NOW - 8 * MIN,
    deliveries: [
      {
        id: "del_c1",
        createdAt: NOW - 30 * MIN,
        status: "delivered",
        fromCity: "Riyadh",
        toCity: "Riyadh",
        amountSar: 110,
        courierName: "Mira Saad",
        rating: 4,
      },
    ],
    suspension: null,
  },
  {
    id: "usr_2bc0e9",
    fullName: "Khalid R.",
    phone: "+966 56 220 4419",
    email: "khalid.r@example.com",
    city: "Dammam",
    roles: ["courier"],
    status: "suspended",
    rating: 3.2,
    ratingCount: 19,
    deliveryCount: 28,
    joinedAt: NOW - 95 * DAY,
    lastActiveAt: NOW - 5 * DAY,
    deliveries: [
      {
        id: "del_d1",
        createdAt: NOW - 5 * DAY,
        status: "failed",
        fromCity: "Dammam",
        toCity: "Khobar",
        amountSar: 0,
        courierName: "Khalid R.",
        rating: 1,
      },
      {
        id: "del_d2",
        createdAt: NOW - 7 * DAY,
        status: "cancelled_by_courier",
        fromCity: "Dammam",
        toCity: "Khobar",
        amountSar: 0,
        courierName: "Khalid R.",
        rating: null,
      },
    ],
    suspension: {
      reasonCode: "policy_violation",
      note: "Repeated cancellations after acceptance. See incident #INC-2186.",
      suspendedAt: NOW - 4 * DAY,
      suspendedBy: "noor",
    },
  },
  {
    id: "usr_5e8b30",
    fullName: "Mira Saad",
    phone: "+966 54 998 1100",
    email: "mira.saad@example.com",
    city: "Riyadh",
    roles: ["courier"],
    status: "active",
    rating: 4.9,
    ratingCount: 412,
    deliveryCount: 489,
    joinedAt: NOW - 530 * DAY,
    lastActiveAt: NOW - 12 * MIN,
    deliveries: [
      {
        id: "del_e1",
        createdAt: NOW - 6 * HOUR,
        status: "delivered",
        fromCity: "Riyadh",
        toCity: "Riyadh",
        amountSar: 42,
        courierName: "Mira Saad",
        rating: 5,
      },
      {
        id: "del_e2",
        createdAt: NOW - 30 * MIN,
        status: "delivered",
        fromCity: "Riyadh",
        toCity: "Riyadh",
        amountSar: 110,
        courierName: "Mira Saad",
        rating: 4,
      },
    ],
    suspension: null,
  },
];

type StatusFilter = "all" | "active" | "suspended";

export function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => {
        if (statusFilter !== "all" && u.status !== statusFilter) return false;
        if (!q) return true;
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.phone.toLowerCase().replace(/\s+/g, "").includes(q.replace(/\s+/g, "")) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users, query, statusFilter]);

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId],
  );

  function suspend(userId: string, draft: SuspensionDraft) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: "suspended",
              suspension: {
                reasonCode: draft.reasonCode,
                note: draft.note,
                suspendedAt: NOW,
                suspendedBy: "you",
              },
            }
          : u,
      ),
    );
    setSuspending(null);
  }

  function unsuspend(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: "active", suspension: null } : u,
      ),
    );
  }

  const counts = countByStatus(users);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-fg">Users</h1>
          <p className="text-sm text-fg-muted">
            Search riders, couriers, and merchants. View profile and delivery
            history; suspend or unsuspend with a reason.
          </p>
        </div>
      </header>

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
            placeholder="Search by name, phone, or email…"
            aria-label="Search users"
            className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg outline-none transition-colors focus:border-brand"
          />
        </div>
        <StatusTabs
          value={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
            <tr>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Roles</th>
              <th className="px-4 py-2 font-medium">Rating</th>
              <th className="px-4 py-2 font-medium">Deliveries</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-fg-muted"
                >
                  No users match your search.
                </td>
              </tr>
            )}
            {visible.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border-subtle align-middle"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-fg">{u.fullName}</div>
                  <div className="text-xs text-fg-faint">
                    {u.id} · {u.city}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-muted">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} strokeWidth={1.5} aria-hidden />
                    {u.phone}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Mail size={12} strokeWidth={1.5} aria-hidden />
                    {u.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleChips roles={u.roles} />
                </td>
                <td className="px-4 py-3">
                  <RatingDisplay
                    rating={u.rating}
                    count={u.ratingCount}
                  />
                </td>
                <td className="px-4 py-3 text-fg">{u.deliveryCount}</td>
                <td className="px-4 py-3">
                  <StatusPill status={u.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      aria-label={`View profile for ${u.fullName}`}
                      className="inline-flex h-8 items-center rounded-md border border-border-subtle bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-hover hover:text-fg"
                    >
                      View profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ProfileDrawer
          user={selected}
          onClose={() => setSelectedId(null)}
          onRequestSuspend={() => setSuspending(selected)}
          onUnsuspend={() => unsuspend(selected.id)}
        />
      )}

      {suspending && (
        <SuspendDialog
          user={suspending}
          onCancel={() => setSuspending(null)}
          onConfirm={(draft) => suspend(suspending.id, draft)}
        />
      )}
    </section>
  );
}

function countByStatus(users: AdminUser[]) {
  return users.reduce(
    (acc, u) => {
      acc[u.status] += 1;
      acc.all += 1;
      return acc;
    },
    { all: 0, active: 0, suspended: 0 } as Record<StatusFilter, number>,
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
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "suspended", label: "Suspended" },
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

function StatusPill({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { cls: string; label: string }> = {
    active: { cls: "bg-success/12 text-success", label: "Active" },
    suspended: { cls: "bg-danger/12 text-danger", label: "Suspended" },
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

function RoleChips({ roles }: { roles: UserRole[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className="inline-flex h-5 items-center rounded-pill bg-surface-2 px-2 text-[10px] font-medium text-fg-muted"
        >
          {ROLE_LABELS[r]}
        </span>
      ))}
    </div>
  );
}

function RatingDisplay({
  rating,
  count,
}: {
  rating: number | null;
  count: number;
}) {
  if (rating === null) {
    return <span className="text-xs text-fg-faint">No ratings</span>;
  }
  return (
    <div className="flex items-center gap-1.5 text-fg">
      <Star
        size={12}
        strokeWidth={1.5}
        aria-hidden
        className="fill-warning text-warning"
      />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-fg-faint">({count})</span>
    </div>
  );
}

function DeliveryStatusPill({ status }: { status: DeliveryStatus }) {
  const map: Record<DeliveryStatus, string> = {
    delivered: "bg-success/12 text-success",
    in_progress: "bg-info/12 text-info",
    cancelled_by_customer: "bg-surface-2 text-fg-muted",
    cancelled_by_courier: "bg-surface-2 text-fg-muted",
    failed: "bg-danger/12 text-danger",
  };
  return (
    <span
      className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold ${map[status]}`}
    >
      {DELIVERY_STATUS_LABELS[status]}
    </span>
  );
}

interface ProfileDrawerProps {
  user: AdminUser;
  onClose: () => void;
  onRequestSuspend: () => void;
  onUnsuspend: () => void;
}

function ProfileDrawer({
  user,
  onClose,
  onRequestSuspend,
  onUnsuspend,
}: ProfileDrawerProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
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
              id="user-drawer-title"
              className="text-base font-semibold text-fg"
            >
              {user.fullName}
            </h2>
            <p className="text-xs text-fg-muted">
              {user.id} · joined {formatDate(user.joinedAt)} · last active{" "}
              {formatRelative(user.lastActiveAt)}
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
          <section
            aria-labelledby="user-summary-heading"
            className="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            <h3 id="user-summary-heading" className="sr-only">
              Summary
            </h3>
            <SummaryCard
              icon={<ShieldCheck size={14} strokeWidth={1.5} aria-hidden />}
              label="Status"
              value={<StatusPill status={user.status} />}
            />
            <SummaryCard
              icon={<Star size={14} strokeWidth={1.5} aria-hidden />}
              label="Rating"
              value={
                <RatingDisplay rating={user.rating} count={user.ratingCount} />
              }
            />
            <SummaryCard
              icon={<Truck size={14} strokeWidth={1.5} aria-hidden />}
              label="Deliveries"
              value={
                <span className="text-sm font-semibold text-fg">
                  {user.deliveryCount}
                </span>
              }
            />
            <SummaryCard
              icon={<Phone size={14} strokeWidth={1.5} aria-hidden />}
              label="City"
              value={<span className="text-sm text-fg">{user.city}</span>}
            />
          </section>

          <section
            aria-labelledby="user-contact-heading"
            className="mt-5 rounded-md border border-border-subtle bg-surface-2 p-4"
          >
            <h3
              id="user-contact-heading"
              className="text-xs font-medium uppercase tracking-wide text-fg-faint"
            >
              Contact & roles
            </h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              <dt className="text-fg-muted">Phone</dt>
              <dd className="text-fg">{user.phone}</dd>
              <dt className="text-fg-muted">Email</dt>
              <dd className="text-fg">{user.email}</dd>
              <dt className="text-fg-muted">Roles</dt>
              <dd className="text-fg">
                <RoleChips roles={user.roles} />
              </dd>
            </dl>
          </section>

          {user.suspension && (
            <section
              aria-label="Active suspension"
              className="mt-5 rounded-md border border-danger/30 bg-danger/8 p-4"
            >
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
                <Ban size={12} strokeWidth={2} aria-hidden />
                Suspended
              </h3>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex gap-3">
                  <dt className="w-24 text-fg-muted">Reason</dt>
                  <dd className="text-fg">
                    {reasonLabel(user.suspension.reasonCode)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-fg-muted">Note</dt>
                  <dd className="text-fg">{user.suspension.note}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-fg-muted">When</dt>
                  <dd className="text-fg">
                    {formatRelative(user.suspension.suspendedAt)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-fg-muted">By</dt>
                  <dd className="text-fg">{user.suspension.suspendedBy}</dd>
                </div>
              </dl>
            </section>
          )}

          <section aria-labelledby="user-history-heading" className="mt-5">
            <h3
              id="user-history-heading"
              className="text-xs font-medium uppercase tracking-wide text-fg-faint"
            >
              Delivery history
            </h3>
            <div className="mt-2 overflow-hidden rounded-md border border-border-subtle bg-surface">
              <table className="w-full text-xs">
                <thead className="bg-surface-2 text-left uppercase tracking-wide text-fg-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">Route</th>
                    <th className="px-3 py-2 font-medium">Courier</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.deliveries.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-fg-muted"
                      >
                        No deliveries yet.
                      </td>
                    </tr>
                  )}
                  {user.deliveries.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-border-subtle align-middle"
                    >
                      <td className="px-3 py-2 text-fg-muted">
                        {formatRelative(d.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-fg">
                        {d.fromCity} → {d.toCity}
                      </td>
                      <td className="px-3 py-2 text-fg-muted">
                        {d.courierName}
                      </td>
                      <td className="px-3 py-2 text-fg">
                        {d.amountSar > 0 ? `${d.amountSar} SAR` : "—"}
                      </td>
                      <td className="px-3 py-2 text-fg-muted">
                        {d.rating === null ? (
                          "—"
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Star
                              size={11}
                              strokeWidth={1.5}
                              aria-hidden
                              className="fill-warning text-warning"
                            />
                            {d.rating}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <DeliveryStatusPill status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border-subtle bg-surface-2 p-4">
          {user.status === "active" ? (
            <button
              type="button"
              onClick={onRequestSuspend}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-danger px-3 text-sm font-medium text-fg-inverse hover:opacity-90"
            >
              <Ban size={14} strokeWidth={1.75} aria-hidden />
              Suspend user
            </button>
          ) : (
            <button
              type="button"
              onClick={onUnsuspend}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-fg-inverse hover:bg-brand-hover active:bg-brand-pressed"
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
              Unsuspend user
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-3">
      <h4 className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-fg-faint">
        {icon}
        {label}
      </h4>
      <div className="mt-1.5">{value}</div>
    </article>
  );
}

interface SuspendDialogProps {
  user: AdminUser;
  onCancel: () => void;
  onConfirm: (draft: SuspensionDraft) => void;
}

function SuspendDialog({ user, onCancel, onConfirm }: SuspendDialogProps) {
  const [reasonCode, setReasonCode] = useState<SuspensionReason | "">("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"reasonCode" | "note", string>>
  >({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = suspensionSchema.safeParse({ reasonCode, note });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const next: Partial<Record<"reasonCode" | "note", string>> = {};
      if (flat.fieldErrors.reasonCode?.[0])
        next.reasonCode = "Pick a reason";
      if (flat.fieldErrors.note?.[0]) next.note = flat.fieldErrors.note[0];
      setErrors(next);
      return;
    }
    onConfirm(parsed.data);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-dialog-title"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border-subtle bg-surface p-5 shadow-elev-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="suspend-dialog-title"
            className="text-base font-semibold text-fg"
          >
            Suspend {user.fullName}?
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-md text-fg-faint hover:bg-hover hover:text-fg"
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          The user will be unable to place or accept deliveries until
          unsuspended. The reason and note are recorded in the audit log.
        </p>
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="suspend-reason"
              className="block text-sm font-medium text-fg-muted"
            >
              Reason
            </label>
            <select
              id="suspend-reason"
              value={reasonCode}
              onChange={(e) =>
                setReasonCode(e.target.value as SuspensionReason | "")
              }
              aria-invalid={!!errors.reasonCode}
              className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-brand"
            >
              <option value="">Select reason…</option>
              {SUSPENSION_REASONS.map((r) => (
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
          <div className="space-y-1.5">
            <label
              htmlFor="suspend-note"
              className="block text-sm font-medium text-fg-muted"
            >
              Note
              <span className="ml-1 text-fg-faint">(audit log)</span>
            </label>
            <textarea
              id="suspend-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={280}
              aria-invalid={!!errors.note}
              className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-brand"
            />
            {errors.note && (
              <p role="alert" className="text-xs text-danger">
                {errors.note}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-sm text-fg-muted hover:bg-hover hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded-md bg-danger px-3 text-sm font-medium text-fg-inverse hover:opacity-90"
            >
              Suspend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function reasonLabel(code: SuspensionReason): string {
  return SUSPENSION_REASONS.find((r) => r.code === code)?.label ?? code;
}

function formatRelative(ms: number): string {
  const diff = NOW - ms;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    const m = Math.round((diff % HOUR) / MIN);
    return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
