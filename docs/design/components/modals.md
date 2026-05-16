# Component — Modals, Drawers, DangerConfirm

Three overlay primitives cover every transient surface in admin. `<Modal>` for blocking dialogs, `<Drawer>` for non-blocking detail panels, `<DangerConfirm>` for destructive actions.

Package: `@jeeb/ui` → `import { Modal, Drawer, DangerConfirm } from '@jeeb/ui'`.

## 1. Intent

- **`<Modal>`** — small to medium centered dialog for confirmations, brief data entry, image compare. Modal traps focus, dims the page, demands a decision.
- **`<Drawer>`** — right-side 480px slide-in for parallel detail viewing (KYC quick-look, user mini-profile). Drawer does *not* trap focus deeply; the page below remains reachable.
- **`<DangerConfirm>`** — specialized modal for destructive or hard-to-reverse actions. Enforces the org's typed-name + audit pattern.

## 2. Decision matrix

| Use case                                  | Component        | Why                                                            |
|-------------------------------------------|------------------|----------------------------------------------------------------|
| Suspend a user                            | `DangerConfirm`  | Destructive; typed id required; audit + propagation.           |
| Approve refund > 500 SAR                  | `DangerConfirm`  | Reversible but expensive; typed amount required.                |
| Approve refund ≤ 500 SAR                  | `Modal`          | Inline submit; no typed re-entry.                               |
| Reassign KYC submission                   | `Modal`          | Single decision, returns to parent surface.                     |
| Image compare (KYC viewer)                | `Modal`          | Single artifact, blocks until dismissed.                        |
| KYC quick verdict from queue              | `Drawer`         | User still sees the queue; auto-advance to next row.            |
| Dispute timeline detail                   | `Drawer`         | Non-blocking peek at a single timeline entry.                   |
| Audit history for an entity               | `Drawer`         | Reference reading while continuing the primary task.            |
| Edit dispute draft                        | inline (no overlay) | Right column of the page itself; drafts persist server-side. |

## 3. `<Modal>`

### 3.1 API

```tsx
<Modal
  open={isOpen}
  onClose={close}
  title="Reassign submission"
  size="md"               // sm: 360, md: 480 (default), lg: 640, xl: 800
  initialFocusRef={refToFieldOrButton}
  closeOnOverlayClick={false}  // default false for forms, true for read-only
>
  <Modal.Body>
    {/* form / content */}
  </Modal.Body>
  <Modal.Actions>
    <Button variant="secondary" onClick={close}>Cancel</Button>
    <Button variant="primary" onClick={submit}>Reassign ▸</Button>
  </Modal.Actions>
</Modal>
```

### 3.2 Layout

```
                ┌─────────────────────────────────────────┐
                │  Title                              ✕   │  ← header, 56px, bottom border
                ├─────────────────────────────────────────┤
                │                                         │
                │   Body                                  │
                │                                         │
                │   ...                                   │
                │                                         │
                ├─────────────────────────────────────────┤
                │              [Cancel]  [Primary ▸]      │  ← actions, 64px
                └─────────────────────────────────────────┘
                  ← max-height: 80vh, body scrolls →
```

- Centered on viewport, 24px from top at minimum.
- Overlay: `rgb(0 0 0 / 0.48)` over `--color-bg-canvas`.
- Border-radius `--radius-lg`; shadow `--elev-3`.
- Enter: 200ms slide-up 8px + fade; exit: 120ms fade. Respects `prefers-reduced-motion`.

### 3.3 States

| State              | Behavior                                                              |
|--------------------|-----------------------------------------------------------------------|
| Loading content    | Skeleton inside the body; actions render but disabled.                |
| Form invalid       | Primary action disabled; do not allow `Enter` to submit until valid.  |
| Submitting         | Primary action shows spinner + "Submitting…"; modal not dismissable.  |
| Server error       | Inline `<Banner kind="danger">` above the form; modal stays open.     |
| Server success     | Modal closes; toast confirms; focus returns to the trigger.           |

### 3.4 Accessibility

- Renders as native `<dialog>` (HTMLDialogElement) with `aria-modal="true"` and `aria-labelledby` to the title.
- Focus moves to `initialFocusRef` or, if absent, to the first focusable element in the body.
- `Tab` traps focus inside the modal. `Shift+Tab` wraps backwards.
- `Esc` closes only if no submit is in-flight; if `closeOnOverlayClick={false}`, overlay click does NOT close.
- On close, focus returns to the element that opened the modal (`returnFocusRef` defaults to `document.activeElement` at open).
- `aria-describedby` may point to a body summary paragraph if the title alone is ambiguous.

### 3.5 Keyboard

| Key          | Action                                                          |
|--------------|-----------------------------------------------------------------|
| `Esc`        | Close (if allowed).                                              |
| `Enter`      | Default action (Primary) if focus is inside the form.            |
| `Tab`        | Focus next; wraps inside the modal.                              |
| `Shift+Tab`  | Focus previous.                                                  |

## 4. `<Drawer>`

### 4.1 API

```tsx
<Drawer
  open={isOpen}
  onClose={close}
  side="end"                 // 'end' (logical right; flips for RTL); 'start' rare
  width={480}                // px; pinned within [320, 720]
  title="Salem Al-Otaibi"
  trapFocus={false}          // default false — drawer is non-blocking
  closeOnOutsideClick={true}
>
  {/* content */}
</Drawer>
```

### 4.2 Layout

```
                                                ┌─────────────────────────┐
                                                │  Title              ✕   │
                                                ├─────────────────────────┤
                                                │                         │
                                                │  Content (scrolls)      │
                                                │                         │
                                                │                         │
                                                │                         │
                                                ├─────────────────────────┤
                                                │   [Action] [Action]     │  optional
                                                └─────────────────────────┘
```

- Full viewport height; 480px wide at the inline-end edge.
- No overlay dim by default (set `dim` to enable for noisy backgrounds).
- Slide enter `--motion-slow` (320ms) ease-out; exit 200ms.

### 4.3 States

Same matrix as Modal but `outside-click` defaults to close (drawer is non-blocking; clicking the row beneath should reopen with the new selection).

### 4.4 Accessibility

- Renders as `<aside role="dialog" aria-label="...">` (non-modal); `<dialog>` is reserved for `<Modal>` to keep semantics distinct.
- Focus moves into the drawer on open but does NOT trap unless `trapFocus={true}` is set.
- Page beneath remains tab-reachable; users can `Tab` out back into the queue.
- `Esc` closes from anywhere when focus is in the drawer; clicking the source row closes + reopens with the new selection.
- Drawer width never exceeds 50% of viewport; on narrow screens (<1024px) the drawer takes full width and the page beneath blurs.

### 4.5 Keyboard

| Key          | Action                                                          |
|--------------|-----------------------------------------------------------------|
| `Esc`        | Close drawer; focus returns to trigger.                          |
| `Tab` cycle  | Focus stays in drawer flow but does not trap.                    |
| `Cmd/Ctrl+]` | Pin / unpin drawer (Phase 2 — persistent drawer for power users).|

## 5. `<DangerConfirm>`

The pattern for every destructive or hard-to-reverse mutation (suspend, ban, force-rekyc, force-logout, reject KYC at high risk, refund > threshold, force-payout, force-cancel job, etc.). Built on top of `<Modal>` with a stricter contract.

### 5.1 API

```tsx
<DangerConfirm
  open={isOpen}
  onClose={close}
  onConfirm={async () => { await api.suspend(userId, payload); }}
  title="Suspend Salem Al-Otaibi (usr_8a31c2)?"
  expectedValue="usr_8a31c2"           // user must type this to confirm
  expectedLabel="user_id"              // shown next to the input
  effects={[
    'Prevent new sessions on all roles (Driver, Rider).',
    'Cancel any in-progress jobs (1 active ride) with refund.',
    'Pause pending payouts (320.00 SAR).',
    'Notify the user in app + SMS in their locale (ar-SA).',
  ]}
  reasonRequired
  internalNoteMin={20}
  confirmLabel="Suspend user ▸"
  reversibleWithinMs={10_000}          // shows "Undo" toast for 10s
>
  {/* optional extra fields (kind, until, propagate_ban) */}
</DangerConfirm>
```

### 5.2 Layout

```
                ┌──────────────────────────────────────────────────┐
                │  ⚠ Suspend Salem Al-Otaibi (usr_8a31c2)?     ✕  │  ← danger glyph, danger title color
                ├──────────────────────────────────────────────────┤
                │  This will:                                       │
                │   • Prevent new sessions on all roles.            │
                │   • Cancel 1 active ride (with refund).           │
                │   • Pause 320.00 SAR pending payouts.             │
                │   • Notify the user in app + SMS (ar-SA).         │
                │                                                  │
                │  Reason ▾                                         │
                │   [select reason code…]                           │
                │                                                  │
                │  Internal note (audit only, ≥ 20 chars)           │
                │   [____________________________________________]  │
                │                                                  │
                │  Type the user_id to confirm:                     │
                │   [ usr_8a31c2 ________________________________ ] │
                │                                                  │
                ├──────────────────────────────────────────────────┤
                │          [Cancel]      [Suspend user ▸]   (danger)│
                └──────────────────────────────────────────────────┘
```

### 5.3 Required contract

| Element           | Rule                                                                                  |
|-------------------|---------------------------------------------------------------------------------------|
| Title             | States the action + the entity being changed, in plain language.                       |
| Effects list      | ≥ 1 bullet; must include any auto-cancellations, refunds, notifications, propagations. |
| Reason            | Mandatory dropdown; codes scoped to the action; written to audit.                      |
| Internal note     | `≥ 20 chars` default; auditable; never shown to the affected user.                     |
| Typed confirm     | User must type the exact `expectedValue` (typically id or email). Submit disabled otherwise. |
| Confirm button    | Always red-outlined danger style; never primary-filled.                                |
| Undo window       | If `reversibleWithinMs > 0`, post-confirm toast shows "Undo" for that duration.        |
| Audit             | Server emits an audit entry BEFORE returning success (transactional, NFR-7.4).         |

### 5.4 States

| State                  | Behavior                                                                       |
|------------------------|--------------------------------------------------------------------------------|
| Idle                   | Confirm disabled until typed value matches AND reason picked AND note ≥ min.   |
| Submitting             | Confirm shows spinner + "Submitting…"; cancel disabled too.                    |
| Server error           | Inline banner; form remains filled so the reviewer can retry or amend.         |
| Server success (reversible) | Modal closes; undo toast for `reversibleWithinMs`; optimistic UI updates. |
| Server success (final) | Modal closes; success toast (no undo); UI updates.                              |
| Race (entity changed since open) | Banner "This user's state changed since you opened this — refresh."  |

### 5.5 Accessibility

- Built on `<Modal>` so inherits dialog semantics, focus trap, focus return.
- Title prefixed with `<Icon aria-hidden>` and includes the danger word ("Suspend", "Reject", "Refund", "Cancel") — no euphemisms.
- Effects list is `<ul>` with `aria-label="effects of this action"`.
- Typed-confirm input has `aria-describedby` linking to the rule text and announces a clear mismatch error after blur.
- Confirm button announces "Disabled, type user_id to confirm" via `aria-describedby` until enabled.
- Live region announces success or failure on resolution.

### 5.6 Keyboard

| Key                   | Action                                                                |
|-----------------------|-----------------------------------------------------------------------|
| `Esc`                 | Close (only if not submitting).                                        |
| `Enter` in typed input| If valid + reason filled + note filled → fires confirm.                |
| `Cmd/Ctrl+Enter`      | Confirms from anywhere in the form (intentional shortcut).             |

### 5.7 Telemetry

- `danger.opened` { action, entity_type, entity_id }
- `danger.submitted` { action, entity_type, entity_id, reason_code, duration_ms }
- `danger.cancelled` { action, entity_type, entity_id }
- `danger.race_detected` { action, entity_type, entity_id }

`action` is the same key used in audit (e.g., `user.suspend`, `kyc.reject`, `dispute.refund`).

## 6. Cross-component rules

- Only one modal open at a time. Opening a modal while another is open queues the new one (next `Modal.open()` call waits for the first close).
- A drawer can coexist with a modal: opening a modal while a drawer is open dims the drawer too. Closing the modal restores drawer focus.
- Toasts (success / undo / error) render in a separate portal and survive overlay open/close.
- `Esc` only closes the topmost overlay; underlying overlays stay.

## 7. Performance

- Modal/Drawer mount lazily; portal target is a single `<div id="overlay-root">` injected by the shell.
- Body scroll lock applied only when a `<Modal>` is open (drawers do not lock scroll).
- `DangerConfirm` does not pre-fetch reason codes — that's a 1 RTT cost on first open per session, then cached.
- Animation runs on `transform` + `opacity` only (no layout thrash).

## 8. Examples by screen

| Screen                            | Component                              |
|-----------------------------------|----------------------------------------|
| KYC drawer (queue → quick verdict) | `<Drawer>` + inline `<Form>`           |
| KYC viewer "Compare" pop-out      | `<Modal size="lg">`                    |
| KYC reject (risk ≥ 70)            | `<DangerConfirm>` (typed user_id)      |
| Dispute "Take over case"          | `<Modal size="sm">`                    |
| Dispute refund > 500 SAR          | `<DangerConfirm>` (typed amount)       |
| Finance reconciliation drift fix  | `<Modal size="lg">` + `<DangerConfirm>` for final apply |
| Suspend user                      | `<DangerConfirm>`                      |
| Force re-KYC                      | `<DangerConfirm>`                      |
| Reveal PII                        | inline (no modal — `<MaskedPII>` reveal chip; audit-only) |
| Ops incident acknowledge          | inline button + toast (no modal)       |

## 9. Open questions

- **OQ-OVL-1**: Modal max-height — 80vh on a 900px screen is 720px; some forms (dispute resolution) push that. Decision: dispute resolution stays inline in the page column instead of a modal; modals don't carry that load.
- **OQ-OVL-2**: Drawer pinned mode (Phase 2) — should it persist across navigation? Yes for KYC reviewer power users; needs per-user setting.
- **OQ-OVL-3**: `DangerConfirm` typed-confirm string for accidents — use email for users (more memorable than id)? Tradeoff: email can be empty or shared. Decision: use the most-unique identifier available (id for users, code for refunds, batch_id for payouts).
