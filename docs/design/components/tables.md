# Component — Tables

`<DataTable>` is the workhorse of the admin. KYC queue, disputes queue, users list, finance transactions, refunds, payouts, audit log — every list-bearing screen renders through it. Specs here lock the contract; raw `<table>` is banned in app code.

Package: `@jeeb/ui` → `import { DataTable } from '@jeeb/ui'`.

## 1. Intent

A high-density, keyboard-driven, server-paginated table that delivers consistent ergonomics across every admin queue. Reviewers must be able to switch surfaces without re-learning column behavior.

## 2. API

```tsx
type DataTableProps<Row> = {
  rows: Row[];
  columns: ColumnDef<Row>[];
  status: 'ready' | 'loading' | 'error' | 'empty' | 'filtered';
  rowKey: (row: Row) => string;

  // sort / filter — controlled
  sort?: { columnId: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: DataTableProps<Row>['sort']) => void;

  // pagination — cursor-based
  cursor?: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (dir: 'next' | 'prev', cursor: string | null) => void;
  pageSize: 10 | 25 | 50 | 100;
  onPageSizeChange?: (n: 10 | 25 | 50 | 100) => void;

  // selection (disabled in MVP unless explicitly enabled)
  selection?: 'none' | 'single' | 'multi';
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;

  // row interactions
  onRowFocus?: (row: Row) => void;
  onRowOpen?: (row: Row) => void;        // Enter or click
  drawer?: React.ReactNode;              // right-side drawer; presence implies "row opens drawer"
  rowDecorations?: (row: Row) => { leftBorder?: 'danger'|'warning'|'success'|'info' };

  // virtualization
  virtualizeAt?: number;                 // default 50

  // a11y
  caption: string;                       // required, can be visually hidden
  rowAriaLabel?: (row: Row) => string;   // optional richer SR label
};

type ColumnDef<Row> = {
  id: string;
  header: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  width?: number | 'auto' | `${number}fr`;
  render: (row: Row) => React.ReactNode;
  /** sr-only summary when the cell renders icon-only content */
  srOnly?: (row: Row) => string;
};
```

Sub-components: `DataTable.Skeleton`, `DataTable.Empty`, `DataTable.Error`, `DataTable.Filtered`, `DataTable.Pagination`, `DataTable.Toolbar` (the strip above the table that hosts tabs, filters, search).

## 3. Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Toolbar    [tab][tab][tab]                  [filter] [search ◀ /] [view ▾]    │
├───┬─────────────┬─────────────────┬──────┬──────┬──────────────┬──────────┬─────┤
│ ☐ │ Submitted ↓ │ Applicant       │ Tier │ Risk │ SLA          │ Assignee │  …  │  ← header (sticky)
├───┼─────────────┼─────────────────┼──────┼──────┼──────────────┼──────────┼─────┤
│ ☐ │ 4h 12m ago  │ Salem Al-Otaibi │ T2   │  82  │ ⏳ 48m       │ ouday    │  …  │
│ ☐ │ …                                                                            │
├───┴─────────────┴─────────────────┴──────┴──────┴──────────────┴──────────┴─────┤
│  Showing 1–25 of 187   [‹ Prev]   Page 1 of 8   [Next ›]   Rows per page: 25 ▾  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Row height tokens (set on `<DataTable density="...">`):

| Density   | Row height | Cell padding | Header height |
|-----------|------------|--------------|---------------|
| `compact` | 32px       | `--s-2` X    | 40px          |
| `default` | 40px       | `--s-3` X    | 44px          |
| `relaxed` | 48px       | `--s-4` X    | 48px          |

Default for admin is `default` (40px); finance recon and audit log use `compact` (32px).

## 4. States

| State                | Behavior                                                                      |
|----------------------|-------------------------------------------------------------------------------|
| `ready`              | Render rows. Empty rows array → render `<DataTable.Empty>`.                   |
| `loading`            | Render skeletons (default 8 rows). Toolbar stays interactive.                 |
| `error`              | Render `<DataTable.Error>` above body; preserves filter + selection.          |
| `empty`              | "No X yet" + one CTA defined by consumer.                                     |
| `filtered`           | "No results for these filters." + "Clear filters" inline link.                |
| `partial-permission` | Some cells render their `RedactedCell` fallback; consumer-controlled banner.  |
| `read-only`          | Rows non-interactive; drawer disabled; sort/filter/pagination still work.     |

## 5. Sorting

- Multi-sort not in MVP. Single column, ascending or descending.
- Sortable header is a `<button>` toggling `aria-sort`: `none → ascending → descending → none`.
- Sort state lives in URL (`?sort=submitted_at:desc`) so refresh restores it.
- Server returns rows already sorted; the component never re-sorts client-side.

## 6. Filtering

Filter chips live in `<DataTable.Toolbar>` and are independent components (`<FilterDropdown>`, `<FilterDateRange>`, `<FilterMulti>`) wired by the consumer. The table itself does no filter logic — it accepts whatever rows the consumer fetched. Filters serialize to URL query params (`?status=pending&country=SA,JO`).

## 7. Search

Search is a separate `<SearchInput>` placed in the toolbar. Behaviors:

- `/` focuses search from anywhere on the screen.
- 250ms debounce, 24-char min server-side; client does no client-side filtering.
- Stale-result banner if response > 1s.
- Empty term restores the unfiltered query.

## 8. Pagination

- Cursor-based only. No offset queries. `cursor` returned from the server is opaque.
- Page selector reads "Page N of M" purely for display — the underlying API uses cursors.
- "Rows per page" persists in `localStorage` per screen (`jeeb.table.<screen>.pageSize`).
- Prev disabled on first page; Next disabled when `hasNext=false`.

## 9. Selection

Disabled by MVP default. When opted in (`selection="multi"`):

- Header checkbox cycles `none → all-visible → none` (no "select all matching"; Phase 2).
- `Shift+click` selects a range within the current page.
- Selected count appears in the toolbar with a "Clear" button.
- Bulk action bar (Phase 2) renders above the table when count > 0.

## 10. Row interactions

| Action            | Mouse                  | Keyboard          | Notes                                            |
|-------------------|------------------------|-------------------|--------------------------------------------------|
| Focus next/prev   | hover                  | `j` / `k`         | Highlights row; scrolls into view.                |
| Open row          | row click              | `Enter`           | Calls `onRowOpen` — opens drawer or pushes route. |
| Open in new tab   | `Cmd/Ctrl+click`       | `Cmd/Ctrl+Enter`  | If consumer provides an `href` per row.           |
| Activate kebab    | `…` click              | `Shift+Enter`     | Opens row action menu.                            |
| Toggle selection  | checkbox / row click   | `Space`           | Only when selection enabled.                      |
| Sort column       | header click           | `Enter` on header | Toggles `aria-sort`.                              |
| Next/prev page    | pagination buttons     | `]` / `[`         |                                                  |
| Focus search      | search input           | `/`               |                                                  |

Drawer (when provided): slide-in 480px right panel; opens on row open if no `href` is supplied. `Esc` closes.

## 11. Virtualization

Rows > `virtualizeAt` (default 50) → window via `@tanstack/react-virtual`. Visible row count is computed from viewport height; scroll restores to first visible row on filter change.

Constraints:

- Sticky header survives virtualization.
- Row decorations (left border, hover) render via inline style on the rendered row only.
- No measure-then-paint; every row uses the same fixed height set via density.

## 12. Accessibility

- The component renders an actual `<table>` with `<thead>` and `<tbody>`. `<caption>` is the required `caption` prop (visually hidden by default).
- `aria-rowcount` on `<table>` is the server total; `aria-rowindex` on each `<tr>` is its server position.
- Each interactive header is a `<button>` with `aria-sort` set to `none | ascending | descending`.
- Row focus uses a 2px visible focus ring on `:focus-visible` AND `:focus` (do not gate on `:focus-visible` alone — keyboard-only users may not match it via `j/k`).
- Cells whose content is icon-only must supply `srOnly` so screen readers read the value.
- Drawer is `<dialog>` with focus trap; `Esc` closes; opener gets focus back.
- Live region announces page changes ("Showing 26 to 50 of 187") and search status ("3 results", "no results").

## 13. Performance

- 25 rows × 8 columns renders < 50ms p95 on a mid-range laptop (Vitest perf check).
- Sort/filter/pagination changes never re-mount the table; only rows + toolbar update.
- Drawer open does not re-render rows.
- No row-level event listeners attached individually; event delegation at `<tbody>` level.
- Skeleton renders within 1 frame of the first paint; never blocks on data.

## 14. Telemetry

The component does not emit telemetry directly. Consumers emit table-scoped events using the `useTableTelemetry()` hook the package exports, so we keep one canonical schema:

- `table.<screen>.viewed` { filter_hash, sort, page_size }
- `table.<screen>.sorted` { column, direction }
- `table.<screen>.paged` { dir, page }
- `table.<screen>.row_focused` { id, position, via: 'mouse'|'keyboard' }
- `table.<screen>.row_opened` { id, position, via }

## 15. Examples

KYC queue (see `wireframes/kyc-queue.md`) uses `density="default"`, drawer, row decorations on SLA-breach (`leftBorder: 'danger'`), and disables selection.

Audit log uses `density="compact"`, no drawer (routes to detail page), and includes a "Diff" cell with custom `srOnly`.

Refunds queue uses `density="default"`, no drawer (routes to detail), and column-bound filters in the toolbar.

## 16. Open questions

- **OQ-TBL-1**: Column resize — MVP fixes widths via tokens; ops asks for drag-to-resize. Cost is layout thrash + persistence per user. Defer to Phase 2.
- **OQ-TBL-2**: Column hide/show — same as above; Phase 2 candidate.
- **OQ-TBL-3**: Persistence of sort/filter in URL vs `localStorage` — URL wins for shareability, but some filters carry PII (a specific user_id). Decision: URL by default; flag PII-bearing filters as `private` to skip URL serialization.
