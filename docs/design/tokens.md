# Design tokens — Jeeb Admin

Tokens are the contract between design and code. They mirror the mobile OMDS palette so admin and mobile look like one product; web-specific extensions are clearly labelled.

> ⚠️ **Parity note (T-design-007 follow-up).** The brand and status values below were drafted in isolation and diverge from the canonical `omds-flutter` + `jeeb-mobile` palette (specifically `--color-brand-primary = #1E5EFF` here vs the Jeeb seed `#1B6B4E` in `jeeb-mobile/lib/core/theme/app_theme.dart`). The canonical mapping and migration plan live in [`tokens-omds-parity.md`](./tokens-omds-parity.md). Treat that doc as authoritative for any new component work; this file will be updated when the migration lands.

All values exposed as CSS custom properties under `:root` and consumed in JS via `@jeeb/ui/tokens`. Tailwind config reads from the same source — no hard-coded hex/px values in component code.

## Color — semantic roles

Roles, not raw names. Always use the role (`--color-text-primary`), never the swatch (`--color-gray-900`).

### Light theme (default)

| Role                       | Light value | Usage                                                |
|----------------------------|-------------|------------------------------------------------------|
| `--color-bg-canvas`        | `#FAFAFB`   | App background                                       |
| `--color-bg-surface`       | `#FFFFFF`   | Cards, tables, modals                                |
| `--color-bg-surface-2`     | `#F4F4F6`   | Nested surfaces, table header                        |
| `--color-bg-hover`         | `#F0F1F4`   | Row / button hover                                   |
| `--color-bg-selected`      | `#E6F0FF`   | Selected row                                         |
| `--color-border-subtle`    | `#E5E7EB`   | Default borders, dividers                            |
| `--color-border-strong`    | `#D1D5DB`   | Inputs, button outline                               |
| `--color-text-primary`     | `#111827`   | Body text                                            |
| `--color-text-secondary`   | `#4B5563`   | Labels, metadata                                     |
| `--color-text-tertiary`    | `#6B7280`   | Placeholder, captions                                |
| `--color-text-inverse`     | `#FFFFFF`   | Text on filled buttons / dark surfaces               |
| `--color-brand-primary`    | `#1E5EFF`   | Primary action (Jeeb blue)                           |
| `--color-brand-hover`      | `#1A52E0`   | Hover                                                |
| `--color-brand-pressed`    | `#1645BD`   | Active / pressed                                     |
| `--color-status-success`   | `#0E9F6E`   | Approved, paid, online                               |
| `--color-status-warning`   | `#D97706`   | Pending, review, late                                |
| `--color-status-danger`    | `#DC2626`   | Rejected, suspended, dispute                         |
| `--color-status-info`      | `#2563EB`   | Informational                                        |
| `--color-status-neutral`   | `#6B7280`   | Draft, archived                                      |
| `--color-focus-ring`       | `#1E5EFF`   | 2px outline, offset 2px                              |

### Dark theme

Same roles, computed for dark. Toggle via `<html data-theme="dark">`.

## Type

System stack: `Inter, "SF Pro Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Arabic stack: `"IBM Plex Sans Arabic", Inter, system-ui` (loaded only when `lang="ar"`).

| Token            | Size / line-height | Weight | Usage                            |
|------------------|--------------------|--------|----------------------------------|
| `--text-xs`      | 12 / 16            | 500    | Table chips, captions            |
| `--text-sm`      | 13 / 20            | 400    | Body in tables, secondary text   |
| `--text-md`      | 14 / 20            | 400    | Default body, form labels        |
| `--text-lg`      | 16 / 24            | 500    | Section titles                   |
| `--text-xl`      | 20 / 28            | 600    | Page titles                      |
| `--text-2xl`     | 24 / 32            | 600    | Dashboard KPIs                   |
| `--text-display` | 32 / 40            | 700    | KPI hero (used sparingly)        |

Numeric/tabular content uses `font-variant-numeric: tabular-nums` so amounts align in tables.

## Spacing

4-pt grid. Use tokens — never raw px.

| Token  | px  | Usage                       |
|--------|-----|-----------------------------|
| `--s-0` | 0  | —                           |
| `--s-1` | 4  | Icon-to-text gap            |
| `--s-2` | 8  | Tight padding               |
| `--s-3` | 12 | Form field padding          |
| `--s-4` | 16 | Card padding, section gap   |
| `--s-5` | 24 | Card-to-card gap            |
| `--s-6` | 32 | Major section gap           |
| `--s-7` | 48 | Page top padding            |
| `--s-8` | 64 | Reserved for empty states   |

## Radii

| Token        | px | Usage                                  |
|--------------|----|----------------------------------------|
| `--radius-sm`| 4  | Inputs, chips                          |
| `--radius-md`| 8  | Cards, buttons                         |
| `--radius-lg`| 12 | Modals, popovers                       |
| `--radius-pill`| 999| Status pills                          |

## Elevation

| Token       | Shadow                                                  | Usage              |
|-------------|---------------------------------------------------------|--------------------|
| `--elev-0`  | none                                                    | Inline             |
| `--elev-1`  | `0 1px 2px rgb(0 0 0 / 0.04)`                           | Cards              |
| `--elev-2`  | `0 4px 12px rgb(0 0 0 / 0.06)`                          | Popovers, dropdown |
| `--elev-3`  | `0 12px 32px rgb(0 0 0 / 0.10)`                         | Modals, drawer     |

## Motion

| Token              | Value          | Usage                          |
|--------------------|----------------|--------------------------------|
| `--motion-fast`    | 120ms ease-out | Hover, tap                     |
| `--motion-default` | 200ms ease-out | Open/close, expand             |
| `--motion-slow`    | 320ms ease-out | Drawer slide, dialog enter     |

All motion respects `prefers-reduced-motion: reduce` — durations collapse to 0ms.

## Breakpoints

Admin is desktop-first. We support down to 1024px (laptop). Below 1024 we render a "Use a larger screen" notice — admin is not a mobile surface.

| Token         | min-width |
|---------------|-----------|
| `--bp-lg`     | 1024px    |
| `--bp-xl`     | 1280px    |
| `--bp-2xl`    | 1536px    |

Default design target: **1440 × 900**.

## Layout grid

- 12-column grid, 24px gutters, max content width 1440px centered with 32px side padding
- Page header: 64px fixed at top
- Left nav: 240px expanded / 56px collapsed
- Right detail panel (when used): 480px

## Status tokens — usage matrix

| State          | Color          | Icon                       | Pill background |
|----------------|----------------|----------------------------|-----------------|
| Approved       | success        | check-circle               | success @ 12%   |
| Pending review | warning        | clock                      | warning @ 12%   |
| Rejected       | danger         | x-circle                   | danger @ 12%    |
| Suspended      | danger         | shield-off                 | danger @ 12%    |
| Online         | success        | dot (filled)               | none            |
| Offline        | neutral        | dot (outline)              | none            |
| In dispute     | warning        | alert-triangle             | warning @ 12%   |
| Refunded       | info           | rotate-ccw                 | info @ 12%      |

## Iconography

`lucide-react` 0.460+, 20px default, 16px in dense rows, 24px in section headers. Stroke 1.5. Never decorative — every icon paired with text or `aria-label`.
