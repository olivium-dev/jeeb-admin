# Component — Charts

Dashboards eat real estate; misused charts eat reviewer attention. This file locks the chart primitives, the data contract, and the do/don't list. The set is intentionally small.

Package: `@jeeb/ui` → `import { KpiCard, Sparkline, TrendChart, StackedArea, MapTileEmbed } from '@jeeb/ui/charts'`.

## 1. Intent

Five primitives cover every admin chart need in MVP:

1. **`<KpiCard>`** — single big number with delta + sparkline.
2. **`<Sparkline>`** — tiny inline trend used inside cards, table cells, queue rows.
3. **`<TrendChart>`** — single-series time-series, larger, axes visible.
4. **`<StackedArea>`** — multi-series volume over time (Finance overview, Ops time-to-match trend).
5. **`<MapTileEmbed>`** — read-only static map embed for context (dispute detail mini-map, ops dashboard summary card). The full live map is its own wireframe (`operations-map.md`), not a chart.

Everything else (pies, donuts, gauges, radar, bubble, treemap) is **banned** in admin for MVP. If a number can be answered by a row in a table, render the table.

## 2. Library and rendering

- Canvas rendering by default (no per-data-point DOM nodes) using a thin wrapper over Apache ECharts in canvas mode. Wrapper exposes only the props below — never the raw ECharts option. CI lint blocks importing the underlying library directly outside the wrapper.
- SVG path used only for `<Sparkline>` because it's small (≤ 96 px wide) and SVG is cheaper there.
- Map tile embed uses MapLibre GL in static-no-interaction mode.

## 3. `<KpiCard>`

### 3.1 API

```tsx
<KpiCard
  title="GMV today"
  value={184_392}
  format={{ kind: 'money', currency: 'SAR' }}
  delta={{ pct: 12, direction: 'up', goodDirection: 'up' }}
  comparison="vs yesterday"
  trend={[/* 24 hourly values */]}
  href="/finance/transactions?period=today"
  status="ready"
/>
```

### 3.2 Layout

```
┌────────────────────────────┐
│ GMV today                  │  ← title (--text-xs, --color-text-secondary)
│  184,392 SAR               │  ← value (--text-2xl, tabular-nums)
│ ▲ 12% vs yesterday         │  ← delta (success/danger color)
│ ─sparkline────             │  ← 60px × 24px sparkline
└────────────────────────────┘
```

Card: 240px × 120px default; padding `--s-4`; bg `--color-bg-surface`; border `--color-border-subtle`; radius `--radius-md`.

### 3.3 Format options

| Kind     | Behavior                                                                |
|----------|-------------------------------------------------------------------------|
| `money`  | Locale-aware thousand separators + currency suffix (RTL-isolated `<bdo>`). |
| `int`    | Locale-aware thousand separators.                                       |
| `pct`    | Two decimals max; trailing zeros stripped.                              |
| `rate`   | Renders e.g. `0.21%`.                                                   |
| `duration_ms` | `28s`, `1m 42s`, `1h 8m`.                                          |
| `compact`| `1.2k`, `184k`, `1.8M` (only when ≥ 10k).                                |

### 3.4 Delta

`direction` is `up` | `down` | `flat`. `goodDirection` says which direction is colored success vs danger. Examples:

| KPI                | goodDirection |
|--------------------|---------------|
| GMV, net revenue   | up            |
| Refund rate        | down          |
| Chargeback rate    | down          |
| Avg ticket         | up            |
| Time-to-match      | down          |
| Fill rate          | up            |
| Abandonment        | down          |
| ETA accuracy       | up            |

Delta on `direction: 'flat'` renders the dash glyph in neutral color regardless of `goodDirection`.

### 3.5 States

| State    | Behavior                                                                     |
|----------|------------------------------------------------------------------------------|
| `loading`| Skeleton bars for value, delta, sparkline.                                   |
| `error`  | Card shows "—" and a small "Retry" link; preserves slot in layout.            |
| `stale`  | Subtle "Data delayed · 14:00" badge in `--color-text-tertiary`.               |
| `ready`  | Renders.                                                                      |

### 3.6 Accessibility

- Whole card is a single focusable `<a href>` when `href` is provided, else `<div>` (non-focusable). Avoid focusable-but-no-href cards.
- Order of accessible text: title → value (with unit) → delta → trend summary.
- Sparkline `aria-hidden="true"`; the trend is summarized to screen readers as `<sr-only>` text: "Trend over last 24 hours: up 5 percent overall."
- Color is never the only delta signal — `▲` / `▼` / `─` glyphs included.

## 4. `<Sparkline>`

### 4.1 API

```tsx
<Sparkline
  data={[12, 11, 13, 18, 22, 25, 19, 17, ...]}
  width={60}
  height={24}
  stroke="--color-text-primary"  // override only in special contexts
  fill="--color-bg-surface-2"    // optional area under the line
/>
```

### 4.2 Rules

- No axis. No ticks. No legend. No tooltip.
- Single series. Mixed positive/negative not supported — bake the baseline into the data.
- Stroke 1.5px; uses `currentColor` by default so the sparkline inherits the surrounding text color.
- `aria-hidden="true"` always — sparklines are decorative; the numeric story lives next to them.

## 5. `<TrendChart>`

### 5.1 API

```tsx
<TrendChart
  series={{
    name: 'Time-to-match (p50)',
    points: [{ at: '2026-05-15T13:00', value: 28 }, ...]
  }}
  yFormat={{ kind: 'duration_ms' }}
  xWindow="1h"        // also '24h', '7d', 'custom'
  showCrosshair
  threshold={{ value: 60, label: 'SLO p50', kind: 'warning' }}
  status="ready"
/>
```

### 5.2 Layout

```
  ms │
 200 │                        ╭╮
     │                      ╭╯ ╰╮
     │       ╭───╮       ╭──╯   ╰─
  60 │·······╯·····╰─────╯······╌╌╌  ← dashed warning threshold line
     │  ╭────╯      ╰╮
     │──╯            ╰
   0 └─────────────────────────────────
     13:00      13:15      13:30
```

- Single-series. Multi-series → use `<StackedArea>` instead.
- Y-axis labels minimal (4 ticks max), aligned right, tabular-nums.
- X-axis labels minimal (3–5 ticks), localized; full timestamps in tooltip.
- Optional threshold line (success / warning / danger). The line is dashed; the label sits at the right edge.
- Tooltip on hover; click-to-pin not in MVP.

### 5.3 States

Same as `<KpiCard>` plus:

- `empty` — "No data for this window." with a soft skeleton showing axes.

### 5.4 Accessibility

- `<TrendChart>` exposes a "View as table" toggle (also reachable with `t` while focused on the chart) that swaps the canvas for an HTML table with the underlying points. Required by IA §4.4 and the operations-dashboard wireframe.
- Canvas has `role="img"` and an `aria-label` summarizing the series ("Time-to-match p50 over last hour, ranging 24 to 78 seconds, mean 39 seconds").

## 6. `<StackedArea>`

### 6.1 API

```tsx
<StackedArea
  series={[
    { name: 'Rides',      points: [...] },
    { name: 'Deliveries', points: [...] },
    { name: 'Contracts',  points: [...] },
    { name: 'Wallet top-up', points: [...] },
  ]}
  yFormat={{ kind: 'money', currency: 'SAR' }}
  xWindow="24h"
  showCrosshair
  status="ready"
/>
```

### 6.2 Rules

- Series ordered top-to-bottom matches legend order (left-to-right, top legend strip).
- Maximum 6 series. More than 6 → split into multiple charts or group at the data layer.
- Colors come from `--color-chart-1` through `--color-chart-6`, defined in tokens. Never assign colors per series in consumer code.
- Crosshair shows the full breakdown on hover, vertical line, single tooltip card.
- Empty / loading / error / stale match `<TrendChart>`.

### 6.3 Accessibility

- Same "View as table" affordance as `<TrendChart>`.
- Legend uses icon shape + color + text (no color-only conveyance).

## 7. `<MapTileEmbed>`

### 7.1 Intent

A static, read-only map snippet for context — dispute detail mini-map, ops dashboard "last known incident" widget, KYC "GPS at capture" pin. Not interactive; if the user needs to interact, link them to `/ops/map`.

### 7.2 API

```tsx
<MapTileEmbed
  center={{ lat: 24.7136, lng: 46.6753 }}
  zoom={13}
  width={400}
  height={240}
  markers={[
    { lat: 24.7136, lng: 46.6753, kind: 'pickup', label: 'Pickup 22:14' },
    { lat: 24.7401, lng: 46.6920, kind: 'drop',   label: 'Drop 22:52' },
  ]}
  routePolyline="encoded_polyline_string"
  fallbackHref="/ops/map?lat=24.7136&lng=46.6753&zoom=14"
/>
```

### 7.3 Rules

- Tiles come from `geolocation-service` (same provider as the live map — see `operations-map.md` for tile policy).
- No pan, no zoom, no tooltip. Click anywhere navigates to `fallbackHref`.
- Polyline rendered with a 3px stroke in `--color-brand-primary`; markers use the same pin set as the live map.
- Maximum 50 markers; over that, route polyline only.
- Map opens to dark or light tile palette matching the theme.

### 7.4 States

| State              | Behavior                                                          |
|--------------------|-------------------------------------------------------------------|
| `loading`          | Gray tile placeholder + skeleton pin.                             |
| `tiles_unavailable`| Render fallback static image with "Open in map ▸" link.           |
| `webgl_unsupported`| Fall back to raster tiles (no polyline curvature smoothing).      |

### 7.5 Accessibility

- Map embed is wrapped in `<a href={fallbackHref} aria-label="...">` with a description summarizing the points ("Pickup at 24.71 N 46.68 E, drop at 24.74 N 46.69 E, route 12.4 km").
- Always paired with a textual list of stops elsewhere on the page (per dispute / ops list policy). The map is never the only way to read the data.

## 8. Data contract

All chart primitives accept arrays of `{ at: ISO8601, value: number }` for time series, or scalar arrays for sparklines. The shapes match what `jeeb-gateway` returns from each aggregator endpoint (see each wireframe's "Data contracts" section). No client-side aggregation — if a screen needs sums or rolling averages, the BFF returns them pre-baked.

## 9. Tokens

Chart-specific tokens (added to `tokens.md` companion section):

| Token              | Light value | Usage                                  |
|--------------------|-------------|----------------------------------------|
| `--color-chart-1`  | `#1E5EFF`   | First series (brand-aligned)           |
| `--color-chart-2`  | `#0E9F6E`   | Second series                          |
| `--color-chart-3`  | `#D97706`   | Third                                  |
| `--color-chart-4`  | `#7C3AED`   | Fourth                                 |
| `--color-chart-5`  | `#0EA5E9`   | Fifth                                  |
| `--color-chart-6`  | `#DC2626`   | Sixth (reserve for "alert" series)     |
| `--color-axis`     | `#9CA3AF`   | Axis lines, ticks                      |
| `--color-grid`     | `#E5E7EB`   | Gridlines (use sparingly)              |
| `--color-threshold-warning` | `#D97706` | Threshold line (dashed)         |
| `--color-threshold-danger`  | `#DC2626` | Threshold line (dashed)         |
| `--color-tooltip-bg`        | `#111827` | Tooltip background              |
| `--color-tooltip-text`      | `#FFFFFF` | Tooltip text                    |

Dark theme variants exist for all of the above.

## 10. Performance

- Canvas size capped at the chart wrapper's measured CSS size × DPR; no over-rendering.
- Re-render only on data change; hover crosshair updates use a separate top-layer canvas so the data layer doesn't repaint.
- ECharts wrapper imports lazily — total chart bundle is loaded only when a chart first renders on the page. Each remote ships its own copy at the singleton-pinned version.
- Sparklines render synchronously in < 5ms per card.
- Map tile embed prefetches tiles for the bbox at idle if `Idle` callback is available.

## 11. Accessibility checklist (every chart)

- [ ] `role="img"` on the canvas root with a complete `aria-label`.
- [ ] "View as table" toggle reachable by keyboard.
- [ ] Status conveyed by shape + color + text in legends and threshold labels.
- [ ] No tooltip is the only way to read a value — every value is reachable by tab through the table view.
- [ ] `prefers-reduced-motion` disables enter animations.
- [ ] High-contrast and dark themes tested.

## 12. Telemetry

- `chart.<screen>.<kind>.viewed` { has_data, series_count }
- `chart.<screen>.<kind>.toggled_table` { open: bool }
- `chart.<screen>.<kind>.threshold_crossed` { label, value } (for time-series with a threshold)
- `map.embed.<screen>.opened_full` { has_route, markers_count }

## 13. Examples by screen

| Screen                     | Charts used                                                       |
|----------------------------|-------------------------------------------------------------------|
| Finance overview           | 5× `<KpiCard>`, 1× `<StackedArea>` volume, mini `<Sparkline>` in each card |
| Operations dashboard       | 9× `<KpiCard>`, inline trend mini-charts (`<Sparkline>`)          |
| Operations dashboard "incident pin" widget | `<MapTileEmbed>` (small)                           |
| Dispute detail             | `<MapTileEmbed>` for route                                        |
| Audit log header           | `<TrendChart>` actions/hour for the entity                        |
| KYC queue header           | None — counts only                                                |

## 14. Open questions

- **OQ-CHT-1**: Should KPI cards link to a deep page (current) or open a `<TrendChart>` in a modal? Modal saves a route hop; deep page wins for shareable URLs. Decision: deep page, modal in Phase 2 for power users.
- **OQ-CHT-2**: Multi-series threshold lines — `<TrendChart>` supports one; some KPIs want two (warn + danger). Defer to Phase 2; not required for MVP.
- **OQ-CHT-3**: Real-time animation — should the StackedArea smoothly animate as new data points arrive over SSE? Decision: no; abrupt redraw is more honest and cheaper. Re-evaluate after operator feedback.
- **OQ-CHT-4**: Dark-mode chart palette — current tokens are tuned for light; dark needs separate tuning to retain contrast. Open follow-up ticket.
