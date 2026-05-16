# Wireframe — KYC Document Viewer

**Route:** `/kyc/:userId/document/:docId` · **Remote:** `jeeb-admin-kyc` · **Role:** `kyc.reviewer`+
**Backend:** `auth-service` (submissions), `score-taking-service` (face match, liveness, fraud), object storage signed URLs

## 1. Intent

When the queue drawer is insufficient (risk ≥ 70, ambiguous docs, multi-doc applicants), reviewers open the full viewer. It is a single-purpose, distraction-free workspace optimized for:

- Side-by-side document + selfie inspection with deep zoom and rotation.
- OCR overlay verification (does the extracted text match what the eye sees?).
- Face-match and liveness signal review.
- A verdict form that captures reason code, freeform note, and (for rejections) which doc to re-upload.

Reviewer is expected to make a decision here — there is no "back to queue without verdict" muscle memory; they `Esc` only if they bail out.

## 2. Entry points

- KYC queue drawer → "Open full viewer".
- User profile → "View latest KYC submission".
- Direct deep link (audit trail, escalation handoff).

## 3. Layout (≥1280px)

Two-pane split: media viewer (left, fluid) + review form (right, 480px fixed).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to queue   Salem Al-Otaibi · submission #sub_8a31c2 · T2 · 4h 28m ago     [Audit] [User ▸]│
├───────────────────────────────────────────────────────────────────┬──────────────────────────────┤
│  [ID front][ID back][Selfie][Address proof]  ⟲ ⟳  + −  100% ▾  ⤢ │  Verdict                     │
│ ┌───────────────────────────────────────────────────────────────┐ │ ( ) Approve                  │
│ │                                                               │ │ ( ) Reject                   │
│ │                                                               │ │ ( ) Escalate                 │
│ │     [document image — zoomable canvas]                        │ ├──────────────────────────────┤
│ │                                                               │ │ Reason ▾                     │
│ │      ┌──────────────────────────┐  ← OCR bounding box         │ │   [select reason code…]      │
│ │      │ NAME: SALEM ALOTAIBI     │     hover shows extracted   │ ├──────────────────────────────┤
│ │      │ DOB:  1991-03-22         │     value vs profile.       │ │ Re-upload required           │
│ │      │ EXPIRES: 2029-08         │                             │ │  ☐ Gov ID front              │
│ │      └──────────────────────────┘                             │ │  ☐ Gov ID back               │
│ │                                                               │ │  ☐ Selfie                    │
│ │                                                               │ │  ☐ Address proof             │
│ │                                                               │ ├──────────────────────────────┤
│ │                                                               │ │ Note (visible to applicant)  │
│ │                                                               │ │  [________________________]  │
│ │                                                               │ │  [________________________]  │
│ │                                                               │ │                              │
│ │                                                               │ │ Internal note (audit only)   │
│ │                                                               │ │  [________________________]  │
│ └───────────────────────────────────────────────────────────────┘ ├──────────────────────────────┤
├───────────────────────────────────────────────────────────────────┤ Signals                      │
│ Selfie thumbnail                Liveness 🟢 passed                │  Face match  0.71  🟡        │
│   ┌──────────┐  Compare ▸                                          │  Doc auth    0.94  🟢        │
│   │   📷     │  Captured 2026-05-14 17:31 · iPhone 14 · iOS 18    │  Liveness    pass  🟢        │
│   └──────────┘  GPS: Riyadh, SA (matches profile)                 │  Device fp   match 🟢        │
├───────────────────────────────────────────────────────────────────┤ IP geo       match 🟢        │
│ Field check                       Source         Extracted        │  Sanctions   clear 🟢        │
│  Full name                        ID OCR         SALEM ALOTAIBI   ├──────────────────────────────┤
│   matches profile (98%)           profile        Salem Al-Otaibi  │           [Submit verdict ▸] │
│  DOB                              ID OCR         1991-03-22       │                              │
│   matches profile                 profile        1991-03-22       │                              │
│  Country                          ID OCR         SAU              │                              │
│   matches profile                 profile        SA               │                              │
└───────────────────────────────────────────────────────────────────┴──────────────────────────────┘
```

### 3.1 Media viewer details

- **Doc tabs**: one per uploaded artifact. Active tab underlined `--color-brand-primary`.
- **Toolbar**: rotate L/R, zoom +/−, fit width, 100% / 200% / 400%, fullscreen toggle.
- **Pan**: drag to pan; mouse wheel zoom; double-click toggles 100% ↔ 200%.
- **OCR overlay**: toggleable. Bounding boxes render at `--color-status-info` with 40% fill. Hover a box → tooltip shows `{ field, extracted_value, profile_value, match_pct }`.
- **Selfie pane**: collapsible 280px-tall strip at bottom with capture metadata. "Compare ▸" opens a 50/50 split modal aligning the doc face crop and selfie at the same scale.

### 3.2 Review form details

- **Verdict radios**: keyboard-driven. Submit disabled until verdict + (reason if not approve) chosen.
- **Reason ▾**: enum from `auth-service` — different sets per verdict (Approve has only "Clean" and "Approved with note"; Reject has 14 codes including `id-expired`, `name-mismatch`, `face-mismatch`, `low-quality`, etc.).
- **Re-upload required**: only enabled when verdict = Reject. At least one doc must be checked; surfaced to the applicant in their app.
- **Note (visible to applicant)**: short, public-facing message. 240-char limit. Pre-fills with the reason code's default text; reviewer edits.
- **Internal note**: free text, audit-only, never shown to applicant.

### 3.3 Signals panel

Six binary-ish signals from `score-taking-service`:

- **Face match** — cosine similarity of doc face vs selfie. Thresholds: ≥ 0.85 🟢, 0.65–0.85 🟡, < 0.65 🔴.
- **Doc auth** — document authenticity score. Same thresholds.
- **Liveness** — pass/fail from selfie capture.
- **Device fp** — fingerprint matches user's recent sessions.
- **IP geo** — IP country matches declared country.
- **Sanctions** — clear / hit / requires-review against OFAC + local lists.

A red signal does not auto-reject; it informs the reviewer. The verdict is always human.

## 4. States

| State                     | Behavior                                                                       |
|---------------------------|--------------------------------------------------------------------------------|
| Initial load              | Skeleton on left pane, signals panel skeletons, form fields disabled.          |
| Image load failed         | Per-doc retry button; signals load independently; verdict blocked.             |
| OCR not yet processed     | Field check rows show "Processing OCR…" with spinner; auto-refresh every 5s.   |
| Sanctions = hit           | Banner above verdict form: "Sanctions hit detected — escalation required."     |
|                           | Approve radio disabled; only Escalate or Reject allowed.                       |
| Already decided           | Form is read-only; banner "Decided on 2026-05-15 by ouday@jeeb.io · Approved"  |
|                           | with link to audit entry.                                                      |
| Submission expired (>7d)  | All form fields disabled; banner "Submission expired — applicant must resubmit"|
| Reviewer not on rota      | Form hidden; banner "You are not on the KYC review rota today."                |

## 5. Interactions

| Action          | Mouse                  | Keyboard            | Notes                                       |
|-----------------|------------------------|---------------------|---------------------------------------------|
| Next doc tab    | tab click              | `Tab` / `Shift+Tab` | Cycles within media pane only.              |
| Zoom in/out     | toolbar buttons        | `+` / `-`           |                                              |
| Rotate          | toolbar buttons        | `r` / `Shift+R`     |                                              |
| Toggle OCR      | toolbar toggle         | `o`                 |                                              |
| Fullscreen      | toolbar ⤢              | `f`                 | Native fullscreen on the media pane only.   |
| Compare         | Compare button         | `c`                 | Opens compare modal.                        |
| Approve         | radio                  | `Shift+A`           |                                              |
| Reject          | radio                  | `Shift+R`           |                                              |
| Escalate        | radio                  | `Shift+E`           |                                              |
| Submit verdict  | button                 | `Cmd/Ctrl+Enter`    | Disabled until valid.                       |
| Back to queue   | back link              | `Esc` then `Esc`    | First `Esc` clears focus, second navigates. |

`Cmd/Ctrl+Enter` is intentional friction — accidental approvals are higher cost than the keystroke.

## 6. Data contracts

```
GET /v1/admin/kyc/submissions/:id
→ 200 {
    submission_id, user_id, tier, status,
    docs: [{ id, kind, signed_url, mime, captured_at, exif }],
    selfie: { signed_url, captured_at, device, geo, liveness: { passed, score } },
    ocr: [{ doc_id, field, value, confidence, bbox }],
    profile: { full_name, dob, country, address, … },
    signals: { face_match, doc_auth, liveness, device_fp, ip_geo, sanctions },
    decision: null | { verdict, reason_code, note, internal_note, decided_by, decided_at }
  }

POST /v1/admin/kyc/submissions/:id/verdict
  { verdict, reason_code, note?, internal_note?, reupload_required?: ["id_front",…] }
→ 200 (audit entry id) | 409 (already decided) | 423 (sanctions hit, escalate only)
```

Signed URLs are short-lived (5 min). On expiry the FE auto-refreshes via `GET /v1/admin/kyc/submissions/:id/media-refresh`.

## 7. Accessibility

- Media canvas exposes ARIA description ("Document image, zoom 100%, rotated 0°"). Live region announces zoom/rotate changes.
- OCR overlay boxes are `<button>`s with `aria-label="OCR field NAME, extracted SALEM ALOTAIBI, matches profile Salem Al-Otaibi at 98 percent"`.
- Verdict radios in a `<fieldset>` with `<legend>` "Verdict". Reason `<select>` has matching `<label>`.
- Compare modal returns focus to the Compare button on close.
- All signals show icon + text + color; screen readers read the text label.
- Hard contrast on OCR overlay tested with high-contrast Windows theme.

## 8. Performance budget

- Doc image load p95 ≤ 1.2s on 4G; progressive JPEG decoding.
- Zoom uses CSS transform (`will-change: transform`), not image re-decode.
- OCR overlay rendered as SVG with `pointer-events: bounding-box`.
- Compare modal preloads the cropped doc face when the user hovers the Compare button for ≥ 200ms.

## 9. Telemetry

- `kyc.viewer.opened` { submission_id, from }
- `kyc.viewer.compare_used` { submission_id }
- `kyc.viewer.ocr_box_clicked` { submission_id, field }
- `kyc.viewer.verdict_submitted` { submission_id, verdict, reason_code, time_to_decision_ms }

`time_to_decision_ms` is reported to the operations dashboard "reviewer throughput" widget.

## 10. Open questions

- **OQ-KYC-V-1**: Should the reviewer be able to annotate the doc (draw boxes, add notes) for handoff to the next reviewer on escalation? Phase 2 candidate.
- **OQ-KYC-V-2**: How long do signed URLs remain valid after submission lock? Currently 5 min, but reviewers complain when a slow review forces a refresh mid-zoom.
- **OQ-KYC-V-3**: Should "Approve with note" be removed and replaced by a separate "Note to applicant" field always visible? Reduces enum noise.
