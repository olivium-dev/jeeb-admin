# Tokens — OMDS / mobile parity audit

> Owner: Principal Flutter (OMDS) + FE platform (admin). Ticket: T-design-007.
> Last updated 2026-05-16.

The admin design pack claims "tokens mirror OMDS so admin and mobile feel like one product" (see [README §Design principles](./README.md)). This document audits that claim against the actual source-of-truth — `omds-flutter` (the Olivium / Jeeb Flutter design system) and the live `jeeb-mobile` brand wiring — and prescribes the canonical reconciliation.

The parity gap below is non-trivial: the admin tokens currently invent a brand color (`#1E5EFF` Jeeb blue) that does not appear anywhere in the mobile app, while the mobile app ships a fully-realised Jeeb green (`#1B6B4E`) seeded ColorScheme. Shipping the admin pack as-is would put the two surfaces visibly out of sync from day one.

## 1. Source-of-truth pointers

| Surface | Source | What it defines |
|---------|--------|-----------------|
| OMDS Flutter library | [`omds-flutter/omds_library/lib/src/theme/omds_theme.dart`](../../../omds-flutter/omds_library/lib/src/theme/omds_theme.dart) | M3 `ColorScheme` defaults + `ThemeData` builder |
| OMDS semantic tokens | [`omds-flutter/omds_library/lib/src/theme/color_tokens.dart`](../../../omds-flutter/omds_library/lib/src/theme/color_tokens.dart) | `OmdsColorTokens` (success/warning/info/grey scale/divider/shimmer) |
| Jeeb mobile brand wiring | [`jeeb-mobile/lib/core/theme/app_theme.dart`](../../../jeeb-mobile/lib/core/theme/app_theme.dart) | The Jeeb seed `#1B6B4E` and `ColorScheme.fromSeed(...)` invocation |
| Jeeb mobile color audit | [`jeeb-mobile/docs/design/03-color-token-mapping.md`](../../../jeeb-mobile/docs/design/03-color-token-mapping.md) | The canonical Jeeb M3 role values + OMDS overrides |
| Admin web tokens | [`./tokens.md`](./tokens.md) | The values audited here |

The `omds-flutter` library defaults to the stock M3 baseline (purple `#6750A4`). It is never consumed unthemed — every app applies its own brand seed via `OmdsTheme.lightWithScheme(ColorScheme.fromSeed(seedColor: ...))`. The Jeeb seed is `#1B6B4E`; that is the canonical Jeeb brand color, and the admin must converge on it.

## 2. Parity audit — current state

### 2.1 Brand color

| Role | Admin web (current) | OMDS Flutter default | Jeeb mobile brand seed | Verdict |
|------|---------------------|----------------------|------------------------|---------|
| Brand primary | `#1E5EFF` Jeeb blue | `#6750A4` (M3 purple — unthemed) | `#1B6B4E` Jeeb green | **DIVERGENT — admin must adopt `#1B6B4E`** |
| Brand secondary | (not defined) | (M3 default) | `#4A6741` muted earth | Admin to add |
| Brand tertiary | (not defined) | (M3 default) | `#3D6373` cool slate | Admin to add |

The blue `#1E5EFF` value in `tokens.md` has no upstream — it appears to have been picked in isolation when the admin pack was first drafted. Mobile has shipped Jeeb green since the OMDS integration landed in `app_theme.dart`. Admin must converge on the mobile seed, not the other way around: the mobile app is consumer-facing and has brand approval; the admin surface is internal and follows.

### 2.2 Status colors

| Role | Admin web | OMDS Flutter (`OmdsColorTokens`) | Jeeb mobile override | Recommendation |
|------|-----------|----------------------------------|----------------------|----------------|
| success | `#0E9F6E` | `#4CAF50` | `#1B6B4E` (uses brand primary for "Delivered") | Adopt **`#1B6B4E`** for "approved / paid / delivered" so admin and mobile agree on the success semantic. Reserve `OmdsColorTokens.successColor` (`#4CAF50`) only when a non-brand green is needed (rare). |
| warning | `#D97706` | `#FF9800` | `#FF9800` (default) | Adopt OMDS default **`#FF9800`** for parity. Drop the amber-600. |
| info | `#2563EB` | `#2196F3` | `#2196F3` (default) | Adopt OMDS default **`#2196F3`**. |
| danger | `#DC2626` | M3 `error` `#BA1A1A` (light) / `#FFB4AB` (dark) | M3 `error` (generated from seed) | Adopt **M3 `error` role** (`#BA1A1A` light, `#FFB4AB` dark). This is the only role that survives a brand reskin cleanly. |
| neutral | `#6B7280` | `greyScale600 = #757575` | `greyScale600 = #757575` | Adopt **`#757575`**. |
| focus-ring | `#1E5EFF` (brand) | (M3 `primary`) | (M3 `primary`) | Bind focus ring to **`var(--color-brand-primary)`** so it follows the brand seed automatically. |

### 2.3 Neutrals

The admin's gray ramp (`gray-50` → `gray-900`) is the Tailwind default; OMDS Flutter ships a Material-derived ramp (`greyScale50 = #FAFAFA`, etc.). At the ramp ends the deltas are <2% RGB and not perceptible. **Action: keep the admin ramp as-is, document it as a sanctioned web extension** (see §4). The OMDS Flutter ramp is not visually authoritative — `OmdsColorTokens` was written before the M3 scheme migration and is being phased toward `surfaceContainer*` roles in mobile.

### 2.4 Typography

| Property | Admin web | OMDS Flutter | Verdict |
|----------|-----------|--------------|---------|
| Latin stack | `Inter, "SF Pro Text", system-ui, ...` | `GoogleFonts.interTextTheme()` (Inter) | **Parity OK.** |
| Arabic stack | `"IBM Plex Sans Arabic", Inter, system-ui` | (not yet defined — mobile is Latin-only for MVP) | **Admin leads.** Backfill the same stack into mobile when Arabic launches (Phase 2). |
| Sizing scale | 12 / 13 / 14 / 16 / 20 / 24 / 32 | M3 displayLarge/headlineMedium/... auto-generated | **Different scales for different surfaces.** Admin is data-dense (13/14px body); mobile is touch-target driven (16px body). Keep both. Document the divergence. |

### 2.5 Spacing, radii, motion

| Token | Admin web | OMDS Flutter | Verdict |
|-------|-----------|--------------|---------|
| Spacing grid | 4-pt | M3 default 4-pt | **Parity OK.** |
| Card radius | `--radius-md = 8px` | `BorderRadius.circular(12)` (in `cardTheme`) | **DIVERGENT.** Admin tighter intentionally — keep, document. |
| Button radius | `--radius-md = 8px` | `BorderRadius.circular(8)` (in `elevatedButtonTheme`) | **Parity OK.** |
| Input radius | (not specified) | `BorderRadius.circular(12)` | Admin to set `--radius-input = 12px` for parity. |
| Modal radius | `--radius-lg = 12px` | `BorderRadius.circular(20)` (`dialogTheme`) | **DIVERGENT.** Admin tighter — keep, document. |
| Motion fast | `120ms ease-out` | (not defined in OMDS — uses Flutter defaults) | Admin defines, mobile inherits Flutter. Promote into OMDS. |

## 3. Canonical mapping (after reconciliation)

The table below is the target state. Apply in a follow-up PR; do not block T-design-007 wireframe sign-off on it.

### 3.1 Light theme — admin web after reconciliation

| Admin token | New value | Origin |
|-------------|-----------|--------|
| `--color-brand-primary` | `#1B6B4E` | Jeeb mobile seed |
| `--color-brand-hover` | `#155A40` | -8% L from primary |
| `--color-brand-pressed` | `#104832` | -16% L from primary |
| `--color-brand-secondary` | `#4A6741` | Jeeb mobile secondary seed |
| `--color-brand-tertiary` | `#3D6373` | Jeeb mobile tertiary seed |
| `--color-status-success` | `#1B6B4E` | Brand-aligned (matches `03-color-token-mapping.md` §3 mobile override) |
| `--color-status-warning` | `#FF9800` | `OmdsColorTokens.warningColor` |
| `--color-status-danger` | `#BA1A1A` | M3 `error` (light) — generated from seed |
| `--color-status-info` | `#2196F3` | `OmdsColorTokens.infoColor` |
| `--color-status-neutral` | `#757575` | `OmdsColorTokens.greyScale600` |
| `--color-focus-ring` | `var(--color-brand-primary)` | Follows brand |
| `--color-bg-selected` | `#E0EFE6` | Generated `primaryContainer @ 60%` of mobile light scheme |

### 3.2 Dark theme — admin web after reconciliation

| Admin token | Dark value | Origin |
|-------------|------------|--------|
| `--color-brand-primary` | `#8DD5AC` | Jeeb mobile dark `primary` (from `03-color-token-mapping.md` §2) |
| `--color-status-success` | `#8DD5AC` | Brand-aligned |
| `--color-status-danger` | `#FFB4AB` | M3 `error` (dark) |
| `--color-status-warning` | `#FFB74D` | M3-tuned warning |
| `--color-status-info` | `#64B5F6` | M3-tuned info |

### 3.3 Generated full ColorScheme (for reference)

The mobile-equivalent ColorScheme is generated by `ColorScheme.fromSeed(seedColor: 0xFF1B6B4E, ...)`. The web cannot run `ColorScheme.fromSeed` at build time, so admin ships the realised values as CSS custom properties. The realised set is in [`03-color-token-mapping.md` §2](../../../jeeb-mobile/docs/design/03-color-token-mapping.md#2-colorscheme-mapping-m3-roles--jeeb-usage); copy verbatim into `@jeeb/ui/tokens` light/dark maps.

## 4. Sanctioned web-only extensions

Web admin needs extras that mobile does not. These are NOT parity violations; they extend OMDS without redefining it.

| Web token | Reason |
|-----------|--------|
| `--text-xs = 12/16` | Admin tables run denser than any mobile surface (40px row height). Mobile has no body type smaller than 14. |
| Tighter modal / card radii | Admin is glance-density. Mobile is hand-feel. |
| `--bp-2xl = 1536px` | Admin renders at 1440+. Mobile breakpoints stop at 600. |
| Tabular-nums on amounts | Required for column alignment; mobile uses tabular-nums in some surfaces (earnings dashboard) but not as a default. |
| Audit color (deep red on dispute SLA breach) | No equivalent surface in mobile. |

Each web-only token must be labelled `WEB-EXT` in the source `@jeeb/ui/tokens` JSON so design reviews can tell extension from divergence.

## 5. Enforcement

Three gates, lowest-effort first:

1. **Build-time grep** in `jeeb-admin` CI:

   ```bash
   # block raw hex outside the tokens file
   rg --type css --type ts -n '#[0-9a-fA-F]{6}\b' src/ \
     --glob '!src/styles/tokens.{ts,css}' \
     && echo "Raw hex found outside tokens — use a token" && exit 1
   ```

2. **Token JSON parity check** — a single Node script under `jeeb-admin/scripts/check-token-parity.mjs` that reads `@jeeb/ui/tokens` and the mobile JSON export from `omds-flutter/omds_library/build/tokens.json` (added by the `omds_library` build) and fails CI if any role marked `parity: required` diverges. Roles marked `parity: web-ext` are skipped.

3. **Storybook visual diff** — Chromatic baseline includes a "brand sheet" story rendering each token swatch with its hex. Any token change shows up in PR review as a visual delta.

## 6. Migration plan

The admin pack is wireframe-complete; convergence on the canonical palette is a non-blocking follow-up that should land before the first jeeb-admin remote ships.

| Step | Owner | Effort | Gate |
|------|-------|--------|------|
| 1. Update `tokens.md` brand-primary table to point at this doc | FE platform | 10m | T-design-007 (this PR) |
| 2. Replace `--color-brand-primary = #1E5EFF` → `#1B6B4E` in `@jeeb/ui` source | FE platform | 30m | Pre-launch |
| 3. Re-generate Chromatic baseline for all admin Storybook stories | FE platform | 1h | Pre-launch |
| 4. Run the wireframe contrast check at the new brand (4.5:1 text on `#1B6B4E` succeeds — `#FFFFFF` on `#1B6B4E` = 5.94:1) | Design + a11y | 30m | Pre-launch |
| 5. Add the parity script to CI | FE platform | 1h | Pre-launch |
| 6. Promote `--motion-fast/default/slow` into `omds-flutter` so mobile inherits | Principal Flutter | 2h | Phase 2 |
| 7. Backfill Arabic typography stack into OMDS when MVP+Arabic launches | Principal Flutter | 1h | Phase 2 |

Steps 1–5 are independent of any backend. Steps 6–7 align with Phase 2 of the mobile roadmap.

## 7. Open questions

- **OQ-PARITY-1.** Brand have we approved web-blue vs web-green? The admin pack used `#1E5EFF` blue; mobile is committed to `#1B6B4E` green. Need an explicit Brand decision before §6 step 2 ships. Default position: align to mobile.
- **OQ-PARITY-2.** Should `OmdsColorTokens.successColor` default change from `#4CAF50` to the brand green at the OMDS level, or stay generic and let each app override? Current mobile override pattern argues for keeping OMDS generic and overriding per-app — admin should do the same.
- **OQ-PARITY-3.** Long-term: should `@jeeb/ui/tokens` be generated from a single Style Dictionary build that emits both CSS custom properties and a Dart constants file, so there's one source of truth across web + mobile? Worth exploring in Phase 2.

## 8. Sign-off checklist

- [x] Each admin role mapped to OMDS Flutter origin or marked `web-ext`
- [x] Brand divergence (`#1E5EFF` vs `#1B6B4E`) explicitly called out
- [x] Migration plan with effort estimates and gates
- [x] Enforcement gates defined (grep + parity script + Chromatic)
- [ ] Brand decision on OQ-PARITY-1 captured (pending)
- [ ] Migration steps 1–5 executed in a follow-up PR (pending)
