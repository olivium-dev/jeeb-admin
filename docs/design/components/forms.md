# Component — Forms

Every admin write is a form, and every form goes through `<Form>` with a Zod schema. This file is the contract for the form primitive, the field set, and the patterns that appear in KYC verdicts, dispute resolutions, suspend modals, refunds, payouts, and notes.

Package: `@jeeb/ui` → `import { Form, Field, ... } from '@jeeb/ui'`.

## 1. Intent

A single, schema-driven form contract that:

- Validates on the client (Zod) and re-validates the same schema server-side (shared via `@jeeb/api-clients`).
- Blocks submit until valid (no surprise 400s).
- Surfaces errors inline on blur for required fields, on submit for everything.
- Preserves user input across remounts (drawer flicker, route nav back).
- Provides one-line consumption: `useForm({ schema, defaultValues, onSubmit })`.

## 2. API

```tsx
import { z } from 'zod';
import { useForm, Form, Field } from '@jeeb/ui';

const schema = z.object({
  verdict: z.enum(['approve', 'reject', 'escalate']),
  reason_code: z.string().min(1),
  note: z.string().max(240).optional(),
  internal_note: z.string().min(20).max(2000),
});

const form = useForm({
  schema,
  defaultValues: { verdict: undefined, reason_code: '', note: '', internal_note: '' },
  onSubmit: async (values) => { await api.submitVerdict(values); },
});

<Form form={form}>
  <Field name="verdict" label="Verdict" required>
    <RadioGroup options={[
      { value: 'approve',  label: 'Approve' },
      { value: 'reject',   label: 'Reject' },
      { value: 'escalate', label: 'Escalate' },
    ]} />
  </Field>
  <Field name="reason_code" label="Reason" required>
    <ReasonSelect verdict={form.values.verdict} />
  </Field>
  <Field name="note" label="Note (visible to applicant)" hint="240 chars max">
    <TextArea maxLength={240} />
  </Field>
  <Field name="internal_note" label="Internal note (audit only)" required hint="≥ 20 characters">
    <TextArea />
  </Field>

  <Form.Submit>Submit verdict ▸</Form.Submit>
</Form>
```

Key behaviors of `useForm`:

- `values` / `errors` are reactive (Zustand under the hood — no React context cost).
- `isDirty`, `isSubmitting`, `isValid` exposed.
- `submit()` returns the parsed object or throws (used in keyboard handlers).
- `reset()` restores defaults; `setFieldValue(name, v)` for programmatic edits.

## 3. Field set

| Component        | Backing element                      | Validation hooks                                     |
|------------------|--------------------------------------|------------------------------------------------------|
| `<TextInput>`    | `<input type="text">`                | `z.string().min/max/regex`                           |
| `<TextArea>`     | `<textarea>`                         | `z.string().max(...)`                                |
| `<NumberInput>`  | `<input type="text" inputmode="numeric">` | `z.number().min/max/positive`                  |
| `<MoneyInput>`   | text input + currency suffix         | custom schema returning `{ amount, currency }`       |
| `<Select>`       | native `<select>` ≤ 8 options, otherwise combobox | `z.enum` or `z.string()`                |
| `<AsyncSelect>`  | combobox with server-side search     | `z.string().min(1)`                                  |
| `<RadioGroup>`   | `<fieldset>` + `<input type="radio">`| `z.enum(...)`                                        |
| `<Checkbox>`     | `<input type="checkbox">`            | `z.boolean()`                                        |
| `<CheckboxGroup>`| group of checkboxes                  | `z.array(z.enum(...))`                               |
| `<DatePicker>`   | `<input type="date">` (mobile) / wheel popover (desktop) | `z.coerce.date()`                |
| `<DateRange>`    | pair of date pickers                 | refined min-max                                      |
| `<TimezonePicker>`| async-select of IANA zones          | `z.string()`                                         |
| `<TagInput>`     | chip list + free text                | `z.array(z.string())`                                |
| `<TypedConfirm>` | typed-value field for destructive confirms | `z.literal(expected)`                          |
| `<FileDrop>`     | drag-drop + click-to-pick            | `z.array(File).min(1)`                               |
| `<MaskedPII>`    | masked-by-default reveal-on-action   | display-only, no validation                          |

All fields are controlled, accept `value` + `onChange`, and forward `aria-*` from their parent `<Field>`.

## 4. `<Field>` anatomy

```
┌─────────────────────────────────────────────┐
│  Label (required *)                          │  ← <label for=...>
│  ┌─────────────────────────────────────┐    │
│  │ control                              │    │  ← any field component
│  └─────────────────────────────────────┘    │
│  Hint text  |  Error text (when invalid)    │  ← <p id=help> / id=error
│                                  140 / 240   │  ← optional counter
└─────────────────────────────────────────────┘
```

Rules:

- The `*` on a required label is a `<span aria-hidden="true">` and the field gets `aria-required="true"`.
- Hint text is always there; error text replaces it visually when present (and is announced via `aria-describedby`).
- Counters are auto when `max` is set on the underlying schema.
- Disabled fields receive `aria-disabled="true"` and never `disabled` (so they remain focusable for tooltips). Exception: submit buttons use real `disabled`.

## 5. Layout

Forms render in one of three layouts via `<Form variant="...">`:

- `stacked` (default) — label on top, full-width control. Used in modals and drawers.
- `inline` — label and control on one row, label 160px fixed. Used in dense edit panes (e.g., dispute resolution column).
- `grid` — 2-column responsive at ≥ 1024px. Used in full-page detail forms (user profile edit, payout settings).

Spacing tokens:

- Field-to-field vertical gap: `--s-4` (stacked) / `--s-3` (inline).
- Label-to-control gap: `--s-2`.
- Help/error text gap: `--s-1`.

## 6. Validation timing

| Event                  | When validation runs                                                       |
|------------------------|----------------------------------------------------------------------------|
| onChange               | Never (typing in a previously-valid field never re-validates).             |
| onBlur                 | Required + format checks for the just-blurred field.                       |
| onSubmit               | Full schema parse. Submit blocked if not `isValid`.                        |
| onFieldDependencyChange| Re-validate dependent fields only (e.g., `reason_code` depends on `verdict`). |
| Server response 4xx    | Map server errors back to fields via the `errors[]` payload contract.      |

Error contract from server:

```json
{ "errors": [
  { "path": ["reason_code"], "code": "invalid", "message": "Pick a reason" },
  { "path": ["refund_amount"], "code": "out_of_range", "message": "Max 86.50 SAR" }
] }
```

`useForm` maps this onto field errors automatically when `onSubmit` rejects with a typed `FormServerError`.

## 7. Async select (server-driven)

Used heavily in admin: assignee picker, user lookup, reason codes scoped by verdict, country, IBAN search.

- Renders as a combobox (`role="combobox"` + `aria-expanded`).
- Server query debounced 250ms, min term length configurable per consumer (default 1, 0 for "show recent").
- Returns within 300ms p95 or shows a "Searching…" indicator inline.
- Items support secondary line text + icon; selecting commits the item id.
- Keyboard: arrow-up/down navigates list, `Enter` commits, `Esc` closes, `Tab` commits the highlighted item then leaves.

## 8. Money input

- Renders as a text input with `inputmode="decimal"`, locale-aware thousand separators.
- Currency rendered as a suffix in `--color-text-tertiary`. SAR for MVP; multi-currency Phase 2 — the schema returns `{ amount: number, currency: string }`.
- Negative values disallowed unless `allowNegative` prop set (used in refund + adjustment screens to permit `-` typed prefix).
- `inputmode="decimal"` triggers numeric keypad on touch (rare on admin but free).

## 9. Masked PII

`<MaskedPII>` is read-only and renders the masked form by default (e.g., `+9665••••12`). It has a `Reveal` chip that, when clicked, posts to `/v1/admin/users/:id/pii-reveal` (or equivalent endpoint per consumer) and replaces the masked value with the unmasked value for 30 seconds. After 30s it auto-re-masks. Each reveal emits an audit event server-side and `users.pii.revealed` telemetry (see `wireframes/user-management.md`).

Visual contract:

```
+9665••••12   [Reveal ▸]
+966551234412 (will re-mask in 28s)
```

## 10. States

Per `components/README.md` — every field implements `default`, `hover`, `focus`, `active`, `disabled`, `loading` (async/awaiting validation), `error`, `success`, `read-only`.

Edge cases:

| Case                                | Behavior                                                                    |
|-------------------------------------|-----------------------------------------------------------------------------|
| Field briefly invalid then fixed    | Error clears immediately when next blur passes.                             |
| Field invalid + then disabled       | Error text stays; field shows disabled style on top.                        |
| Server error after submit           | All affected fields highlighted; first error scrolled into view.            |
| Form unmounted mid-submit           | `useForm` cancels in-flight request via AbortController.                    |
| Browser back/forward                | `defaultValues` reseed from URL/router state if consumer provides it.       |

## 11. Submit button

`<Form.Submit>` is the only blessed submit affordance:

- Disabled while `!isValid` or `isSubmitting`.
- Shows inline spinner + "Submitting…" while pending.
- Survives `Enter` keystroke from any field (calls form submit).
- Refuses double-submit (guarded internally even if not disabled visually).
- For destructive flows, pair with `<DangerConfirm>` (see `modals.md`); the submit then triggers the modal rather than the API call.

## 12. Accessibility

- Each `<Field>` renders `<label htmlFor=...>` paired with the control by id.
- `aria-required="true"` on required controls; `aria-invalid="true"` when the field has an error.
- `aria-describedby` links the field to its hint AND its error (space-separated ids; both can be present).
- Radio groups are inside `<fieldset>` with `<legend>` containing the label.
- Submit failures move focus to the first invalid field and announce the count via a `<sr-only>` live region: "Form has 3 errors. First: Reason is required."
- `<MaskedPII>` exposes the reveal state via live region; the unmasked text is announced once on reveal.
- `prefers-reduced-motion` removes the spinner pulse on the submit button.

## 13. Performance

- `useForm` uses a single store; field components subscribe only to the slice they need — typing in `note` does not re-render `verdict`.
- Schema parses lazily: on blur for single field, on submit for full schema.
- Async-select results memoized by query string for the lifetime of the form.

## 14. Telemetry

- `form.<screen>.opened` { schema_name }
- `form.<screen>.submitted` { schema_name, duration_ms, used_keyboard }
- `form.<screen>.submit_blocked` { schema_name, errors_count }
- `form.<screen>.server_error` { schema_name, error_codes }
- `form.<screen>.cancelled` { schema_name }

`schema_name` is the Zod schema's `.describe('...')` value, so dashboards can group by intent (e.g., `kyc.verdict`, `dispute.resolution`, `user.suspend`).

## 15. Examples by screen

| Screen                              | Schema                                                                          |
|-------------------------------------|---------------------------------------------------------------------------------|
| KYC drawer quick verdict            | `{ verdict, reason_code?, note? }`                                              |
| KYC full viewer verdict             | `{ verdict, reason_code, note?, internal_note?, reupload_required? }`           |
| Dispute resolution                  | `{ status, verdict, reason_code, refund_amount, public_note, internal_note }`   |
| Refund approval                     | `{ approve|reject, amount, reason_code, internal_note }`                        |
| User suspend                        | `{ kind, until?, reason_code, internal_note, typed_id, propagate_ban }`         |
| User note                           | `{ text }`                                                                      |
| Reactivate                          | `{ reason_code, internal_note }`                                                |

## 16. Open questions

- **OQ-FORM-1**: Should `internal_note` be required everywhere (currently varies)? Audit completeness vs reviewer friction. Leaning required ≥ 20 chars for all suspends + rejects.
- **OQ-FORM-2**: Auto-save drafts for long forms (dispute resolution) — server-side already, FE confirms via toast. Frequency tuning: 1s debounce vs every 30s? Currently 30s with debounce on submit-button hover.
- **OQ-FORM-3**: Rich-text in `internal_note` — markdown subset is convenient (links to other cases), but XSS-tight rendering effort. Hold for Phase 2.
