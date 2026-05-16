# Jeeb Admin Panel — Test Plan

**Ticket:** T-qa-005
**Owner:** QA (web)
**Scope:** jeeb-admin (React + Vite + Module Federation)
**Status:** Draft v1.3 — 2026-05-16 (full §3.7 mobile-impact Maestro coverage — eight P0/P1 flows + admin-fixtures shim contract)

## 1. Purpose and Scope

This plan defines the test strategy, coverage, and exit criteria for the Jeeb admin panel MVP. Five operational surfaces are in scope:

1. Admin authentication (login + 2FA)
2. KYC review workflow
3. User management (suspend / unsuspend)
4. Dispute resolution
5. Finance dashboard
6. Operations dashboard
7. Mobile-side verification of admin-initiated state changes (jeeb-mobile)

Out of scope: end-user mobile app flows not driven by admin action (covered by `qa-mobile`), payment-gateway internals (covered separately for `unified_payment_gateway`), CMS content workflows (`creamati-cms`).

## 2. Test Strategy

### 2.1 Pyramid

| Layer | Tooling | Target ratio | Notes |
|---|---|---|---|
| Unit / component | Vitest + Testing Library | 60% | Pure components, hooks, reducers, role-guard logic |
| Integration | Vitest + MSW | 25% | Page-level with mocked BFF (`jeeb-gateway`) |
| E2E | Playwright | 15% | Critical paths only (auth, KYC approve/reject, suspend) |

### 2.2 Environments

| Env | Purpose | Data |
|---|---|---|
| Local | Dev iteration | MSW mocks + seeded staging DB |
| CI (PR) | Unit + integration + Playwright shard 1/4 | Ephemeral via Testcontainers BFF |
| Staging | Full E2E suite, smoke on deploy | Synthetic admin + KYC fixtures |
| Production | Synthetic post-deploy smoke only | Read-only checks, no mutations |

### 2.3 Quality Gates (CI-blocking)

- Vitest line coverage ≥ 80%, branch ≥ 70% (`vitest-coverage-c8-gate`)
- ESLint + TS strict pass (`eslint-9-flat-config-strict`, `typescript-strict-noUncheckedIndexedAccess`)
- Playwright critical-path suite green on Chromium + WebKit
- Bundle budget: main < 250 KB gz, route chunks < 80 KB gz (`ts-cicd-bundle-budget-gate`)
- Axe a11y: 0 serious / critical violations on covered pages (`playwright-axe-a11y-integration`)

### 2.4 Mocking

- BFF responses: MSW handlers shared between Vitest and dev server (`msw-shared-mocks`)
- 2FA TOTP: deterministic seed in non-prod envs
- Time: `freezegun`-equivalent via `vi.useFakeTimers()` for token expiry tests

## 3. Test Areas

### 3.1 Admin Authentication and 2FA

**Acceptance:** Admin authentication and 2FA.

| ID | Scenario | Level | Priority |
|---|---|---|---|
| AUTH-01 | Valid email + password → 2FA challenge presented | E2E | P0 |
| AUTH-02 | Invalid password → error, no 2FA step, no user enumeration leak | Integration | P0 |
| AUTH-03 | Valid TOTP code → session established, redirect to dashboard | E2E | P0 |
| AUTH-04 | Invalid TOTP → error, attempt counter increments | Integration | P0 |
| AUTH-05 | 5 failed TOTP attempts → account locked, audit log entry written | Integration | P0 |
| AUTH-06 | TOTP code reuse within window → rejected (replay protection) | Integration | P0 |
| AUTH-07 | Expired session token → forced re-auth, no silent refresh on admin | Integration | P1 |
| AUTH-08 | Logout invalidates server-side session (not client-only) | Integration | P0 |
| AUTH-09 | Role-based route guard: non-admin JWT cannot reach /admin/* | Unit | P0 |
| AUTH-10 | 2FA enrollment: QR code rendered, secret never logged | Integration | P0 |
| AUTH-11 | 2FA recovery codes: single-use, marked consumed in audit log | Integration | P1 |
| AUTH-12 | CSRF: state/nonce validated on OAuth/SSO callback if used (`oauth2-pkce-state-nonce`) | Integration | P0 |

**Security checks:** secrets never appear in localStorage, sessionStorage, or URL fragments; httpOnly + Secure + SameSite=Strict on session cookies.

### 3.2 KYC Review Workflow

**Acceptance:** KYC review workflow (approve / reject / resubmit).

States: `SUBMITTED → UNDER_REVIEW → (APPROVED | REJECTED | RESUBMIT_REQUESTED) → (terminal | back to SUBMITTED)`

| ID | Scenario | Level | Priority |
|---|---|---|---|
| KYC-01 | Reviewer opens queue → list paginated, sorted by submission age | Integration | P0 |
| KYC-02 | Open case → identity doc, selfie, extracted fields rendered | Integration | P0 |
| KYC-03 | Approve → state transitions to APPROVED, user notified, ledger entry | E2E | P0 |
| KYC-04 | Reject with reason from catalog → state REJECTED, reason persisted | E2E | P0 |
| KYC-05 | Reject without reason → form-level validation blocks submit | Unit | P0 |
| KYC-06 | Request resubmit with comment → state RESUBMIT_REQUESTED, comment delivered to user | E2E | P0 |
| KYC-07 | Reviewer cannot approve a case they submitted (separation of duties) | Integration | P0 |
| KYC-08 | Two reviewers cannot act on the same case concurrently (optimistic lock conflict surfaces 409) | Integration | P0 |
| KYC-09 | Approved case is read-only; no further state transitions possible | Integration | P0 |
| KYC-10 | PII redaction: ID numbers masked in list view, full only in detail view | Unit | P0 |
| KYC-11 | Audit log: every state transition has reviewer ID, timestamp, reason | Integration | P0 |
| KYC-12 | Document download: signed short-TTL URL, expires after 5 min | Integration | P1 |
| KYC-13 | Bulk reject prohibited (one-by-one only for MVP) | Unit | P1 |
| KYC-14 | RTL / Arabic name rendering correct (`flutter-l10n-rtl-arabic` analogue for web) | Unit | P1 |

**Edge cases:** double-click on Approve must not submit twice (idempotency key on mutation); slow network → optimistic UI with rollback on failure.

### 3.3 User Management (Suspend / Unsuspend)

**Acceptance:** User suspension / unsuspension.

| ID | Scenario | Level | Priority |
|---|---|---|---|
| UMG-01 | Search users by email, phone, ID | Integration | P0 |
| UMG-02 | Suspend user with reason → state SUSPENDED, active sessions revoked | E2E | P0 |
| UMG-03 | Suspended user's mobile app receives forced logout within next API call | Integration | P0 |
| UMG-04 | Suspended user cannot place new orders (verified via gateway smoke) | Integration | P0 |
| UMG-05 | Unsuspend → state ACTIVE, audit entry with both reviewer IDs | E2E | P0 |
| UMG-06 | Suspension reason mandatory; free-text length capped at 500 chars | Unit | P0 |
| UMG-07 | Suspension does not delete user data (GDPR distinction) | Integration | P0 |
| UMG-08 | In-flight orders on suspended user: state unchanged, finance flagged | Integration | P1 |
| UMG-09 | Wallet balance on suspended user: read-only, withdrawals blocked | Integration | P0 |
| UMG-10 | Audit log surfaces who-suspended-whom-and-why on user detail page | Integration | P0 |
| UMG-11 | Admin cannot suspend themselves | Unit | P0 |
| UMG-12 | Admin cannot suspend another admin without super-admin role | Integration | P0 |

### 3.4 Dispute Resolution

| ID | Scenario | Level | Priority |
|---|---|---|---|
| DISP-01 | Dispute queue paginated, sorted by SLA breach risk | Integration | P0 |
| DISP-02 | Open dispute → both parties' messages, order, payment status visible | Integration | P0 |
| DISP-03 | Resolve in favor of customer → refund triggered via unified_payment_gateway | E2E | P0 |
| DISP-04 | Resolve in favor of driver → release escrow to driver wallet | E2E | P0 |
| DISP-05 | Split resolution → two ledger entries, sums match original payment | Integration | P0 |
| DISP-06 | Resolution requires reviewer note ≥ 20 chars | Unit | P0 |
| DISP-07 | Resolved dispute is read-only; reopen requires super-admin | Integration | P0 |
| DISP-08 | Refund failure (gateway 5xx) → resolution stays pending, retry button shown | Integration | P0 |
| DISP-09 | Dispute SLA timer counts business hours per configured timezone | Unit | P1 |
| DISP-10 | Audit: full chronology preserved including reviewer reassignments | Integration | P1 |

### 3.5 Finance Dashboard

**Acceptance:** Dashboard data accuracy verification.

| ID | Scenario | Level | Priority |
|---|---|---|---|
| FIN-01 | Daily GMV matches sum of paid orders in window (tolerance: 0) | Integration | P0 |
| FIN-02 | Refunds shown net of original payment, never as separate revenue | Integration | P0 |
| FIN-03 | Currency totals respect per-currency precision (no float drift) | Unit | P0 |
| FIN-04 | Timezone: all aggregates labeled with TZ; toggle UTC/local works | Unit | P0 |
| FIN-05 | Date-range picker: inclusive start, exclusive end (documented) | Unit | P0 |
| FIN-06 | Drill-down: clicking a number opens the exact filtered transaction list | Integration | P0 |
| FIN-07 | Reconciliation: ledger sum == sum of completed payments + escrow + refunds | Integration | P0 |
| FIN-08 | Empty state (no transactions in window): explicit zero, not "—" | Unit | P1 |
| FIN-09 | CSV export: row count == on-screen count, currency strings, no Excel injection | Integration | P0 |
| FIN-10 | Stale-data indicator if BFF reports `lastSyncedAt` > 5 min | Integration | P1 |
| FIN-11 | Performance: dashboard interactive < 3 s at p95 on staging dataset | E2E | P1 |

**Accuracy verification approach:** seed staging with a deterministic synthetic dataset where every aggregate has a hand-computed expected value. Tests assert exact equality (no tolerance bands) for counts and per-currency minor-unit sums.

### 3.6 Operations Dashboard

| ID | Scenario | Level | Priority |
|---|---|---|---|
| OPS-01 | Active orders count matches matching-service live state | Integration | P0 |
| OPS-02 | Driver online count matches geolocation-service heartbeats | Integration | P0 |
| OPS-03 | Average ETA computed from last 100 deliveries, refreshed every 60s | Integration | P1 |
| OPS-04 | Heatmap regions: aggregation rounded to ≥ 8-driver bins (privacy) | Unit | P0 |
| OPS-05 | Alert banner: triggers on >5% order failure rate over 15 min | Integration | P1 |
| OPS-06 | Live updates via SSE/WS reconnect on drop (verified by killing socket) | E2E | P1 |
| OPS-07 | Dashboard load on cold cache < 4 s p95 | E2E | P1 |

### 3.7 Mobile-Side Verification of Admin Actions (jeeb-mobile)

**Why this section exists:** admin-panel writes are only correct if their downstream effect reaches the end-user surface. The web E2E in §§3.1–3.6 stop at the BFF response; this section closes the loop on the Flutter mobile app.

**Tooling:**
- `integration_test` driver for in-process verification (cold start, deep links, BLoC state).
- Patrol 3.x for native-permission and notification-center assertions (push delivery, system dialog acceptance) — see `flutter-patrol-e2e`.
- Maestro for black-box flows that span web admin → backend → mobile (`maestro-mobile-testing`); shared page objects via `runFlow` (`maestro-page-object-via-runflow`).
- MockK-equivalent in Dart: `mocktail` for BLoC dependency stubs (`flutter-mocktail-patterns`).
- All interactive elements MUST have stable `Key`/`Semantics` identifiers (no text-based finders) — RTL Arabic locale would otherwise break the suite (`flutter-l10n-rtl-arabic`).
- Coverage: `flutter test --coverage` gated by `very_good_coverage` ≥ 80% line on affected features (`flutter-coverage-very-good`).

**Device matrix (tiered, see `device-matrix-tiered-policy`):**
- Tier 1 (every PR): Pixel 6 API 34, iPhone 14 iOS 17.
- Tier 2 (nightly): Pixel 4a API 30 (low-RAM), iPhone SE 2nd gen iOS 16.
- Tier 3 (release-gate): low-end Android Go device + iPad.

| ID | Scenario | Level | Linked admin test | Priority |
|---|---|---|---|---|
| MOB-AUTH-01 | Admin-side session revoke (logout-all) → next mobile API call returns 401 → app force-logs-out, returns to login | integration_test + Patrol | AUTH-08 | P0 |
| MOB-UMG-01 | Admin suspends user → mobile app's next foreground refresh forces logout with "account suspended" screen (no crash, no silent retry loop) | integration_test | UMG-02 / UMG-03 | P0 |
| MOB-UMG-02 | Suspended user attempts deep-link entry → routed to suspension screen, not target route (`flutter-deep-linking-app-links`) | integration_test | UMG-03 | P0 |
| MOB-UMG-03 | Suspended user's wallet screen: balance read-only, "Withdraw" button disabled with reason tooltip; no withdrawal API call fires | widget + integration_test | UMG-09 | P0 |
| MOB-UMG-04 | Unsuspend → next login succeeds; no stale "suspended" cached state survives | integration_test | UMG-05 | P0 |
| MOB-KYC-01 | KYC APPROVED → FCM push delivered, tapping notification deep-links to KYC success screen (verify via Patrol) | Patrol | KYC-03 | P0 |
| MOB-KYC-02 | KYC REJECTED → push delivered with reason from catalog; in-app KYC screen surfaces reason and "Retry" CTA | Patrol | KYC-04 | P0 |
| MOB-KYC-03 | KYC RESUBMIT_REQUESTED → reviewer comment visible verbatim in mobile KYC screen, RTL-safe rendering for Arabic comments | widget + integration_test | KYC-06 | P0 |
| MOB-KYC-04 | KYC status update arriving while app is backgrounded → notification shown; foregrounding pulls latest state from BFF (no stale local state) | Patrol | KYC-03/04/06 | P0 |
| MOB-KYC-05 | Cold-start with pending KYC: status fetched on splash, screen reflects server truth (no flicker from cached APPROVED→REJECTED) | integration_test | KYC-09 | P1 |
| MOB-KYC-06 | PII redaction: ID number masked in mobile KYC summary card; full only revealed via explicit "Reveal" tap with biometric re-auth | widget | KYC-10 | P0 |
| MOB-DISP-01 | Admin resolves dispute in favor of customer → refund credit appears in mobile wallet within 60s; transaction row shows reason | integration_test + Maestro | DISP-03 | P0 |
| MOB-DISP-02 | Admin resolves split refund → mobile wallet shows two correctly-signed ledger entries summing to original payment | integration_test | DISP-05 | P0 |
| MOB-DISP-03 | Refund failure (gateway 5xx, admin retries) → no duplicate credit on mobile side after retry succeeds (idempotency) | integration_test | DISP-08 | P0 |
| MOB-DISP-04 | Dispute chat thread on mobile is read-only after admin marks resolved; "Reopen" CTA hidden for non-super-admin users | widget | DISP-07 | P1 |
| MOB-OPS-01 | Driver online heartbeat: when driver app is killed, geolocation-service marks offline within 30s → ops dashboard count decrements (verified by killing mobile process in Patrol) | Patrol | OPS-02 | P1 |
| MOB-OPS-02 | Active-order count on ops dashboard equals number of in-progress jeeber_request rows visible across paired client+jeeber mobile sessions in staging | Maestro | OPS-01 | P1 |
| MOB-OBS-01 | Every mobile-side action triggered by an admin write carries the originating `requestId` in client logs (for full chain debugging) | integration_test | §4.2 | P0 |
| MOB-A11Y-01 | Suspension and KYC-rejection screens pass `flutter_a11y` audit: text scale 200%, screen reader, sufficient contrast against OMDS dark theme | widget | §4.3 | P0 |

**Force-logout invariant (cross-cuts UMG-02/03 and AUTH-08):**
- Mobile BLoC must treat 401 from any authenticated call as an immediate logout signal — not as a transient retry.
- No silent token-refresh attempt on admin-revoked sessions (the refresh endpoint MUST also return 401, not 200, for revoked sessions — backend contract test owned by `principal-api-qa`).
- Verify no auth retry storm: at most one refresh attempt before logout (`pino-structured-logging-otel` log line asserted).

**Push notification contract (cross-cuts KYC and DISP):**
- FCM payload schema: `{ type: 'kyc.status' | 'dispute.resolved' | 'wallet.credit', subjectId, status, reasonCode?, locale }`.
- Locale-aware body rendered client-side from `reasonCode`, NOT server-rendered string (so RTL + ICU stays correct).
- Test on real device for delivery latency p95 < 10s (Patrol + Firebase Cloud Messaging staging project).

**Reuse classification for this section:** extend — wraps existing `auth-service` session-revoke, `notification-service` FCM dispatch, `wallet-service` ledger read, and `unified_payment_gateway` refund webhook contracts. No new mobile features; only test coverage extension.

## 4. Cross-Cutting Concerns

### 4.1 Authorization Matrix

Every page test asserts the role guard:

| Role | Dashboards | KYC | User mgmt | Disputes | Finance | Ops | Super-admin actions |
|---|---|---|---|---|---|---|---|
| `viewer` | R | R | R | R | R | R | — |
| `kyc-reviewer` | R | R/W | R | — | — | — | — |
| `ops-agent` | R | — | R | R/W | — | R/W | — |
| `finance` | R | — | R | R | R/W | — | — |
| `super-admin` | R/W | R/W | R/W | R/W | R/W | R/W | yes |

Negative tests: each role attempts every other role's write — expect 403 from BFF, UI shows no action button.

### 4.2 Audit Logging

Every state-changing action under test must verify an audit log entry exists with: `actorId`, `action`, `targetId`, `before`, `after`, `reason`, `timestamp`, `requestId`. Tests use the audit log read API; no direct DB peek.

### 4.3 Accessibility

- Axe scan in Playwright (`playwright-axe-a11y-integration`) on every covered page — 0 serious/critical.
- Keyboard-only walkthrough script for: login, KYC approve, suspend user.
- Color contrast verified against design tokens (no hardcoded hex).

### 4.4 Internationalization

- Locales covered: `en`, `ar` (RTL).
- Snapshot tests for date, currency, and number formatting per locale.
- No string concatenation across translations; ICU message format only.

### 4.5 Observability During Tests

- Every E2E run uploads HAR, video on failure, and trace.
- Failed test attaches `requestId` chain for backend correlation.

## 5. Test Data

| Dataset | Use | Source |
|---|---|---|
| `admin-fixtures.json` | Admin users, roles, 2FA seeds | Committed |
| `kyc-cases.json` | 50 cases across states, edge docs (passport, national ID, RTL names) | Committed |
| `dispute-fixtures.json` | 20 disputes, refund + split + escrow shapes | Committed |
| `finance-day.sql` | One day of seeded transactions with known totals | Committed (staging-only) |
| Synthetic load | k6 script, 50 RPS on read endpoints | `hey-oha-vegeta-perf-smoke` |
| `mobile-fcm-fixtures.json` | Deterministic FCM payloads for kyc.status / dispute.resolved / wallet.credit / auth.session.revoked (incl. `dispute_resolved_jeeber` + `wallet_credit_escrow_release` for M-DISP-02) | Committed ([`jeeb-mobile/qa/fixtures/mobile-fcm-fixtures.json`](../../../jeeb-mobile/qa/fixtures/mobile-fcm-fixtures.json)) |
| `admin-impact-fixtures.json` | Pre-seeded users, disputes, KYC submissions for each admin-driven state | Committed ([`jeeb-mobile/qa/fixtures/admin-impact-fixtures.json`](../../../jeeb-mobile/qa/fixtures/admin-impact-fixtures.json)) |
| `qa/maestro/admin-impact/*.yaml` | Eight admin-impact Maestro flows — 4 P0 (force-logout, KYC approve push, KYC reject RTL, dispute refund) + 4 follow-ups (KYC resubmit Arabic, dispute escrow release, driver-offline-on-kill, mid-session WS close) | Committed ([`jeeb-mobile/qa/maestro/admin-impact/`](../../../jeeb-mobile/qa/maestro/admin-impact/)) |
| `qa/scripts/curl-admin-*.sh` | Seven idempotency-safe admin-fixtures helpers (suspend, KYC approve/reject/resubmit, dispute resolve, driver-status poll) + `README.md` documenting the admin-fixtures shim contract | Committed ([`jeeb-mobile/qa/scripts/`](../../../jeeb-mobile/qa/scripts/)) |

No production data, no PII in repo. Test PII generated by faker with a fixed seed. Mobile test resources MUST NOT contain real FCM tokens or APNs certs — staging keys only, loaded via `--dart-define` (`flutter-env-dart-define`).

## 6. Risks and Open Questions

| # | Risk / Question | Owner |
|---|---|---|
| R1 | 2FA provider TBD (TOTP vs WebAuthn). Tests assume TOTP; revise if WebAuthn chosen. | Tech Lead |
| R2 | Audit log API not yet exposed by jeeb-gateway. Without it, KYC/UMG audit tests stub. | Backend |
| R3 | Finance reconciliation source-of-truth: ledger service or unified_payment_gateway? | Finance + Backend |
| R4 | Dispute SLA business-hours calendar not specified. | Product |
| R5 | Operations dashboard SSE/WS protocol not designed. | Backend |
| R6 | FCM payload schema for kyc/dispute/wallet pushes not yet ratified — MOB-KYC-* and MOB-DISP-01 assume the schema in §3.7; revise if changed. | Backend + Mobile |
| R7 | Auth-service contract on revoked-session refresh: must return 401, not 200 with new token. Contract test owner TBD. | Backend |
| R8 | Maestro Cloud vs self-hosted device-farm decision not made — affects MOB-OPS-02 paired-session feasibility (`maestro-cloud-vs-local`). | QA Mobile |

## 7. Entry / Exit Criteria

**Entry (to begin executing this plan):**
- jeeb-admin scaffolded with at least login page wired to jeeb-gateway dev env
- BFF endpoints for each surface available in staging (even if behind feature flag)
- Test data seeded in staging

**Exit (MVP go/no-go):**
- All P0 tests passing on staging (web AND mobile-side §3.7)
- ≥ 95% of P1 tests passing
- 0 P0/P1 bugs open
- Coverage gates green (web Vitest + Flutter `very_good_coverage`)
- Accessibility scan: 0 serious/critical on web (axe) and mobile (flutter_a11y)
- Synthetic prod smoke (read-only) green for 24h
- Force-logout-on-suspend verified end-to-end on Tier 1 device matrix
- KYC push notification delivery p95 < 10s on staging FCM project

## 8. Roles and Responsibilities

| Role | Owner |
|---|---|
| Test plan owner | QA web lead |
| Authoring unit/integration tests | Frontend engineers |
| Authoring Playwright suites | QA web |
| Authoring contract tests against jeeb-gateway | Backend + QA API |
| Sign-off on KYC review behavior | Compliance |
| Sign-off on finance reconciliation | Finance |
| Authoring mobile §3.7 tests (integration_test + Patrol + Maestro) | QA Mobile + Mobile engineers |
| Sign-off on §3.7 mobile-side verification | Mobile lead + QA Mobile lead |
| FCM payload contract owner | Backend (`notification-service`) |

## 9. References

- `qa-charter-template-per-repo`
- `test-pyramid-policy-org`
- `playwright-locator-stability-priority`
- `playwright-axe-a11y-integration`
- `vitest-coverage-c8-gate`
- `msw-shared-mocks`
- `react-testing-best-practices`
- `oauth2-pkce-state-nonce`
- `owasp-api-top-10-2023`
- `flutter-l10n-rtl-arabic` (RTL — web analogue + mobile direct)
- `flutter-patrol-e2e`
- `flutter-integration-test-driver`
- `flutter-coverage-very-good`
- `flutter-mocktail-patterns`
- `flutter-deep-linking-app-links`
- `flutter-env-dart-define`
- `maestro-mobile-testing`
- `maestro-page-object-via-runflow`
- `maestro-cloud-vs-local`
- `device-matrix-tiered-policy`
- `mobile-perf-budget`
- `mobile-accessibility-flow-tests`
- `mobile-release-gate-pyramid`
- `qa-handoff-mobile-matrix`

## 10. Change Log

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-05-15 | v1 (draft) | Initial plan for T-qa-005 | QA |
| 2026-05-16 | v1.1 (draft) | Added §3.7 mobile-side verification (force-logout, KYC push, wallet refund, ops driver-offline), mobile fixtures, FCM payload contract risks R6–R8, Tier-1/2/3 device matrix, mobile exit-criteria additions, mobile reference skills | principal-flutter-mobile-engineer |
| 2026-05-16 | v1.2 (draft) | Linked §5 to committed mobile-side scaffolds: `jeeb-mobile/qa/fixtures/{admin-impact,mobile-fcm}-fixtures.json` and four P0 Maestro flows under `jeeb-mobile/qa/maestro/admin-impact/` (force_logout_on_suspend, kyc_approve_push_deep_link, kyc_reject_reason_visible, dispute_refund_wallet_credit). Companion plan now at v1.2. | principal-flutter-mobile-engineer |
| 2026-05-16 | v1.3 (draft) | Closed §3.7 mobile-impact scaffold debt: four follow-up Maestro flows committed (KYC resubmit Arabic, dispute escrow release, driver-offline-on-process-kill, mid-session WS close on suspend) plus seven `qa/scripts/curl-admin-*.sh` helpers with a documented admin-fixtures shim contract (idempotency key namespacing, admin token scope, read vs mutate semantics). FCM fixture file extended with `dispute_resolved_jeeber` + `wallet_credit_escrow_release`. Companion plan now at v1.3. No remaining open scaffold debt for P0/P1 admin-impact scenarios. | principal-flutter-mobile-engineer |
