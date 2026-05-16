# Wireframe — Finance Dashboard

**Route:** `/finance` · **Remote:** `jeeb-admin-finance` · **Role:** `finance.viewer`+ (writes need `finance.ops`)
**Backends:** `unified_payment_gateway` (txn, refunds, payouts), `wallet-service` (balances, ledgers), `auth-service` (user lookup), aggregation BFF in `jeeb-gateway`

## 1. Intent

The finance dashboard answers four daily questions:

1. **Are we balanced?** Reconciliation between gateway, wallet ledger, and bank statements.
2. **Where is money flowing?** Volume trends, GMV, take rate, refunds, chargebacks.
3. **What needs me right now?** Pending refunds, failed payouts, chargebacks, suspicious patterns.
4. **What's scheduled?** Upcoming payouts, settlement batches.

Default view answers (1) and (3) above the fold. Trends are scroll-below.

## 2. Entry points

- Top nav "Finance".
- Dispute detail → "View related txn" deep links to a filtered transactions view (Phase 2).
- Slack alert deep-link from anomaly detection.

## 3. Layout (≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Finance dashboard          Period: [Today  ▾]  Compare to [Prev day ▾]   [Refresh] [Export ▾]  │
│ As of 2026-05-15 14:08 · auto-refresh 60s                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Transactions] [Refunds 7] [Payouts] [Chargebacks 2] [Reconciliation 1]              │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ GMV today     │ │ Net revenue   │ │ Refund rate   │ │ Chargeback rt │ │ Avg ticket    │    │
│  │ 184,392 SAR   │ │  29,503 SAR   │ │  1.8%         │ │  0.21%        │ │  74.20 SAR    │    │
│  │ ▲ 12% vs yest │ │ ▲ 9% vs yest  │ │ ▼ 0.3pp       │ │ ─ flat        │ │ ▲ 4% vs yest  │    │
│  │ ───sparkline─ │ │ ───sparkline─ │ │ ───sparkline─ │ │ ───sparkline─ │ │ ───sparkline─ │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────┐   │
│  │ Volume — last 24h                                │ │ Needs attention                    │   │
│  │ (stacked area chart: rides, deliveries,         │ │  ⚠ 1 reconciliation mismatch       │   │
│  │  contracts, wallet top-ups)                     │ │   gateway − ledger = 2,418 SAR     │   │
│  │                                                  │ │   detected 11:32 → [Investigate ▸]│   │
│  │                                                  │ │                                    │   │
│  │                                                  │ │  ⚠ 2 chargebacks pending response │   │
│  │                                                  │ │   visa CB · 380 SAR · due in 3d   │   │
│  │                                                  │ │   visa CB · 712 SAR · due in 1d   │   │
│  │                                                  │ │                                    │   │
│  │                                                  │ │  ⚠ 7 refunds awaiting approval     │   │
│  │                                                  │ │   total 4,168 SAR · oldest 4h     │   │
│  │                                                  │ │                                    │   │
│  │                                                  │ │  ⚠ 1 failed payout                 │   │
│  │                                                  │ │   driver_8a3c · 1,240 SAR         │   │
│  │                                                  │ │   reason: IBAN_INVALID            │   │
│  └──────────────────────────────────────────────────┘ └────────────────────────────────────┘   │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────┐   │
│  │ Payout schedule — next 7 days                    │ │ Wallet ledger health               │   │
│  │  Day        Drivers  Merchants  Total            │ │  Platform float        184,392 SAR │   │
│  │  Today      214       38         86,302          │ │  In-transit            12,408 SAR  │   │
│  │  Mon 16     198       41         79,118          │ │  Pending payout        62,800 SAR  │   │
│  │  Tue 17     203       40         81,440          │ │  Held (disputes)       3,840 SAR   │   │
│  │  Wed 18     —         42         8,210           │ │  Reserve (5%)          9,219 SAR   │   │
│  │  Thu 19     201       —          75,300          │ │  ───────────────────────────────── │   │
│  │  Fri 20     —         —          0               │ │  Reconciled at 14:00 ✓             │   │
│  │  Sat 21     188       38         72,109          │ │                                    │   │
│  │  [Open payouts ▸]                                 │ │  Last drift > 5 SAR · 11:32       │   │
│  └──────────────────────────────────────────────────┘ └────────────────────────────────────┘   │
│                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ By product line (today)                                                                  │  │
│  │  Line          GMV         Net rev    Refund rt   Chargeback rt   Avg ticket             │  │
│  │  Rides         98,402      14,820     1.4%        0.18%           18.20                  │  │
│  │  Deliveries    48,210       9,032     2.6%        0.30%           42.10                  │  │
│  │  Contracts     31,840       4,401     1.0%        0.05%           412.50                 │  │
│  │  Wallet top-up  5,940       1,250     0.1%        0.40%           50.00                  │  │
│  │  [Drill into a line ▸]                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 KPI cards

Five cards, each rendered with `<KpiCard>` (see `components/charts.md`):

- Title (12px, secondary text)
- Value (24px, tabular-nums)
- Delta vs comparison period (12px, colored: success up, danger down for "good direction" KPIs)
- 24h sparkline (60px wide, single-color stroke)

Each KPI links to its detail page (GMV → Transactions filtered to today).

### 3.2 "Needs attention" panel

Right-side queue of action items. Each row:
- Severity icon (`⚠` warning or `🛑` blocking).
- One-line description with the precise number.
- "Investigate / Resolve" CTA → routes to the relevant deep page.

When nothing needs attention: a single line "✓ Everything reconciled · nothing to action." in success color.

### 3.3 Other widgets

- **Volume chart** — stacked area, 24h window, hover crosshair shows per-line breakdown.
- **Payout schedule** — read-only table; "Open payouts" routes to `/finance/payouts`.
- **Wallet ledger health** — six-row mini ledger; "Reconciled at" timestamp updates on each reconciliation pass.
- **By product line** — small table; "Drill into a line" sets the global filter for the rest of the screen.

### 3.4 Tabs

| Tab               | Route                          | Notes                                                  |
|-------------------|--------------------------------|--------------------------------------------------------|
| Overview          | `/finance`                     | This screen.                                           |
| Transactions      | `/finance/transactions`        | Searchable transaction log, exportable CSV.            |
| Refunds           | `/finance/refunds`             | Refund approval queue (`finance.ops` to action).       |
| Payouts           | `/finance/payouts`             | Scheduled, processing, failed, completed.              |
| Chargebacks       | `/finance/chargebacks`         | Open + history; evidence upload.                       |
| Reconciliation    | `/finance/reconciliation`      | Drift detail, batch matcher (`finance.ops`).           |

## 4. States

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Loading                     | Each card/widget has its own skeleton.                                         |
| Partial data                | If a backend (e.g., `unified_payment_gateway`) is degraded, affected widgets show "Data delayed · last good 14:00" badge instead of failing the whole screen. |
| Period switched             | All widgets re-skeleton until new data arrives; comparison line updates atomic.|
| Read-only (no `finance.ops`)| All "Investigate / Resolve" CTAs become "View" links; refund/payout tabs read-only. |
| Reconciliation alert active | Top of screen gets a sticky banner that does not scroll.                       |

## 5. Interactions

| Action                   | Mouse              | Keyboard         |
|--------------------------|--------------------|------------------|
| Switch period            | period dropdown    | `p`              |
| Switch comparison        | comparison dropdown| `c`              |
| Refresh                  | refresh button     | `r`              |
| Export current view      | export menu        | `e`              |
| Open a tab               | tab click          | `1`–`6`          |
| Open KPI detail          | KPI click          | `Enter` on card  |

## 6. Data contracts

```
GET /v1/admin/finance/overview?period=today&compare=prev_day
→ 200 {
    period: { start_at, end_at, tz },
    kpis: { gmv, net_revenue, refund_rate, chargeback_rate, avg_ticket,
            spark: { gmv:[…], net_revenue:[…], refund_rate:[…], … } },
    volume: { granularity: "hour", series: [{ at, rides, deliveries, contracts, wallet_topup }] },
    needs_attention: [{ kind, severity, summary, deep_link, count?, total? }],
    payouts_schedule: [{ date, drivers_count, merchants_count, total_sar }],
    wallet_health: { platform_float, in_transit, pending_payout, held, reserve,
                     last_reconciled_at, last_drift_at, last_drift_amount_sar },
    by_line: [{ line, gmv, net_revenue, refund_rate, chargeback_rate, avg_ticket }]
  }

GET /v1/admin/finance/needs-attention/stream  (SSE — push updates)
```

BFF caches Overview for 60s server-side; manual refresh forces revalidate (`?force=1`).

## 7. Accessibility

- Each KPI card is a `<a>` with text content ordered logically (title, value, delta, "trend chart"). Sparkline has `aria-hidden=true` with the numeric trend exposed as `<sr-only>` summary ("Down 5 percent over the last 24 hours").
- "Needs attention" is an ordered list of warnings; severity icons have `aria-label`.
- Volume chart provides a "View as table" toggle (`t`) that swaps the SVG for an accessible table.
- All currency values render with `<bdo dir="ltr">` so amounts read left-to-right even in RTL locales (Phase 2 admin Arabic).

## 8. Performance budget

- TTI ≤ 1.8s; overview API < 400ms p95.
- Each tab lazy-loads its widget bundle (Module Federation `dynamic import`).
- Charts use the canvas variant of the org's chart wrapper (see `components/charts.md`); never re-render on hover.
- Re-fetch cancellation: switching period mid-flight aborts the prior request.

## 9. Telemetry

- `finance.overview.viewed` { period, compare }
- `finance.overview.kpi_clicked` { kpi }
- `finance.needs_attention.actioned` { kind, deep_link }
- `finance.overview.exported` { period, format }

## 10. Open questions

- **OQ-FIN-1**: GMV definition — gross of refunds (current) or net? Finance has been inconsistent in past spreadsheets.
- **OQ-FIN-2**: Should the dashboard show platform P&L (revenue − costs − refunds − chargebacks − payouts), or leave that to BI? MVP shows revenue but no costs.
- **OQ-FIN-3**: Multi-currency — when we launch UAE (AED), each KPI shows in user-preferred currency or one canonical with toggles? MVP is SAR only.
- **OQ-FIN-4**: Reconciliation drift threshold (5 SAR currently) — should it be percent-based?
