# Wireframe — Operations Dashboard

**Route:** `/ops` · **Remote:** `jeeb-admin-operations` · **Role:** `ops.viewer`+
**Backends:** `matching` (queue depth, fill rate, ETA), `delivery-service` / `offer-service` (active jobs), `notification-service` (alerts), `realtime-comunication-service` (call SLA), `score-taking-service` (fraud), `geolocation-service`

## 1. Intent

Real-time health of the platform from an operator's seat. Three questions every glance:

1. **Is matching healthy?** Time-to-match, abandonment, supply/demand.
2. **Are SLAs being met?** KYC SLA, dispute SLA, support SLA.
3. **What's happening right now?** Live incidents, anomalies, on-call status.

Updates push via SSE every 5–15s. Auto-refresh visibly indicated (small pulsing dot in the page header).

## 2. Entry points

- Top nav "Operations".
- Slack alert deep-links (incident pages route to specific widget anchors).
- Mobile push-to-pager (operations rota); deep-link opens this dashboard pre-filtered to the alert.

## 3. Layout (≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Operations dashboard      Region: [All ▾]  ● live · refreshed 4s ago        [Map ▸] [Refresh]   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ STATUS                                                                                          │
│  Platform  🟢 Healthy   Matching  🟢   Payments  🟢   Notifications  🟡 elevated p95            │
│  Last incident: 2026-05-14 22:10 — resolved 4h 18m ago — "PSP timeout (Visa)"                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────┐ ┌────────────────────────────────┐ ┌──────────────────────┐ │
│ │ Active jobs                     │ │ Time-to-match (last 5m)        │ │ Online supply        │ │
│ │  Rides       428                │ │  Rides       28s p50  62s p95  │ │  Drivers       2,184 │ │
│ │  Deliveries  192                │ │  Deliveries  41s p50  118s p95 │ │  Couriers        612 │ │
│ │  Contracts    37                │ │  Contracts   —                 │ │  Providers       144 │ │
│ │  Total       657                │ │ ─trend last 1h─────            │ │ ─supply trend──      │ │
│ └─────────────────────────────────┘ └────────────────────────────────┘ └──────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────┐ ┌────────────────────────────────┐ ┌──────────────────────┐ │
│ │ Fill rate (15m window)          │ │ Abandonment rate               │ │ ETA accuracy         │ │
│ │  Rides        94.2%             │ │  Rides        2.1%             │ │  ±60s    78%         │ │
│ │  Deliveries   88.7%             │ │  Deliveries   4.8%             │ │  ±120s   91%         │ │
│ │  Contracts    —                 │ │  Contracts    —                │ │  >5min   2.1%        │ │
│ └─────────────────────────────────┘ └────────────────────────────────┘ └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────────┐ │
│ │ Queue SLAs                                       │ │ Live incidents                         │ │
│ │  KYC review queue       187 open                 │ │  🛑 17:48 — Riyadh North supply gap   │ │
│ │   Oldest 4h 12m  · SLA 4h · 1 breached  ▲        │ │     opened by auto-detector            │ │
│ │   [Open KYC ▸]                                   │ │     impacted: 18 unmatched rides       │ │
│ │                                                  │ │     [Acknowledge] [Open runbook ▸]    │ │
│ │  Disputes               42 open                  │ │                                        │ │
│ │   Oldest 18h · SLA 24h · 0 breached  —           │ │  🟡 14:02 — push notification p95 ↑    │ │
│ │   [Open Disputes ▸]                              │ │     by noor@jeeb.io · investigating    │ │
│ │                                                  │ │     [View thread ▸]                   │ │
│ │  Support (chat)         9 open                   │ │                                        │ │
│ │   Oldest 14m · SLA 30m · 0 breached  —           │ │  · 11:32 — wallet reconciliation drift │ │
│ │   [Open Support ▸]                               │ │     resolved by ouday · 11:58         │ │
│ └──────────────────────────────────────────────────┘ └────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────────┐ │
│ │ Service health (last 5m p95 ms)                  │ │ Fraud / anomaly signals (last 1h)      │ │
│ │  auth-service                 142   🟢           │ │  Velocity flags        18              │ │
│ │  jeeb-gateway                 188   🟢           │ │  Geo-spoof suspected    2              │ │
│ │  matching                     312   🟡 (P:240)   │ │  Multi-account ring     1 (8 users)    │ │
│ │  delivery-service             204   🟢           │ │  Card BIN cluster       0              │ │
│ │  offer-service                197   🟢           │ │  [Open signals ▸]                     │ │
│ │  unified_payment_gateway      271   🟡 (P:200)   │ │                                        │ │
│ │  wallet-service               118   🟢           │ │                                        │ │
│ │  realtime-comunication-svc    154   🟢           │ │                                        │ │
│ │  …  [View all 23 ▸]                              │ │                                        │ │
│ └──────────────────────────────────────────────────┘ └────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ On-call                                                                                      ││
│ │  Primary    ouday@jeeb.io      paged 2 in last 24h    [PagerDuty ▸]                          ││
│ │  Secondary  noor@jeeb.io       paged 0 in last 24h                                           ││
│ │  Manager    salem@jeeb.io      reachable until 22:00                                         ││
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Widgets

- **Status strip**: platform + four subsystems. Color + glyph + text. Click any → routes to a per-subsystem details page (Phase 2; for MVP it links to the relevant grafana board via the `rum-monitoring-pipeline` skill).
- **KPI cards**: nine total (active jobs, time-to-match, supply, fill rate, abandonment, ETA accuracy). All show current value + trend mini-chart.
- **Queue SLAs**: three rows; numbers from the same APIs that power the queue pages. Trend arrow vs 1h ago.
- **Live incidents**: top of pane shows open incidents (≤ 5), then resolved (last 24h, dim text). Each open incident has primary action (Acknowledge / Open runbook).
- **Service health**: p95 latency per backing service from the OTel collector pipeline. Per-service SLO target shown after `P:` when out of SLO.
- **Fraud / anomaly signals**: counts in last hour from `score-taking-service`; click → opens signal list filtered.
- **On-call**: primary, secondary, manager. Paged count in last 24h. PagerDuty deep-link.

### 3.2 Header

- **Region selector**: All, Riyadh, Jeddah, Dammam, Amman, Dubai (per the geo-rollout). Filter cascades to every widget.
- **Live indicator**: tiny pulsing dot when SSE is connected. Goes red + "stalled" if no message in 30s.
- **Map button**: deep-link to `/ops/map`.

## 4. States

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Loading                     | Each widget has its own skeleton; status strip loads first (cheapest endpoint).|
| SSE stalled                 | Header indicator turns red; per-widget timestamps grey out; manual refresh CTA.|
| Partial backend             | Affected widget shows "Data delayed" with last good timestamp; rest live.      |
| Incident declared           | Sticky banner above the dashboard with severity + open runbook.                |
| Read-only (no `ops.viewer`+)| 403 page; admin lacking role.                                                  |

## 5. Interactions

| Action               | Mouse                | Keyboard | Notes                                    |
|----------------------|----------------------|----------|------------------------------------------|
| Switch region        | dropdown             | `Shift+R`|                                          |
| Open Map             | Map button           | `m`      | Routes to `/ops/map`.                    |
| Acknowledge incident | Acknowledge button   | `Shift+1`/`Shift+2` for first/second incident |                |
| Refresh              | refresh              | `r`      | Manual; auto every 10s.                  |
| Drill KPI            | KPI click            | `Enter`  | Opens trend detail modal.                |

## 6. Data contracts

```
GET /v1/admin/ops/overview?region=all
→ 200 {
    as_of, region, sse_token,
    status: { platform, matching, payments, notifications, last_incident },
    active_jobs, time_to_match, supply, fill_rate, abandonment, eta_accuracy,
    queues: { kyc:{open,oldest_age,sla,breached,trend}, disputes:{…}, support:{…} },
    incidents: [{ id, severity, opened_at, title, summary, deep_link, status }],
    services: [{ name, p95_ms, slo_p95_ms, status }],
    anomalies: { velocity_flags, geo_spoof, multi_account_rings: {count,users},
                 card_bin_cluster },
    on_call: { primary, secondary, manager, paged_24h: { primary, secondary } }
  }

GET /v1/admin/ops/stream?region=all  (SSE)
POST /v1/admin/ops/incidents/:id/ack
```

## 7. Accessibility

- All status indicators are icon + text + color. Live indicator includes `<sr-only>` "Live updates active".
- Incidents are an ordered list with severity announced first.
- Trend mini-charts have a "View numbers" toggle exposing the underlying series in a table.
- Region selector is a `<select>` with `aria-label`.

## 8. Performance budget

- Overview API p95 < 400ms; aggregator caches 5s.
- SSE messages capped at 4KB; deltas only after initial snapshot.
- Each widget renders in its own React boundary; one widget error never blanks the dashboard (per-widget `<ErrorBoundary>`).

## 9. Telemetry

- `ops.dashboard.viewed` { region }
- `ops.dashboard.incident_acked` { incident_id, ack_age_s }
- `ops.dashboard.kpi_drilled` { kpi }
- `ops.dashboard.region_changed` { from, to }

## 10. Open questions

- **OQ-OPS-1**: Do we want a "compare to last week" toggle on KPIs, or rely on the Finance dashboard for trend? Ops users say they don't have time for trend reasoning during incidents.
- **OQ-OPS-2**: Incidents — feed from PagerDuty + internal auto-detector. How do we dedupe? Currently we trust PagerDuty as source-of-truth and auto-detector creates a comment, not a new incident.
- **OQ-OPS-3**: Should the map be embedded inline rather than a separate route? Decision: keep separate for performance — map alone is heavy.
