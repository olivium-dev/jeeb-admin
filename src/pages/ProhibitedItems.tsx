import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { Pencil, Plus, RotateCcw, Search, X } from "lucide-react";

export type ProhibitedCategory =
  | "weapons"
  | "drugs"
  | "alcohol"
  | "hazardous"
  | "counterfeit"
  | "live_animals"
  | "regulated"
  | "other";

export interface ProhibitedItem {
  id: string;
  name: string;
  category: ProhibitedCategory;
  description: string;
  active: boolean;
  updatedAt: number;
}

const CATEGORY_LABELS: Record<ProhibitedCategory, string> = {
  weapons: "Weapons & ammunition",
  drugs: "Narcotics & illegal drugs",
  alcohol: "Alcohol",
  hazardous: "Hazardous materials",
  counterfeit: "Counterfeit goods",
  live_animals: "Live animals",
  regulated: "Regulated items",
  other: "Other",
};

const CATEGORY_ORDER: ProhibitedCategory[] = [
  "weapons",
  "drugs",
  "alcohol",
  "hazardous",
  "counterfeit",
  "live_animals",
  "regulated",
  "other",
];

const itemSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80),
  category: z.enum([
    "weapons",
    "drugs",
    "alcohol",
    "hazardous",
    "counterfeit",
    "live_animals",
    "regulated",
    "other",
  ]),
  description: z.string().trim().max(280).default(""),
});

type ItemDraft = z.infer<typeof itemSchema>;

const SEED: ProhibitedItem[] = [
  {
    id: "pi_001",
    name: "Firearms and ammunition",
    category: "weapons",
    description: "Includes airguns, replicas, and component parts.",
    active: true,
    updatedAt: Date.parse("2026-03-12T09:24:00Z"),
  },
  {
    id: "pi_002",
    name: "Narcotics and controlled substances",
    category: "drugs",
    description: "Per MoI schedule I–IV.",
    active: true,
    updatedAt: Date.parse("2026-02-28T14:02:00Z"),
  },
  {
    id: "pi_003",
    name: "Alcoholic beverages",
    category: "alcohol",
    description: "All alcohol-containing products.",
    active: true,
    updatedAt: Date.parse("2026-01-05T08:10:00Z"),
  },
  {
    id: "pi_004",
    name: "Flammable gases",
    category: "hazardous",
    description: "Butane, propane, hydrogen cylinders.",
    active: true,
    updatedAt: Date.parse("2026-03-20T11:50:00Z"),
  },
  {
    id: "pi_005",
    name: "Counterfeit currency",
    category: "counterfeit",
    description: "Bills, coins, and minting tools.",
    active: false,
    updatedAt: Date.parse("2026-04-02T16:30:00Z"),
  },
];

type FilterStatus = "all" | "active" | "inactive";

export function ProhibitedItemsPage() {
  const [items, setItems] = useState<ProhibitedItem[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [editing, setEditing] = useState<ProhibitedItem | "new" | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] =
    useState<ProhibitedItem | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => {
        if (statusFilter === "active" && !it.active) return false;
        if (statusFilter === "inactive" && it.active) return false;
        if (!q) return true;
        return (
          it.name.toLowerCase().includes(q) ||
          CATEGORY_LABELS[it.category].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query, statusFilter]);

  function upsert(draft: ItemDraft, id: string | null) {
    setItems((prev) => {
      if (id) {
        return prev.map((it) =>
          it.id === id ? { ...it, ...draft, updatedAt: Date.now() } : it,
        );
      }
      const next: ProhibitedItem = {
        id: `pi_${Math.random().toString(36).slice(2, 8)}`,
        ...draft,
        description: draft.description ?? "",
        active: true,
        updatedAt: Date.now(),
      };
      return [...prev, next];
    });
    setEditing(null);
  }

  function deactivate(item: ProhibitedItem) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, active: false, updatedAt: Date.now() }
          : it,
      ),
    );
    setConfirmDeactivate(null);
  }

  function reactivate(item: ProhibitedItem) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, active: true, updatedAt: Date.now() }
          : it,
      ),
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-8 py-10">
      <header className="flex items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-fg">Prohibited items</h1>
          <p className="text-sm text-fg-muted">
            Manage the platform-wide list of items that cannot be transported.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-fg-inverse transition-colors hover:bg-brand-hover active:bg-brand-pressed"
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Add item
        </button>
      </header>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
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
            placeholder="Search name or category…"
            aria-label="Search prohibited items"
            className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg outline-none transition-colors focus:border-brand"
          />
        </div>
        <StatusTabs value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-fg-muted"
                >
                  No items match your filters.
                </td>
              </tr>
            )}
            {visible.map((it) => (
              <tr
                key={it.id}
                className="border-t border-border-subtle align-top"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-fg">{it.name}</div>
                  {it.description && (
                    <div className="mt-0.5 text-xs text-fg-muted">
                      {it.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {CATEGORY_LABELS[it.category]}
                </td>
                <td className="px-4 py-3">
                  <StatusPill active={it.active} />
                </td>
                <td className="px-4 py-3 text-xs text-fg-faint">
                  {formatDate(it.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(it)}
                      aria-label={`Edit ${it.name}`}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface px-2 text-xs text-fg-muted hover:bg-hover hover:text-fg"
                    >
                      <Pencil size={14} strokeWidth={1.5} aria-hidden />
                      Edit
                    </button>
                    {it.active ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeactivate(it)}
                        aria-label={`Deactivate ${it.name}`}
                        className="inline-flex h-8 items-center rounded-md border border-border-subtle bg-surface px-2 text-xs text-danger hover:bg-danger/8"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reactivate(it)}
                        aria-label={`Reactivate ${it.name}`}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface px-2 text-xs text-fg-muted hover:bg-hover hover:text-fg"
                      >
                        <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ItemDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(draft) =>
            upsert(draft, editing === "new" ? null : editing.id)
          }
        />
      )}
      {confirmDeactivate && (
        <ConfirmDialog
          item={confirmDeactivate}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={() => deactivate(confirmDeactivate)}
        />
      )}
    </section>
  );
}

function StatusTabs({
  value,
  onChange,
}: {
  value: FilterStatus;
  onChange: (next: FilterStatus) => void;
}) {
  const tabs: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
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
          </button>
        );
      })}
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const cls = active
    ? "bg-success/12 text-success"
    : "bg-surface-2 text-fg-faint";
  return (
    <span
      className={`inline-flex h-5 items-center rounded-pill px-2 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

interface ItemDialogProps {
  initial: ProhibitedItem | null;
  onClose: () => void;
  onSubmit: (draft: ItemDraft) => void;
}

function ItemDialog({ initial, onClose, onSubmit }: ItemDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ProhibitedCategory>(
    initial?.category ?? "other",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "category" | "description", string>>
  >({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = itemSchema.safeParse({ name, category, description });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const next: Partial<Record<"name" | "category" | "description", string>> = {};
      if (flat.fieldErrors.name?.[0]) next.name = flat.fieldErrors.name[0];
      if (flat.fieldErrors.category?.[0])
        next.category = flat.fieldErrors.category[0];
      if (flat.fieldErrors.description?.[0])
        next.description = flat.fieldErrors.description[0];
      setErrors(next);
      return;
    }
    onSubmit(parsed.data);
  }

  const title = initial ? "Edit prohibited item" : "Add prohibited item";

  return (
    <ModalShell labelledBy="prohibited-dialog-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <h2
          id="prohibited-dialog-title"
          className="text-base font-semibold text-fg"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-7 place-items-center rounded-md text-fg-faint hover:bg-hover hover:text-fg"
        >
          <X size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 space-y-4"
      >
        <Field
          id="pi-name"
          label="Item name"
          value={name}
          onChange={setName}
          error={errors.name}
          required
        />
        <div className="space-y-1.5">
          <label
            htmlFor="pi-category"
            className="block text-sm font-medium text-fg-muted"
          >
            Category
          </label>
          <select
            id="pi-category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ProhibitedCategory)
            }
            aria-invalid={!!errors.category}
            className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-brand"
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p role="alert" className="text-xs text-danger">
              {errors.category}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="pi-description"
            className="block text-sm font-medium text-fg-muted"
          >
            Description
            <span className="ml-1 text-fg-faint">(optional)</span>
          </label>
          <textarea
            id="pi-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={280}
            aria-invalid={!!errors.description}
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-brand"
          />
          {errors.description && (
            <p role="alert" className="text-xs text-danger">
              {errors.description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-sm text-fg-muted hover:bg-hover hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-9 rounded-md bg-brand px-3 text-sm font-medium text-fg-inverse hover:bg-brand-hover active:bg-brand-pressed"
          >
            {initial ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmDialog({
  item,
  onCancel,
  onConfirm,
}: {
  item: ProhibitedItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell labelledBy="prohibited-confirm-title" onClose={onCancel}>
      <h2
        id="prohibited-confirm-title"
        className="text-base font-semibold text-fg"
      >
        Deactivate “{item.name}”?
      </h2>
      <p className="mt-2 text-sm text-fg-muted">
        Couriers and merchants will no longer see this item in the prohibited
        list. You can reactivate it later from the inactive tab.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md border border-border-subtle bg-surface px-3 text-sm text-fg-muted hover:bg-hover hover:text-fg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 rounded-md bg-danger px-3 text-sm font-medium text-fg-inverse hover:opacity-90"
        >
          Deactivate
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border-subtle bg-surface p-5 shadow-elev-2"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string | undefined;
  required?: boolean;
}

function Field({ id, label, value, onChange, error, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-fg-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-brand"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
