# Wireframe — Operations Map

**Route:** `/ops/map` · **Remote:** `jeeb-admin-operations` · **Role:** `ops.viewer`+
**Backends:** `geolocation-service` (tiles + GPS streams), `matching`, `delivery-service`, `offer-service`, `score-taking-service` (anomaly clusters)

## 1. Intent

A live geospatial view of supply, demand, and incidents. Operators use this to:

- Spot supply/demand imbalances (heatmap mismatch).
- Locate a specific driver or active job (search + jump).
- Investigate clustered incidents (geofence breaches, anomaly rings).
- Issue zonal actions: open a surge zone, broadcast to drivers in a polygon (Phase 2 → MVP read-only).

Map is the only screen that is performance-bound by the device; we cap render at 5,000 markers and gracefully degrade beyond that.

## 2. Entry points

- Ops dashboard "Map ▸" button.
- Dispute detail → "View on map".
- Incident notification deep-link with a zoom-to-bounds query.

## 3. Layout (fluid, full-bleed)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◀ Operations    Region [Riyadh ▾]   Live ●   Layers ▾   ☰ 2,184 drivers · 428 rides · 18 incidents│
├─────────┬───────────────────────────────────────────────────────────────────────────────────────┤
│ FILTERS │                                                                                       │
│         │                                                                                       │
│ Layers  │                                                                                       │
│  ☑ Drv  │                                                                                       │
│   2,184 │             ╭───────────────╮                                                          │
│  ☑ Cou  │             │               │                                                          │
│    612  │             │  MAP CANVAS   │      ←  WebGL tiles via geolocation-service              │
│  ☑ Riders│             │               │                                                          │
│ 12,801  │             │               │                                                          │
│  ☑ Active│             ╰───────────────╯                                                          │
│   jobs  │                                                                                       │
│    657  │      🔵 driver marker (idle)   🟢 driver (en route to pickup)                          │
│  ☑ Surge│      🔴 incident pin            ▴ heatmap (demand)                                      │
│   zones │                                                                                       │
│  ☐ Heat │                                                                                       │
│   demand│                                                                                       │
│  ☐ Heat │                                                                                       │
│   supply│                                                                                       │
│         │                                                                                       │
│ Status  │     [+] zoom in                                                                       │
│  ☑ Online│     [−] zoom out                                                                      │
│  ☑ Busy │     [⌖] center on me                                                                   │
│  ☐ Offl │                                                                                       │
│         │                                                                                       │
│ Time    │                                                                                       │
│  Now    │                                                                                       │
│  [Replay│                                                                                       │
│   30m ▾]│                                                                                       │
│         │                                                                                       │
│ Search  │                                                                                       │
│  🔍 [_] │   ┌─────────────────────────────────────┐                                              │
│         │   │  selected: driver_8a31c2            │   ← detail card (anchored bottom-left when   │
│         │   │  Salem A. · Lvl 5 · ★4.9            │     a marker is clicked)                     │
│         │   │  Status: en route to pickup         │                                              │
│         │   │  ETA: 3m 12s · accuracy ±18m        │                                              │
│         │   │  Job: ride_77a91 (Lina H.)          │                                              │
│         │   │  Battery: 64% · last ping 4s ago    │                                              │
│         │   │  [Open profile] [Open job] [Pin]    │                                              │
│         │   └─────────────────────────────────────┘                                              │
└─────────┴───────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Left sidebar

220px fixed:

- **Layers** — toggle visibility of driver, courier, rider, active-job markers, surge zones, heatmaps. Counts update live. Heatmaps are mutually exclusive (demand or supply, never both).
- **Status** — filter drivers/couriers by status (Online, Busy, Offline). Default: Online + Busy.
- **Time** — "Now" or "Replay last 30 min" (playback control 0.5× / 1× / 2× / 4×). Replay disables certain actions (broadcast).
- **Search** — by user id, job id, IBAN-tail (drivers), license plate, geohash, address. Submits to `geolocation-service` lookup; results jump map + select.

### 3.2 Map canvas

- WebGL via the org's chosen vector renderer (TBD — MapLibre GL preferred for self-hostable tiles).
- Tiles served from `geolocation-service` behind Cloudflare. Style tokens (palette) match the design tokens; uses muted gray base so colored markers and heat layers pop.
- Marker clustering above 1,000 markers per viewport at zoom < 13; click on cluster zooms in two levels.
- Heat layer uses `--color-status-success` for supply and `--color-status-warning` for demand; mismatch zones (high demand + low supply) shown as `--color-status-danger`.

### 3.3 Detail card

Bottom-left, draggable. Persists on map pan; closes on `Esc` or `×`. Anchored differently per entity:

- **Driver**: name, level, rating, status, current job, ETA, accuracy, battery, last ping age, actions.
- **Job**: kind, parties (masked), status, pickup/drop, current GPS position with route overlay.
- **Incident**: severity, opened at, kind, impacted users (count), runbook link.

### 3.4 Top-right controls

- **Region** selector (cascades from the prior screen).
- **Live ●** indicator — same semantics as ops dashboard.
- **Layers ▾** — quick toggle without opening sidebar.
- **Stats strip** — counts of visible-in-viewport entities.

## 4. States

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Loading tiles               | Base tiles fetch first; markers stream in as SSE messages arrive.              |
| GPS stream stalled          | Affected markers fade to 50% opacity after 30s; tooltip says "last ping Xs".   |
| Over marker cap (> 5,000)   | Banner: "Showing 5,000 of 12,801 — narrow filters or zoom in."                 |
| WebGL unsupported           | Falls back to canvas raster tiles, no heatmap; banner explains degraded mode.  |
| Replay active               | Sidebar locked to time controls; broadcast actions disabled; banner reminds.   |
| Read-only role lacks ops    | 403.                                                                            |

## 5. Interactions

| Action                       | Mouse              | Keyboard         | Notes                                  |
|------------------------------|--------------------|------------------|----------------------------------------|
| Pan                          | drag               | arrow keys       |                                        |
| Zoom                         | wheel / +,−        | `+` / `-`        |                                        |
| Toggle layer                 | sidebar checkbox   | `Shift+1..6`     | 1=Drivers 2=Couriers 3=Riders 4=Jobs 5=Surge 6=Heat |
| Heat demand / supply / off   | radio              | `h`              | Cycles.                                 |
| Search                       | search box         | `/`              |                                        |
| Select marker                | marker click       | `Tab` / `Enter`  |                                        |
| Close detail card            | × / Esc            | `Esc`            |                                        |
| Center on selected           | "Center" button    | `c`              |                                        |
| Toggle replay                | Time control       | `t`              |                                        |
| Switch region                | dropdown           | `Shift+R`        |                                        |

## 6. Data contracts

```
GET  /v1/admin/ops/map/bootstrap?region=riyadh
→ 200 { tile_token, sse_token, layers: { drivers:true, couriers:true, … } }

GET  /v1/admin/ops/map/stream?region=riyadh&bounds=<bbox>&zoom=<z>  (SSE)
→ messages: {
    { kind: "marker.upsert", entity:"driver", id, lat, lng, status, heading, last_ping_at, job_id? },
    { kind: "marker.remove", entity:"driver", id },
    { kind: "heat.frame", layer:"demand"|"supply", grid:<binary> },
    { kind: "incident", id, severity, lat, lng, … }
  }

GET  /v1/admin/ops/map/entity/:kind/:id
GET  /v1/admin/ops/map/replay?from=<iso>&to=<iso>&region=riyadh
```

Bounds-aware streaming: only entities inside (viewport + 25% buffer) are streamed. Updates filter server-side.

## 7. Accessibility

- The map is **not** a primary work surface for screen readers — every action available via the map must be reachable via a list view (`/ops/drivers`, `/ops/jobs`, `/ops/incidents`). Banner on the map "View as list ▸" links to those.
- Marker counts in the header are announced as a live region every 30s when delta > 10%.
- Detail card is a `<dialog>` (non-modal) with proper labels; focus moves to it on selection.
- Color is never the only signal — markers also have shape (filled = busy, outline = idle, ▲ = incident).

## 8. Performance budget

- Initial paint with tiles + 500 markers ≤ 2s on a mid-range laptop.
- Marker upsert handles 60Hz (~50 ops/frame) without dropped frames; uses a single instanced WebGL layer.
- Heat frames sent as small binary grids (≤ 16KB); decoded on a Web Worker.
- SSE backpressure: client acks every 1s; server drops stale events older than 2s.

## 9. Telemetry

- `ops.map.viewed` { region, zoom_initial }
- `ops.map.layer_toggled` { layer, on }
- `ops.map.replay_used` { duration_s, speed }
- `ops.map.marker_selected` { entity, id }

## 10. Open questions

- **OQ-MAP-1**: Tile provider — self-host MapLibre with OpenMapTiles, or use Mapbox? Self-host saves cost; Mapbox saves engineering.
- **OQ-MAP-2**: Replay window — 30 min default vs 2h? Ops users disagree; 2h costs more tile + GPS bandwidth.
- **OQ-MAP-3**: Broadcast-to-drivers-in-polygon — MVP cuts this; planned Phase 2. Confirm legal allows mass driver push.
- **OQ-MAP-4**: Should the map cache the last viewport per user across sessions? Likely yes; small localStorage entry.
