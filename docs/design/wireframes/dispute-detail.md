# Wireframe — Dispute Detail

**Route:** `/disputes/:id` · **Remote:** `jeeb-admin-disputes` · **Role:** `disputes.agent`+
**Backends:** `feedback-service` (complaints), `chat-service` (transcripts), `unified_payment_gateway` (txn lookup, refunds), `wallet-service` (adjustments), `delivery-service` / `offer-service` (job context)

## 1. Intent

Where a dispute agent works one case end-to-end. The screen must:

- Surface both sides of the story (consumer + provider) without bias.
- Aggregate the underlying job + transaction + chat + media artifacts that produced the complaint.
- Provide a closing action with auditable reason, optional partial refund, and an outcome that propagates to user reputation.
- Maintain a complete timeline so a second agent can pick up the case cold.

A dispute case averages 8–12 minutes of agent time. Information density and "no-tab-switching" are key — every artifact lives on this page.

## 2. Entry points

- Disputes queue (`/disputes`) row click — primary path.
- KYC viewer "Open related dispute" link if a complaint is tied to a KYC submission.
- User profile → Disputes tab → row click.
- Slack alert deep-link (`#disputes-priority` channel).

## 3. Layout (≥1280px)

Three columns: parties (320px), evidence (fluid), actions (400px).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Disputes   Dispute #DSP-21847 · Opened 18h ago · SLA 6h left · Priority HIGH    [Audit] [▾]   │
├──────────────────────────┬─────────────────────────────────────────┬────────────────────────────┤
│ COMPLAINANT              │ EVIDENCE                                │ RESOLUTION                 │
│                          │                                         │                            │
│ Lina Haddad              │ Job ride_77a91 · 2026-05-13 21:14       │ Status                     │
│ usr_3b8c · Lvl 2 · ★4.7  │ Pickup → Drop · 12.4 km · 38 min        │  ◉ Open                   │
│ [Open profile]           │ Fare 86.50 SAR · Tip 0.00 SAR           │  ○ Investigating           │
│                          │                                         │  ○ Awaiting party          │
│ Reason code              │  ┌─────────────────────────────────┐    │  ○ Resolved                │
│  service.late_arrival    │  │ MAP: pickup→drop route          │    │  ○ Closed (dup/spam)       │
│  service.unsafe          │  │   • driver actual path overlay  │    │                            │
│                          │  │   • complaint location pin      │    │ Verdict                    │
│ Statement                │  └─────────────────────────────────┘    │  ( ) Find for complainant  │
│  "Driver took a longer   │                                         │  ( ) Find for respondent   │
│   route and was rude on  │  Transactions (unified_payment_gateway) │  ( ) Split / partial       │
│   the phone. I want a    │   ┌──────────────────────────────────┐  │  ( ) No fault / dismiss    │
│   refund."               │   │ Auth     86.50 SAR  approved     │  │                            │
│                          │   │ Capture  86.50 SAR  settled      │  │ Outcome                    │
│ Filed 2026-05-13 22:08   │   │ Tip       0.00 SAR  —            │  │  Refund    [ 0.00 ] SAR    │
│ Channel: in-app          │   └──────────────────────────────────┘  │   ☐ Full refund            │
│ Attachments (2)          │                                         │   ☐ Partial 50%            │
│  📷 screenshot.jpg       │  Chat transcript (chat-service)         │   Reason ▾                 │
│  📷 receipt.jpg          │   17:31  L: "Where are you?"            │   [select…]                │
│                          │   17:33  D: "5 min away"                │  Reputation impact         │
├──────────────────────────┤   17:48  L: "Why are you stopping?"     │   ☐ Apply ★ penalty to     │
│ RESPONDENT               │   17:55  D: "Traffic, sorry"            │     respondent (auto)      │
│                          │   18:02  L: "This is insane"            │   ☐ Apply ★ penalty to     │
│ Ahmed M.                 │   [...full transcript expandable]       │     complainant (false)    │
│ usr_91ed · Lvl 5 · ★4.9  │                                         │  Public note (visible to   │
│ [Open profile]           │  Calls (realtime-comunication-service)  │   both parties)            │
│ 8 prior trips with Lina  │   18:12  outbound D→L · 2m 14s · ended  │   [____________________]   │
│ 0 prior disputes (12 mo) │                                         │   [____________________]   │
│ [Open profile]           │  Reviews / ratings                       │  Internal note (audit)    │
│                          │   L→D: ★1 "Rude and slow"               │   [____________________]   │
│ Reply                    │   D→L: ★3 (no comment)                  │                            │
│  "Yes I was late due to  │                                         │                            │
│   the school zone        │  Other signals                          │       [Save draft]         │
│   closure on Olaya St.   │   • Driver acceptance rate: 92%         │       [Submit verdict ▸]   │
│   Apologies, but the     │   • Lina prior disputes 12m: 2          │                            │
│   route was the same     │   • Geo-fence breach: none              │                            │
│   ETA the app showed."   │   • App version: D iOS 8.4.1            │                            │
│                          │     L Android 8.3.0                     │                            │
│ Filed reply 2026-05-13   │                                         │                            │
│ 23:02 · channel in-app   │                                         │                            │
├──────────────────────────┴─────────────────────────────────────────┴────────────────────────────┤
│ TIMELINE                                                                                         │
│  · 22:08 dispute opened (system) — complaint filed by Lina                                       │
│  · 22:14 auto-triage — priority HIGH (refund requested + safety reason)                          │
│  · 22:35 assigned to ouday@jeeb.io                                                               │
│  · 23:02 respondent reply received                                                               │
│  · 09:14 ouday@jeeb.io: opened transaction view                                                  │
│  · 09:19 ouday@jeeb.io: viewed map + GPS trace                                                   │
│  · …                                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Left column — parties

Each party card shows: name, user id, level + rating, profile link, dispute statement / reply, attachments, "trips together" count, prior disputes count (12-month window). Hover on any user id shows a mini-tooltip with phone (masked) + account age.

### 3.2 Center column — evidence

Stacked sections, all collapsible:

1. **Job context** — origin/destination, distance, duration, fare, tip.
2. **Map** — pickup→drop route plus actual GPS trace (different stroke). Heatmap toggle for stops > 30s. Powered by `geolocation-service`.
3. **Transactions** — pulled from `unified_payment_gateway` via NSwag client. Show auth/capture/refund chain.
4. **Chat transcript** — initially collapsed to last 6 messages; "Show full" expands. Search inside transcript with `/`.
5. **Calls** — call records; "Listen" button if recording is available + retention policy permits.
6. **Reviews / ratings** — what each party rated the other.
7. **Other signals** — driver acceptance rate, prior dispute counts, geo-fence breaches, app version, network type.

### 3.3 Right column — resolution

- **Status** lifecycle: Open → Investigating → Awaiting party → Resolved | Closed.
- **Verdict** mutually exclusive radios. "Split / partial" reveals percentage and refund inputs.
- **Outcome**:
  - **Refund** numeric input (always SAR for MVP); checkbox shortcuts (Full = fare, Partial 50%). Triggers `unified_payment_gateway` refund call.
  - **Reputation impact** — checkbox to apply rating penalty per the rules engine; default is auto-checked when verdict matches.
  - **Public note** — both parties see this in app + email.
  - **Internal note** — audit-only.
- **Save draft / Submit verdict** — submit requires verdict + reason + public note (≥ 20 chars).

## 4. States

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Loading                     | Skeletons in all three columns.                                                |
| Locked (another agent)      | Banner "Currently being reviewed by noor@jeeb.io · idle 3m" + "Take over ▸".   |
| Awaiting party reply        | Right column shows countdown to auto-close (72h); reminder sent at 24h/48h.    |
| Refund failed at gateway    | Toast "Refund failed: insufficient funds in merchant account — retry"; verdict not submitted. |
| Reputation rules suppressed | If user is in protected cohort (new driver < 30 days), banner explains rule.   |
| Already resolved            | Right column read-only; banner with resolver + timestamp.                      |
| Dispute promoted to legal   | All actions disabled; banner with legal ticket reference.                      |

## 5. Interactions

| Action               | Keyboard          | Notes                                                |
|----------------------|-------------------|------------------------------------------------------|
| Take over case       | `t`               | Confirms before stealing lock.                       |
| Open complainant profile | `Shift+1`     | New tab.                                             |
| Open respondent profile  | `Shift+2`     | New tab.                                             |
| Focus public note    | `n`               |                                                     |
| Focus internal note  | `Shift+N`         |                                                     |
| Toggle map           | `m`               |                                                     |
| Toggle full chat     | `c`               |                                                     |
| Submit verdict       | `Cmd/Ctrl+Enter`  | Disabled until valid.                                |
| Save draft           | `Cmd/Ctrl+S`      | Server-side draft; resumes if agent reopens.         |

Right-column form auto-saves to draft every 30s (`PUT /v1/admin/disputes/:id/draft`).

## 6. Data contracts

```
GET /v1/admin/disputes/:id
→ 200 {
    id, status, priority, sla: { deadline_at, breached },
    complainant: { user_id, …, statement, attachments: [{url, mime}] },
    respondent: { user_id, …, reply },
    job: { kind: "ride"|"delivery"|"contract", id, …,
           gps_trace_url, route_overlay_url },
    transactions: [ ... unified_payment_gateway items ... ],
    chat: { thread_id, messages: [...] },
    calls: [ ... rtcs items ... ],
    reviews: [{ from, to, rating, comment }],
    signals: { driver_acceptance_rate, prior_disputes_complainant_12m,
               prior_disputes_respondent_12m, geo_fence_breach, app_versions, … },
    timeline: [{ at, actor, kind, detail }],
    decision: null | { verdict, reason_code, refund_amount, public_note, internal_note,
                       decided_by, decided_at }
  }

POST /v1/admin/disputes/:id/lock         (idempotent ownership)
POST /v1/admin/disputes/:id/transfer     { to_user_id, reason }
PUT  /v1/admin/disputes/:id/draft        { verdict?, reason_code?, refund_amount?,
                                            public_note?, internal_note? }
POST /v1/admin/disputes/:id/verdict      (final submit — triggers refund, reputation, notification)
```

Refund execution is server-side via `unified_payment_gateway` (Elixir). The FE never calls the payment gateway directly — that's a locked-in policy.

## 7. Accessibility

- Three columns are `<aside>`, `<main>`, `<aside>` with named landmarks ("Parties", "Evidence", "Resolution").
- Map exposes a text alternative table ("Pickup at 22:14, stop at 22:18 for 4 minutes at 24.7N 46.7E, drop at 22:52").
- Chat transcript is a definition list (`<dl>`) so screen readers can navigate messages with list-jump.
- Refund input is `<input type="text" inputmode="decimal">` with explicit currency `<abbr>`; live region announces the running total when partial.
- Verdict radios in a `<fieldset>` with `<legend>`. Reason code disabled until verdict chosen.
- All deep-links open in new tab and include `aria-describedby` "opens in new tab".

## 8. Performance budget

- Initial fetch p95 ≤ 1.8s (multi-service aggregation; cached in BFF for 60s).
- Map tile loads via `geolocation-service` signed-URL tile proxy.
- Chat transcript lazy-loads in chunks of 100 messages on scroll up.
- Draft autosave debounced 1s; never blocks the UI.

## 9. Telemetry

- `dispute.detail.viewed` { dispute_id }
- `dispute.detail.lock_taken` { dispute_id }
- `dispute.detail.draft_saved` { dispute_id, fields_changed }
- `dispute.detail.verdict_submitted` { dispute_id, verdict, refund_amount, ttd_ms, used_keyboard }

## 10. Open questions

- **OQ-DSP-1**: Should the agent be able to refund from the platform wallet vs. driver wallet when fault is platform-side (e.g., bad routing)? Currently we always pull from respondent. Talk to finance.
- **OQ-DSP-2**: For safety-flagged disputes, should the screen suppress driver phone entirely (vs. masked)? Privacy team review.
- **OQ-DSP-3**: How do we handle three-way disputes (delivery: consumer + driver + merchant)? MVP supports two-party only — define escalation path.
- **OQ-DSP-4**: Should "Apply ★ penalty to complainant" require a higher role than `disputes.agent`?
