# Wireframe — User Management

**Routes:** `/users` (list), `/users/:id` (profile) · **Remote:** `jeeb-admin-users` · **Role:** `users.viewer`+ (writes need `users.admin`)
**Backends:** `auth-service` (identity, sessions, KYC links), `ban-service` (suspensions, bans), `wallet-service` (balances), `score-taking-service` (risk + reputation), `feedback-service` (complaints), `compliment-service` (kudos), `notification-service` (sends), `unified_payment_gateway` (txn history)

## 1. Intent

The user management surface is where T&S and ops staff answer one of two questions per session:

1. **"Who is this user, end to end?"** — single 360° profile with identity, devices, jobs, money, complaints, kudos, suspensions, and audit trail.
2. **"Who in our base looks like X?"** — searchable, filterable list (by role, status, country, KYC tier, risk band) to investigate cohorts, run a sweep after a fraud signal, or pick a target for a manual action.

The screen is read-heavy. Writes are gated by `users.admin` and always go through `<DangerConfirm>` with audit (NFR-7.4). No mass actions in MVP — one user at a time.

## 2. Entry points

- Top nav "Users", shortcut `g u`.
- Global search hit (`/` on any screen) routes to `/users` pre-filtered.
- Dispute detail → "Open profile" on either party.
- KYC queue/viewer → "View user".
- Ops map detail card → "Open profile".
- Audit-log entry → "View actor / entity".

## 3. Layout — list (`/users`, ≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Users                                                                       [Export ▾]          │
│ 218,402 total · 1,184 suspended · 24 in review                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [All] [Riders] [Drivers] [Couriers] [Providers] [Merchants] [Staff]                              │
│ Status ▾  KYC tier ▾  Risk ▾  Country ▾  Joined ▾  Last seen ▾              🔍 name/phone/id /  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ User                       │ Role(s)     │ KYC  │ Risk │ Status     │ Last seen    │ Action │
├───┼────────────────────────────┼─────────────┼──────┼──────┼────────────┼──────────────┼────────┤
│ ☐ │ Salem Al-Otaibi            │ Driver      │ T2 ✓ │ 🟢 18│ Online     │ 14s ago      │   …    │
│   │ usr_8a31c2 · +9665••••12   │ Rider       │      │      │            │              │        │
│ ☐ │ Lina Haddad                │ Rider       │ T1 ✓ │ 🟢 22│ Active     │ 4m ago       │   …    │
│   │ usr_3b8c19 · +9627••••08   │             │      │      │            │              │        │
│ ☐ │ Khalid R.                  │ Rider       │ T2 ⏳ │ 🔴 78│ In review  │ 2h ago       │   …    │
│   │ usr_91eda0 · +9665••••44   │ Driver*     │ pend │      │            │              │        │
│ ☐ │ مازن العتيبي                 │ Provider    │ T3 ✓ │ 🟡 51│ Suspended  │ 3d ago       │   …    │
│   │ usr_72fbb1 · +9665••••91   │             │      │      │ payment    │              │        │
│ ☐ │ Mira Saad                  │ Courier     │ T2 ✓ │ 🟢 14│ Offline    │ 38m ago      │   …    │
│   │ usr_44ce0a · +9627••••55   │             │      │      │            │              │        │
│ … (skeletons for remaining rows)                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1–25 of 218,402             [‹ Prev] Page 1 of 8,737 [Next ›]    Rows per page: 25 ▾   │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Row anatomy

- **Checkbox**: present, disabled in MVP (bulk actions = Phase 2). Tooltip explains.
- **User**: display name (RTL-aware), id, masked phone. Hover → mini tooltip (email masked, account age, country).
- **Role(s)**: chips, multi-role stacked vertically. `*` suffix = role onboarding incomplete (e.g., driver-onboarding paused at vehicle docs).
- **KYC**: tier (`T1` / `T2` / `T3`) + state glyph (`✓` approved, `⏳` pending, `✗` rejected, `—` not started). Click → opens latest submission in KYC viewer.
- **Risk**: 0–100 from `score-taking-service`. Same pill thresholds as the KYC queue (green ≤39, yellow 40–69, red ≥70).
- **Status**: text + color. Lifecycle values: `Online`, `Active`, `Offline`, `In review`, `Suspended <kind>`, `Deactivated`, `Pending deletion`.
- **Last seen**: relative; hover for absolute. `Online` shows `live`.
- **Action kebab**: Open profile, View KYC, View disputes, Open in map, Copy id, Copy phone, Audit history.

### 3.2 Filters

Filter strip is a stack of `<FilterPill>` (see `components/forms.md`). Multi-select where it makes sense (Country, Role). Selections serialize to URL so a filtered link can be shared with another agent.

Saved views are out of scope for MVP (see README §"Out of scope").

## 4. Layout — profile (`/users/:id`, ≥1280px)

Two columns: identity rail (320px) + content tabs (fluid).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Users    Salem Al-Otaibi · Driver · usr_8a31c2                          [Audit] [Suspend ▾]  │
├─────────────────────┬───────────────────────────────────────────────────────────────────────────┤
│ IDENTITY            │ [Overview] [Activity] [Money] [Disputes 1] [Devices] [Linked] [Audit]    │
│                     ├───────────────────────────────────────────────────────────────────────────┤
│  [avatar]           │                                                                           │
│  Salem Al-Otaibi    │ ┌─────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  Driver, Rider      │ │ At a glance                 │ │ Risk & reputation                   │  │
│                     │ │  Joined 2024-08-12 · 21mo   │ │  Risk score        🟢 18 / 100      │  │
│  user_id            │ │  Country  SA · Riyadh       │ │  Reputation        ★ 4.91 / 5.0     │  │
│   usr_8a31c2 ⧉      │ │  Locale   en-SA / ar-SA     │ │  Driver rating     ★ 4.93 (2,184)   │  │
│  Phone (masked)     │ │  Channel  iOS · v8.4.1      │ │  Compliments       428              │  │
│   +9665••••12       │ │  Email    s.•••@gmail.com   │ │  Complaints 12m    3                │  │
│   verified ✓        │ │  KYC T2 ✓ · approved 2024…  │ │  Disputes lost     0                │  │
│  Email              │ └─────────────────────────────┘ └─────────────────────────────────────┘  │
│   s.•••@gmail.com   │                                                                           │
│   verified ✓        │ ┌─────────────────────────────────────────────────────────────────────┐  │
│  IBAN tail          │ │ Recent activity (last 7 days)                                       │  │
│   ••••8190          │ │   ─────────── 12 rides ─── 3 wallet top-ups ── 1 dispute open ───   │  │
│                     │ │   Today    08:31  ride completed · 86.50 SAR                        │  │
│  Roles              │ │           09:14  wallet top-up 200 SAR                              │  │
│   • Driver (active) │ │           11:02  ride completed · 42.00 SAR                         │  │
│   • Rider           │ │   Sat 14   …                                                        │  │
│                     │ │   [Open Activity tab ▸]                                             │  │
│  KYC                │ └─────────────────────────────────────────────────────────────────────┘  │
│   Tier 2 · approved │                                                                           │
│   2024-08-14        │ ┌─────────────────────────────────────────────────────────────────────┐  │
│   [Open submission] │ │ Wallet                                                              │  │
│                     │ │  Balance        184.20 SAR                                           │  │
│  Status             │ │  Pending payout 320.00 SAR · Mon 16                                  │  │
│   Online · Riyadh   │ │  Last txn       08:31 — credit 86.50 SAR                             │  │
│                     │ │  [Open Money tab ▸]                                                  │  │
│  Linked accounts (2)│ └─────────────────────────────────────────────────────────────────────┘  │
│   • spouse · usr_…  │                                                                           │
│   • emergency · usr_│ ┌─────────────────────────────────────────────────────────────────────┐  │
│                     │ │ Trust & safety                                                      │  │
│  Tags               │ │  Active suspensions   none                                          │  │
│   [VIP-driver]      │ │  Open disputes        1 — DSP-21847 — [Open ▸]                      │  │
│   [retention-Q2]    │ │  Recent flags (90d)   2 — velocity (low), geo-spoof (resolved)     │  │
│                     │ │  Notes                "Driver moved to Riyadh East — verified plate"│  │
│  [+ Add note]       │ │                       ouday · 2026-04-30                            │  │
│  [+ Add tag]        │ │  [+ Add note]                                                       │  │
│                     │ └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────┴───────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Identity rail (left, 320px, sticky)

Read-only quick reference. Every PII field is masked by default with a "Reveal" affordance that triggers an audit event (`pii.revealed`). Mask format: `first 2 + masked middle + last 2`. Reveal is time-boxed (30s) and re-masks automatically; subsequent reveals require a fresh action.

Items shown:

- Avatar (or initials chip), display name, primary role + secondary roles.
- `user_id` with copy-to-clipboard.
- Phone (masked + verified glyph).
- Email (masked + verified glyph).
- IBAN tail (drivers/providers/merchants only).
- Roles list with current state per role.
- KYC summary + link to latest submission.
- Status + last-seen city.
- Linked accounts (count + first 2; rest in tab).
- Tags + notes (T&S).

### 4.2 Tabs

| Tab        | Default body                                                                                 |
|------------|----------------------------------------------------------------------------------------------|
| Overview   | Cards above. The "home" tab.                                                                 |
| Activity   | Combined event stream: jobs, calls, chats, wallet, sessions. Filterable by kind + window.    |
| Money      | Wallet balance, top-ups, payouts, refunds; deep-link to `unified_payment_gateway` txn.       |
| Disputes   | Both as complainant and respondent; count badge = open.                                      |
| Devices    | Installed devices, sessions, IPs, geo, last seen. Revoke session.                            |
| Linked     | Family / household / merchant↔staff links. Risk reasoning when system detected a link.        |
| Audit      | All admin actions targeting this user, write-only, paginated. Filter by actor / action.      |

### 4.3 Header actions

- **Audit** → opens this user's audit slice in the audit-log surface.
- **Suspend ▾** — gated to `users.admin`. Menu with: Suspend (temporary), Suspend (indefinite), Deactivate, Reactivate, Force re-KYC, Force logout. Each opens a `<DangerConfirm>` (see `components/modals.md`); "Suspend (indefinite)" requires a typed-id confirmation.

## 5. Layout — suspend modal (gated, `users.admin`)

```
┌────────────────────────────────────────────────────────────────┐
│  Suspend Salem Al-Otaibi (usr_8a31c2)?                     ✕   │
├────────────────────────────────────────────────────────────────┤
│  This will:                                                    │
│   • Prevent new sessions on all roles (Driver, Rider).         │
│   • Cancel any in-progress jobs (1 active ride) with refund.   │
│   • Pause pending payouts (320.00 SAR).                        │
│   • Notify the user in app + SMS in their locale (ar-SA).      │
│                                                                │
│  Kind                                                          │
│   ( ) Temporary  Until [date picker]                           │
│   (•) Indefinite — review required to lift                     │
│   ( ) Until KYC re-submitted                                   │
│                                                                │
│  Reason ▾                                                      │
│   [select reason code…]                                        │
│                                                                │
│  Internal note (audit only, required ≥20 chars)                │
│   [_______________________________________________________]    │
│                                                                │
│  Type the user_id to confirm:                                  │
│   [_______________________________________________________]    │
│                                                                │
│  ☐ Notify ban-service to propagate across roles                │
│                                                                │
│              [Cancel]      [Suspend user ▸]   (danger)         │
└────────────────────────────────────────────────────────────────┘
```

Submitting calls `ban-service` via `jeeb-gateway`. Optimistic UI flips the header status pill to `Suspended` and emits a 10s undo toast (Indefinite suspensions are reversible within 10s; after that, only Reactivate can lift). Audit row is written server-side before success returns.

## 6. States

### 6.1 List

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Initial load                | Skeleton: 8 rows pulsing; filter strip live; count placeholders.               |
| Empty (no data ever)        | Not possible in prod; show generic empty illustration in staging.              |
| Filtered to zero            | "No users match these filters." + "Clear filters" link.                        |
| Network error               | Inline retry banner; filter + selection preserved.                             |
| Partial permission          | Risk + phone + email columns redacted with a banner explaining missing role.   |
| Search latency > 1s         | "Searching…" inline note next to the search box.                               |
| Result count > 100k         | Hint banner: "Tighten filters for faster results."                             |

### 6.2 Profile

| State                       | Behavior                                                                       |
|-----------------------------|--------------------------------------------------------------------------------|
| Initial load                | Identity rail skeleton; overview cards individually skeletoned.                |
| Backend degraded            | Affected card shows "Data delayed · last good HH:MM"; rest of profile live.    |
| User soft-deleted           | All write actions disabled; banner with deletion date + restore window.        |
| User pending deletion (GDPR)| Banner with countdown; PII fields fully redacted (no reveal).                  |
| Active suspension           | Header status pill red; banner shows kind + reason + actor + lift date.        |
| Open dispute as party       | Disputes tab badge red; Overview surfaces the highest-priority dispute first.  |
| KYC pending                 | KYC chip pulses; click goes to the queue row for this submission.              |
| No `users.admin`            | Suspend ▾ button hidden; kebabs hide destructive entries.                      |

## 7. Interactions

| Action                       | Mouse                  | Keyboard           | Notes                                       |
|------------------------------|------------------------|--------------------|---------------------------------------------|
| Move row focus               | hover                  | `j` / `k`          |                                              |
| Open profile                 | row click              | `Enter`            | Opens in same tab; `Cmd/Ctrl+click` new tab.|
| Copy user id                 | kebab → Copy id        | `Shift+I`          | Writes to clipboard, 2s toast.              |
| Reveal masked PII            | "Reveal" chip          | `Shift+P`          | 30s exposure; logs `pii.revealed`.          |
| Switch tab                   | tab click              | `1`–`7`            |                                              |
| Suspend                      | Suspend ▾ → kind       | `Shift+S`          | Gated; opens DangerConfirm.                 |
| Reactivate                   | Suspend ▾ → Reactivate | `Shift+U`          | Only visible when suspended.                |
| Force re-KYC                 | Suspend ▾ → Re-KYC     | —                  | Resets KYC tier; user must resubmit.        |
| Force logout                 | Suspend ▾ → Logout     | —                  | Revokes all sessions; user remains active.  |
| Add note                     | "+ Add note"           | `n`                | 500 char limit; markdown subset.             |
| Add tag                      | "+ Add tag"            | `t`                | Picker autocompletes from existing tag set. |
| Open audit slice             | Audit button           | `Shift+L`          | Routes to `/audit?entity=user&id=…`.        |

## 8. Data contracts

```
GET /v1/admin/users
  ?role=rider|driver|courier|provider|merchant|staff
  &status=online|active|offline|in_review|suspended|deactivated
  &kyc=t1|t2|t3|pending|rejected|none
  &risk=low|medium|high
  &country=SA|JO|AE|…
  &joined_from=<iso>&joined_to=<iso>
  &last_seen_within=<iso8601_duration>
  &q=<search>
  &cursor=<opaque>&limit=25

→ 200 {
    items: [{
      user_id, display_name_en, display_name_local, phone_masked, email_masked,
      roles: [{ kind, state }],
      kyc: { tier, status },
      risk: { score, band },
      status: { kind, since, region? },
      last_seen_at
    }],
    next_cursor, total
  }

GET /v1/admin/users/:id
→ 200 {
    user_id, identity: { …rail fields… },
    roles, kyc, status, last_seen, devices_count, linked_count,
    overview: { at_a_glance, risk_reputation, recent_activity, wallet_summary, trust_safety },
    tabs: { available: ["activity","money","disputes","devices","linked","audit"] }
  }

GET /v1/admin/users/:id/activity?from=&to=&kinds=
GET /v1/admin/users/:id/money
GET /v1/admin/users/:id/disputes
GET /v1/admin/users/:id/devices
GET /v1/admin/users/:id/linked
GET /v1/admin/users/:id/audit?cursor=&limit=

POST /v1/admin/users/:id/suspend           { kind, until?, reason_code, internal_note,
                                              propagate_ban?: bool }
POST /v1/admin/users/:id/reactivate        { reason_code, internal_note }
POST /v1/admin/users/:id/force-rekyc       { reason_code, internal_note }
POST /v1/admin/users/:id/force-logout      { reason_code }
POST /v1/admin/users/:id/pii-reveal        { fields: ["phone","email"] }  → 200 (unmasked, 30s)
POST /v1/admin/users/:id/notes             { text }
POST /v1/admin/users/:id/tags              { add?: [...], remove?: [...] }
```

`POST /pii-reveal` is the only endpoint that returns raw PII; every call is audited (NFR-7.4). Suspends propagate to `ban-service`; wallet pauses propagate to `wallet-service` and `unified_payment_gateway` (refunds for cancelled jobs). The FE never mutates payment state directly — the gateway service does, per locked-in policy.

NSwag client: `@jeeb/api-clients/users`. All calls go through `jeeb-gateway`.

## 9. Accessibility

- The list is a real `<table>`; sortable headers are `<button>`s with `aria-sort`; rows have `aria-rowindex`.
- Mask reveal exposes an `<sr-only>` live region announcing "Phone revealed, will re-mask in 30 seconds".
- Identity rail is `<aside aria-label="User identity">`; tabs are a proper ARIA tablist with `role="tab"` / `role="tabpanel"`.
- Suspend modal is `<dialog>`; the typed-id input has `aria-describedby` linking to the warning text.
- Status pills convey state via icon + text + color, never color alone.
- Tag chips include `aria-label="tag VIP-driver, remove"` on their delete control.
- All time values use `<time datetime>`.

## 10. Performance budget

- List TTI ≤ 1.5s on 4G simulation; query p95 < 350ms (BFF caches 10s per filter hash).
- Profile bootstrap p95 ≤ 1.8s; tab content lazy-loaded on tab click.
- Identity rail loads from the cheapest endpoint first (`GET /users/:id` with `?fields=identity`) so the header renders before the tabs hydrate.
- Pagination is cursor-based; no offset queries on the backend.
- Search debounced 250ms; aborts on subsequent keystroke.
- Reveal endpoint capped at 5 calls/min per actor (rate-limited server-side).

## 11. Telemetry

- `users.list.viewed` { filter_hash, result_count }
- `users.list.row_opened` { user_id, position }
- `users.profile.viewed` { user_id }
- `users.profile.tab_opened` { user_id, tab }
- `users.pii.revealed` { user_id, fields, ttl_s }
- `users.action.suspended` { user_id, kind, reason_code, propagate_ban }
- `users.action.reactivated` { user_id, reason_code }
- `users.action.force_rekyc` { user_id, reason_code }
- `users.action.force_logout` { user_id }
- `users.note.added` { user_id, length }
- `users.tag.added` { user_id, tag } / `users.tag.removed` { user_id, tag }

`users.pii.revealed` is also written to the audit log server-side (NFR-7.4); telemetry is non-PII (counts and field names only).

## 12. Open questions

- **OQ-USR-1**: Should `users.viewer` see masked or fully redacted phone/email? Current design masks (last 2 visible); privacy team prefers full redaction with reveal-only-for-`users.admin`. → privacy + product call.
- **OQ-USR-2**: Suspend propagation — should `ban-service` propagation be opt-in (checkbox) or always-on? Risk of inconsistent state if reviewer forgets to tick. Leaning always-on with an opt-out for narrow cases.
- **OQ-USR-3**: Are tags free-form or from a controlled vocabulary? MVP currently allows free-form with autocomplete; ops wants controlled to prevent tag sprawl.
- **OQ-USR-4**: Linked accounts — show family/household links derived from shared device + payment + emergency contacts. Risk of false positives. Define the linking algorithm with T&S before exposing here.
- **OQ-USR-5**: GDPR / personal-data-export — Phase 2 ticket, but profile should at minimum surface "data export pending" if requested. Confirm Phase 1 includes the status badge.
- **OQ-USR-6**: Note markdown subset — bold, italic, links only, or also code blocks? Reviewer convenience vs XSS surface.
