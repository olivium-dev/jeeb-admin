# Information Architecture — Jeeb Admin

Defines the global nav, route map, role-based access (RBAC), and cross-screen patterns. Companion to the per-screen wireframes in `wireframes/`.

## 1. Top-level nav

Fixed 240px left rail. Collapses to 56px (icon-only) via `[` shortcut or rail toggle. Always shows:

```
┌──────────────────────────────┐
│ JEEB · Admin            v1.0 │  ← brand + env badge (staging/prod)
├──────────────────────────────┤
│ ◉ Dashboard          d       │  ← role-filtered home
│ 🛡 KYC queue   (24)  k       │  ← badge = open items assigned to me
│ ⚖ Disputes    (7)   p       │
│ 💰 Finance           f       │
│ 🗺 Operations        o       │
│ 👥 Users             u       │
│ 📜 Audit log         l       │  ← read-only, admin-superuser only
├──────────────────────────────┤
│ 👤 ouday@jeeb.io     ▾       │  ← profile menu: theme, sign out
└──────────────────────────────┘
```

Badge counts refresh every 30s via SSE from `jeeb-gateway`. Stale (> 60s) badges fade to `--color-text-tertiary`.

## 2. Route map

| Route                              | Module Fed remote          | Min role                  |
|------------------------------------|----------------------------|---------------------------|
| `/login`                           | `jeeb-admin-shell`         | (public)                  |
| `/2fa`                             | `jeeb-admin-shell`         | (post-login)              |
| `/`                                | `jeeb-admin-shell`         | any                       |
| `/kyc`                             | `jeeb-admin-kyc`           | `kyc.reviewer`            |
| `/kyc/:userId`                     | `jeeb-admin-kyc`           | `kyc.reviewer`            |
| `/kyc/:userId/document/:docId`     | `jeeb-admin-kyc`           | `kyc.reviewer`            |
| `/disputes`                        | `jeeb-admin-disputes`      | `disputes.agent`          |
| `/disputes/:id`                    | `jeeb-admin-disputes`      | `disputes.agent`          |
| `/finance`                         | `jeeb-admin-finance`       | `finance.viewer`          |
| `/finance/reconciliation`          | `jeeb-admin-finance`       | `finance.ops`             |
| `/finance/payouts`                 | `jeeb-admin-finance`       | `finance.ops`             |
| `/ops`                             | `jeeb-admin-operations`    | `ops.viewer`              |
| `/ops/map`                         | `jeeb-admin-operations`    | `ops.viewer`              |
| `/users`                           | `jeeb-admin-users`         | `users.viewer`            |
| `/users/:id`                       | `jeeb-admin-users`         | `users.viewer`            |
| `/audit`                           | `jeeb-admin-shell`         | `superuser`               |

Routes the user lacks a role for render a 403 surface, not a 404 — admins need to know the page exists.

## 3. RBAC matrix

Six roles cover MVP. Roles are additive (a user may hold any combination). All mutations are recorded with the actor's role in the audit log.

| Role               | KYC | Disputes | Finance        | Ops     | Users         | Audit |
|--------------------|-----|----------|----------------|---------|---------------|-------|
| `kyc.reviewer`     | R/W | —        | —              | —       | R (basic)     | —     |
| `disputes.agent`   | R   | R/W      | R (txn lookup) | R       | R             | —     |
| `finance.viewer`   | —   | R        | R              | —       | R (basic)     | —     |
| `finance.ops`      | —   | R        | R/W (refunds)  | —       | R             | —     |
| `ops.viewer`       | R   | R        | —              | R       | R             | —     |
| `users.admin`      | R   | R        | R              | R       | R/W (suspend) | —     |
| `superuser`        | R/W | R/W      | R/W            | R/W     | R/W           | R     |

"R (basic)" = name + ID only; full profile gated to `users.viewer`+.

## 4. Cross-screen patterns

### 4.1 Page chrome

Every page renders inside a single shell pattern so muscle memory transfers:

```
┌─────────────────────────────────────────────────────────────────┐
│  Page title             [breadcrumbs]    [primary action ▸]     │
│  Subtitle / context line                                        │
├─────────────────────────────────────────────────────────────────┤
│  [tab 1] [tab 2] [tab 3]              [filter] [search] [view]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTENT                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Global shortcuts

| Key       | Action                                  |
|-----------|-----------------------------------------|
| `?`       | Open shortcut overlay                   |
| `/`       | Focus search                            |
| `g` then nav letter | Go to section (e.g. `g k` → KYC) |
| `[`       | Toggle left rail                        |
| `Esc`     | Close modal / drawer / clear focus      |
| `Cmd/Ctrl+K` | Open command palette (Phase 2)       |

Per-screen shortcuts documented in each wireframe doc.

### 4.3 Search semantics

`/` focuses the search box scoped to the current screen. Search is debounced 250ms, hits `jeeb-gateway` `/v1/search?scope=<screen>&q=<term>`, returns within 300ms p95 or shows a stale-results banner. ASCII-folding is server-side (so `salem` finds `سالم` and vice versa).

### 4.4 Empty / loading / error states

Every list-bearing screen renders four canonical states:

- **Initial loading**: skeleton rows (3 rows on desktop, 6 in tables, header + filter strip live).
- **Empty (no data ever)**: illustration + "No X yet" + one CTA.
- **Empty (filtered out)**: "No results for these filters" + "Clear filters" link.
- **Error**: inline error card with retry button; preserves filter state.

### 4.5 Destructive action pattern

Every destructive action (reject KYC, suspend user, force-refund) goes through `<DangerConfirm>` (see `components/modals.md`):

1. Trigger button red-outlined, never primary-filled.
2. Modal opens with action summary, expected effect, and a typed-name field ("Type the user's email to confirm").
3. On confirm: optimistic UI, undo toast for 10s if reversible, irreversible if not (modal warns).
4. Server response writes to `audit-service` with actor, reason, before/after state.

### 4.6 Detail-panel vs. detail-page

- **Drawer (480px right slide-in)** when the parent list is the primary surface and the detail is reference-only (KYC queue → quick-look, user row → mini-profile).
- **Full page route** when the detail has its own deep workflows with sub-tabs (dispute detail, user profile, KYC document viewer).

Never both for the same entity — pick one and stay consistent.

## 5. Auth and session

- SSO via the org IdP (OIDC). No password fields in `jeeb-admin` proper.
- 2FA mandatory on every login (TOTP). Session expiry: 8h idle, 12h max.
- Mutations require a fresh re-auth (step-up) if session > 30 minutes idle (NFR-7.4).
- Auth state lives in the shell remote; remotes read it via shared context. Never in localStorage.

## 6. Audit logging

Every screen has a "View audit" link in the kebab menu where applicable. Audit entries are write-only (admins cannot delete). Schema:

```
{ id, actor_id, actor_role, action, entity_type, entity_id,
  before, after, reason, ip, user_agent, occurred_at }
```

All admin mutations MUST emit an audit event before returning success (transactional). This is enforced server-side in `jeeb-gateway`; the FE only needs to surface the optional `reason` field where applicable.

## 7. Open questions

- **OQ-IA-1**: Do `disputes.agent` and `ops.viewer` need read-only finance? Current matrix says no, but ops triage often needs to see the txn that triggered a complaint. → product call.
- **OQ-IA-2**: Should the audit-log page be its own remote or stay in shell? Volume could justify a remote in Phase 2.
- **OQ-IA-3**: Bilingual admin in Phase 2 — confirm Arabic locale uses the same nav structure (no per-locale IA divergence).
