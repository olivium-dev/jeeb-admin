# Jeeb Admin — Design Pack

Source-of-truth wireframes, component specs, and design tokens for the Jeeb admin panel (`jeeb-admin`, React 19 + Vite + Module Federation).

Owner: Design + FE (T-design-007). Last updated 2026-05-15.

## Scope

Covers C15 (Admin Panel) and the admin-facing portions of C2 (KYC), C18 (Disputes), C19 (Operations), and C16 (Finance / Wallet ops) from the requirements pack.

## Layout

```
docs/design/
├── README.md                       # this file — entry point
├── information-architecture.md     # global nav, route map, RBAC matrix
├── tokens.md                       # colors, type, spacing, radii, motion, breakpoints
├── tokens-omds-parity.md           # cross-platform parity audit (admin ↔ omds-flutter ↔ jeeb-mobile)
├── wireframes/
│   ├── kyc-queue.md
│   ├── kyc-document-viewer.md
│   ├── dispute-detail.md
│   ├── finance-dashboard.md
│   ├── operations-dashboard.md
│   ├── operations-map.md
│   └── user-management.md
└── components/
    ├── README.md                   # component index + states matrix
    ├── tables.md
    ├── forms.md
    ├── modals.md
    └── charts.md
```

## Design principles

1. **Web design-system parity.** Tokens mirror OMDS (used by `jeeb-mobile`) so the admin and the mobile app feel like one product. Where the web needs extras (data-dense tables, long forms, map overlays), we extend tokens; we never redefine them. **The current `tokens.md` brand color is provisional — see [`tokens-omds-parity.md`](./tokens-omds-parity.md) for the canonical mapping to `omds-flutter` and the migration plan.**
2. **Density over decoration.** Admin users live in tables and queues 6+ hours/day. Tighter row heights (40px default), high information density, no decorative imagery.
3. **Keyboard-first.** Every primary action has a shortcut. Tables support j/k row nav, `/` for search, `?` for shortcut overlay.
4. **Reversible by default.** Destructive actions (suspend, reject KYC, refund) require a typed confirmation and emit an undo toast for 10s where reversible. Audit log is mandatory (NFR-7.4).
5. **Accessible.** WCAG 2.2 AA. 4.5:1 text contrast, 3:1 non-text. All interactive elements reachable by keyboard with visible focus ring. Status conveyed by icon + text, never color alone.
6. **Bilingual / RTL.** All layouts must mirror cleanly for Arabic (Jeeb is launching in MENA). No left/right hard-coding in components.

## Module Federation map

Each admin domain ships as a remote and is composed by `jeeb-admin-shell`:

| Remote                    | Routes                          | Owner agent / squad         |
|---------------------------|---------------------------------|-----------------------------|
| `jeeb-admin-shell`        | `/login`, `/`, top nav          | FE platform                 |
| `jeeb-admin-kyc`          | `/kyc/*`                        | Trust & Safety              |
| `jeeb-admin-disputes`     | `/disputes/*`                   | Trust & Safety              |
| `jeeb-admin-finance`      | `/finance/*`                    | Payments / Finance          |
| `jeeb-admin-operations`   | `/ops/*`, `/ops/map`            | Operations                  |
| `jeeb-admin-users`        | `/users/*`                      | Trust & Safety              |

The shell owns auth, layout chrome, and the shared component library (`shared-ui-lib` remote). All remotes pin the same `react`, `react-dom`, and `@jeeb/ui` versions to avoid dual-runtime bugs (see `module-federation-shared-deps-pinning`).

## Out of scope for MVP

- Bulk actions across multiple selected rows (deferred to Phase 2)
- Saved views / custom dashboards
- Custom report builder (finance uses fixed reports for MVP)
- Multi-language admin UI — admin is English-only for MVP; Arabic launches with consumer surfaces in Phase 2

## How to read a wireframe doc

Each wireframe doc contains:
- **Intent** — the job the screen does
- **Entry points** — where the user arrives from
- **Layout** — ASCII frame at desktop ≥1280px (default density)
- **States** — empty, loading, error, partial-permission
- **Interactions** — primary, secondary, keyboard shortcuts
- **Data contracts** — the backend endpoints that feed the screen (NSwag clients via `jeeb-gateway`)
- **Accessibility notes** — focus order, landmarks, announcements
- **Open questions** — flagged for product / engineering

## Implementation handoff checklist

- [ ] Tokens consumed via `@jeeb/ui` only; never inline hex/px values
- [ ] All forms wrapped in `<Form>` with Zod schema; submit blocked until valid
- [ ] All tables use `<DataTable>` from `shared-ui-lib`; never raw `<table>`
- [ ] All destructive confirms use `<DangerConfirm>` (typed-name pattern)
- [ ] All routes guarded by `<RequireRole roles={...}>` per RBAC matrix
- [ ] Every admin mutation logged to `audit-service` (NFR-7.4)
