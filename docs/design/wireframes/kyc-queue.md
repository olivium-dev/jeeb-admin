# Wireframe — KYC Queue

**Route:** `/kyc` · **Remote:** `jeeb-admin-kyc` · **Role:** `kyc.reviewer`+
**Backend:** `auth-service` (KYC submissions) via `jeeb-gateway` (NSwag client)

## 1. Intent

A single triage surface where a KYC reviewer can:

- See every KYC submission awaiting review, ordered by SLA risk (oldest first by default).
- Filter by status, tier, document type, country, and assignee.
- Open one submission at a time and review it without losing queue position.
- Approve or reject in-line (low-risk cases) or escalate to a full document review.

The queue is the reviewer's home screen — they spend ~6h/day here. Density and keyboard-driven navigation are the dominant constraints.

## 2. Entry points

- Direct: top-nav "KYC queue" link, shortcut `g k`.
- Notification: SLA breach alert from `notification-service` → deep link to filtered queue.
- From user profile: "View KYC submission" → opens specific row pre-selected.

## 3. Layout (≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ KYC review queue                                                          [Refresh] [Export ▾]  │
│ 187 pending · 24 assigned to you · oldest 4h 12m                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [All] [Unassigned] [Mine 24] [Escalated 3]      Status ▾  Tier ▾  Country ▾  Assignee ▾   🔍 /  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Submitted   ↓ │ Applicant            │ Tier │ Docs    │ Risk │ SLA      │ Assignee │ Action │
├───┼───────────────┼──────────────────────┼──────┼─────────┼──────┼──────────┼──────────┼────────┤
│ ☐ │ 4h 12m ago    │ Salem Al-Otaibi      │ T2   │ ID • SF │ 🔴82 │ ⏳ 48m   │ ouday    │  …    │
│ ☐ │ 3h 58m ago    │ Lina Haddad          │ T1   │ ID • SF │ 🟡54 │ 🟢 1h 2m │ —        │  …    │
│ ☐ │ 3h 41m ago    │ مازن العتيبي          │ T2   │ ID • SF │ 🟡49 │ 🟢 1h19m │ ouday    │  …    │
│ ☐ │ 2h 09m ago    │ Khalid R.            │ T2   │ ID only │ 🔴78 │ 🟢 2h51m │ —        │  …    │
│ ☐ │ 1h 31m ago    │ Mira Saad            │ T1   │ ID • SF │ 🟢12 │ 🟢 3h29m │ noor     │  …    │
│ … (skeleton rows for the rest of the page)                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1–25 of 187            [‹ Prev] Page 1 of 8 [Next ›]              Rows per page: 25 ▾   │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Row anatomy:
- **Checkbox** — present but disabled in MVP (bulk actions are Phase 2).
- **Submitted ↓** — relative time; absolute on hover. Default sort.
- **Applicant** — full name (RTL-aware), with masked phone on hover; click opens drawer.
- **Tier** — T1 (basic), T2 (full), T3 (business). Chip uses `--color-status-neutral`.
- **Docs** — abbreviations: `ID`=gov ID, `SF`=selfie, `BL`=business license, `PROOF`=address proof.
- **Risk** — score 0–100 from `score-taking-service`; colored pill:
  - 0–39 green, 40–69 yellow, 70–100 red.
- **SLA** — time remaining until 4h SLA breach. `🟢` ≥1h, `🟡` <1h, `🔴` breached. Breached rows have a left `--color-status-danger` 3px border.
- **Assignee** — current owner; `—` if unassigned. Click → "Reassign…" menu.
- **Action** — kebab: Open, Assign to me, Reassign…, Escalate, View user.

### 3.1 Detail drawer (right slide-in, 480px)

Opens on row click. Shows compact preview without leaving the queue:

```
┌──────────────────────────────────────────────────────┐
│ Salem Al-Otaibi                                  ✕   │
│ user_id: usr_8a31c2 · T2 · submitted 4h 12m ago      │
├──────────────────────────────────────────────────────┤
│ Risk 82  🔴   reasons: device-mismatch, face-low     │
├──────────────────────────────────────────────────────┤
│ [photo: gov ID front]   [photo: selfie]              │
│  Face match: 0.71 (low)                              │
│  Liveness: passed                                    │
│  OCR name: SALEM ALOTAIBI ← matches profile          │
│  OCR DOB:  1991-03-22                                │
│  ID expires: 2029-08                                 │
├──────────────────────────────────────────────────────┤
│ Quick verdict                                        │
│ ( ) Approve  ( ) Reject  ( ) Escalate to full review │
│ Reason ▾  [select…]                                  │
│ Note  [____________________________________________] │
│                                                      │
│              [Open full viewer ▸]   [Submit ▸]       │
└──────────────────────────────────────────────────────┘
```

"Open full viewer" navigates to `/kyc/:userId/document/:docId` (see `kyc-document-viewer.md`). "Submit" requires a verdict + reason; on success the next row in queue auto-loads (toggleable).

## 4. States

| State                 | Behavior                                                                                  |
|-----------------------|-------------------------------------------------------------------------------------------|
| Initial load          | Skeleton: 8 rows pulsing, filter strip live.                                              |
| Empty (queue clear)   | Centered illustration "All caught up." + last-cleared timestamp; auto-polls every 30s.    |
| Filtered to zero      | "No submissions match these filters." + "Clear filters" link.                             |
| Network error         | Inline retry banner above table, preserves filter + row selection.                        |
| Partial permission    | Risk score and reasons hidden; tier and docs visible; banner explains missing role.       |
| SLA breach detected   | Row left-border red, audible chime (toggleable), header counter increments.               |

## 5. Interactions

| Action               | Mouse                       | Keyboard          | Notes                                  |
|----------------------|-----------------------------|-------------------|----------------------------------------|
| Move row focus       | hover                       | `j` / `k`         | Highlights row; does not open.         |
| Open drawer          | row click                   | `Enter`           | Drawer slides 200ms.                   |
| Close drawer         | overlay click / ✕           | `Esc`             | Returns focus to row.                  |
| Open full viewer     | "Open full viewer ▸"        | `v`               | Pushes route, drawer stays state.      |
| Assign to me         | kebab → Assign              | `a`               | Optimistic; undo toast 10s.            |
| Approve              | drawer Approve → Submit     | `Shift+A`         | Requires reason if risk ≥ 70.          |
| Reject               | drawer Reject → Submit      | `Shift+R`         | Reason mandatory.                      |
| Escalate             | drawer Escalate → Submit    | `Shift+E`         | Selects T&S lead from rota.            |
| Refresh queue        | Refresh button              | `r`               | Manual; auto-refresh every 30s via SSE.|
| Focus search         | search box                  | `/`               | Debounced 250ms.                       |

Auto-advance: after Submit, drawer loads next row (within current filter). Toggle in user prefs.

## 6. Data contracts

`jeeb-gateway` aggregates from `auth-service` (submissions) and `score-taking-service` (risk).

```
GET /v1/admin/kyc/queue
  ?status=pending|escalated
  &assignee=me|unassigned|<userId>
  &tier=T1|T2|T3
  &country=SA|JO|AE|…
  &q=<search>
  &cursor=<opaque>
  &limit=25

→ 200 {
    items: [{
      submission_id, user_id, full_name_en, full_name_local,
      tier, docs: ["id","selfie",…], risk: { score, reasons: [...] },
      sla: { deadline_at, breached: bool },
      assignee: { user_id, display_name } | null,
      submitted_at
    }],
    next_cursor, total
  }

POST /v1/admin/kyc/submissions/:id/assign  { assignee_id }
POST /v1/admin/kyc/submissions/:id/verdict { verdict: "approve"|"reject"|"escalate",
                                              reason_code, note? }
GET  /v1/admin/kyc/queue/stream    (SSE — updates, sla_breach, new_submission)
```

NSwag-generated client lives in `@jeeb/api-clients/kyc`. All calls require `Authorization: Bearer <sso>` and emit an audit entry server-side.

## 7. Accessibility

- Table is a real `<table>` with `<thead scope="col">`. Each sortable header is a `<button>` toggling `aria-sort`.
- Row focus uses a visible 2px focus ring; rows are `role="row"` with `aria-rowindex` for screen-reader pagination.
- Status pills convey state via icon + text + color (never color alone).
- Drawer is `<dialog>` with focus trap and `aria-labelledby` to the applicant name. `Esc` closes.
- All time values use `<time datetime="...">`; screen readers read the absolute timestamp.
- Risk score reasons are read aloud as a list; chime is decorative and respects `prefers-reduced-motion`.

## 8. Performance budget

- TTI ≤ 1.5s on 4G simulation.
- Table render < 50ms for 25 rows (Vitest perf check).
- SSE reconnect with jittered backoff (1s → 30s cap), reflects in header banner.
- Pagination is cursor-based; no offset queries on the backend.

## 9. Telemetry

Emit to `score-taking-service`'s telemetry sink:

- `kyc.queue.viewed` { filter_hash, result_count }
- `kyc.queue.row_opened` { submission_id, position }
- `kyc.queue.verdict_submitted` { submission_id, verdict, duration_ms, used_keyboard: bool }
- `kyc.queue.sla_breached` { submission_id, breach_age_s }

Used by the operations dashboard "queue health" widget (see `operations-dashboard.md`).

## 10. Open questions

- **OQ-KYC-Q-1**: Should "auto-advance after submit" default ON or OFF? Reviewer interviews split 50/50.
- **OQ-KYC-Q-2**: Audible SLA chime — keep or drop? Some reviewers wear headphones for music; risk of annoyance.
- **OQ-KYC-Q-3**: Show device/IP risk reasons in drawer or only in full viewer? Currently drawer-only abbreviates them.
