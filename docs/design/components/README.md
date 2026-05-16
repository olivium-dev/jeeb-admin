# Component library — Jeeb Admin

Source-of-truth specs for the components consumed by every `jeeb-admin` remote. All ship from a single Module Federation remote `shared-ui-lib` under the package alias `@jeeb/ui` so versions stay in lock-step. See `module-federation-shared-deps-pinning` for the singleton policy.

Owner: FE platform. Last updated 2026-05-15 (T-design-007).

## Scope

Four primitives that dominate admin work — everything else (chips, buttons, dropdowns, banners, toasts) is documented in the inline `@jeeb/ui` Storybook and is out-of-scope for the design pack itself.

| File          | Component family                                | Used by                              |
|---------------|-------------------------------------------------|--------------------------------------|
| `tables.md`   | `<DataTable>` + sort, filter, pagination, row drawer | every list screen                |
| `forms.md`    | `<Form>`, fields, async select, money, masked PII | every modal + detail-page form    |
| `modals.md`   | `<Modal>`, `<Drawer>`, `<DangerConfirm>`        | confirms, multi-step actions         |
| `charts.md`   | `<KpiCard>`, `<Sparkline>`, `<TrendChart>`, `<StackedArea>`, `<MapTileEmbed>` | dashboards |

## Foundational rules (apply to every component)

1. **Tokens only.** No raw hex or px in component source. Consume `@jeeb/ui/tokens` or CSS custom properties.
2. **Forwarded refs + native props.** Every interactive component forwards a ref and spreads `aria-*` / `data-*` props onto its underlying element.
3. **Controlled by default.** Components accept value + onChange; uncontrolled (`defaultValue`) is supported but not the documented path.
4. **Server-time agnostic.** Components render whatever you pass; date/number formatting happens in the consumer via `Intl.*`. The library exports tiny `format.money(amount, currency, locale)` and `format.relativeTime(ts, locale)` helpers — use them.
5. **RTL-safe.** No `left:` / `right:` in styles — use logical properties (`inline-start`, `inline-end`). Icons that have direction (back arrows, chevrons) flip via the `<Icon dir="auto">` wrapper.
6. **Reduced motion.** Every animation pulls duration from `--motion-*`; the tokens collapse to `0ms` under `prefers-reduced-motion: reduce`.
7. **Theming.** Light + dark themes are token-driven and switched via `<html data-theme="dark">`. Components must not branch on theme at runtime.

## States matrix

Every interactive component must define and ship Storybook stories for these states. CI gates the inventory (see `storybook-interaction-tests`).

| State        | Visual contract                                                                 |
|--------------|---------------------------------------------------------------------------------|
| `default`    | Resting style. No focus ring.                                                   |
| `hover`      | `--color-bg-hover` (or equivalent). Cursor where applicable.                    |
| `focus`      | 2px `--color-focus-ring` outline at 2px offset. Always visible (no `:focus-visible`-only). |
| `active`     | Pressed style; brand pressed token where applicable.                            |
| `disabled`   | 50% opacity, `cursor: not-allowed`, no hover/focus styles.                      |
| `loading`    | Inline spinner + accessible label; control non-interactive.                     |
| `error`      | Border `--color-status-danger`; help text in danger color with icon.            |
| `success`    | Border `--color-status-success`; help text optional.                            |
| `read-only`  | `--color-bg-surface-2` background; pointer events on labels only; no caret.     |
| `empty`      | Render canonical empty pattern (see "Empty states" below).                      |

## Empty / loading / error patterns

Per IA §4.4, every list-bearing component renders four canonical states. The library ships them as `<DataTable.Empty>`, `<DataTable.Skeleton>`, `<DataTable.Error>`, `<DataTable.Filtered>`. Consumers compose them from props (`status="loading" | "error" | "empty" | "filtered" | "ready"`) — there is no manual JSX path.

## Accessibility minima

All components meet WCAG 2.2 AA. Specifically:

- 4.5:1 contrast on text (3:1 on large/bold), 3:1 on non-text.
- Visible focus ring is non-negotiable on every interactive element.
- Status conveyed by icon + text, never color alone (see `tokens.md` §"Status tokens — usage matrix").
- All form fields have associated `<label>`s. Help and error text uses `aria-describedby`.
- Modals and drawers implement focus trap + restore + `Esc` close.
- Keyboard shortcuts documented per component; conflicting shortcuts surface in the `?` overlay.

## Performance minima

- No component imports a chart or map library at the top level — heavy deps lazy-loaded via `React.lazy` and a small fallback skeleton.
- `<DataTable>` virtualizes when rows > 50 using the org's stock `@tanstack/react-virtual` config.
- Re-render rules: every component memoizes children that depend only on stable props; row cells receive a stable key on `id`, never index.

## Testing minima

For each component:

- Storybook stories for each state.
- One Vitest + Testing Library test per state (per `vitest-component-test-architecture`).
- Visual-regression baseline via Chromatic (`ts-cicd-storybook-chromatic-publish`).
- For inputs: at least one fast-check property test ensuring `format → parse → format` is stable.

## Versioning

`@jeeb/ui` follows semver (`semver-discipline`). Breaking changes ship in a major; remotes pin the major. CI's MFE workflow refuses to deploy a remote whose pinned `@jeeb/ui` major is older than the shell's.

## Index

- [Tables](./tables.md) — `<DataTable>`, sort/filter/pagination, row drawer, virtualization
- [Forms](./forms.md) — `<Form>`, fields, async selects, money input, masked PII
- [Modals](./modals.md) — `<Modal>`, `<Drawer>`, `<DangerConfirm>`
- [Charts](./charts.md) — `<KpiCard>`, `<Sparkline>`, `<TrendChart>`, `<StackedArea>`, `<MapTileEmbed>`
