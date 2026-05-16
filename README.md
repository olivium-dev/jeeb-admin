# jeeb-admin

Jeeb admin panel shell — React 19 + Vite 7 + Module Federation. Hosts KYC review, disputes, finance, operations, and user-management surfaces as federated remotes.

## Stack

- **React 19** + **react-router-dom 6**
- **Vite 7** with `@originjs/vite-plugin-federation`
- **TypeScript 5** in `strict` mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Tailwind 4** with semantic-role tokens from `docs/design/tokens.md`
- **TanStack Query 5** for server state
- **zod 3** for form validation
- **lucide-react** for icons (20px / stroke 1.5 per design)
- **Vitest 2** + Testing Library

## Quick start

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

Useful scripts:

| Script              | What it does                          |
|---------------------|---------------------------------------|
| `npm run dev`       | Vite dev server                       |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm test`          | Vitest (jsdom)                        |
| `npm run lint`      | ESLint, zero warnings allowed         |
| `npm run build`     | Typecheck + production build          |
| `npm run preview`   | Serve the production build locally    |

## Project layout

```
src/
  auth/             Auth context, login + 2FA pages, route guard
  shell/            Sidebar, top bar, app layout (responsive)
  pages/            In-shell pages (dashboard, placeholders, 404)
  lib/              Env, small utilities
  styles/           Tailwind entry + design tokens
  router.tsx        Route map (mirrors docs/design/information-architecture.md §2)
  App.tsx           Providers (QueryClient, Auth)
  main.tsx          Entrypoint
```

## Auth flow (T-web-001 acceptance criteria)

1. `/login` — email + password (zod-validated). Server returns a 2FA challenge ticket.
2. `/2fa` — 6-digit TOTP. Server returns a JWT access token (in-memory) and sets the http-only refresh cookie.
3. The shell schedules a silent refresh ~60s before the access token expires.
4. Idle longer than 30 minutes? Mutations require step-up re-auth (NFR-7.4 — surfaced by `isStepUpRequired`; enforced in mutation flows added in T-web-002+).
5. `/logout` clears the cookie and the in-memory session.

The session never touches `localStorage`. Tokens live in React state inside `AuthContext` only.

## RBAC

Routes are gated via `<RequireAuth roles={[...]}>`. The sidebar filters items the user has no role for. Roles the MVP recognises:

`kyc.reviewer`, `disputes.agent`, `finance.viewer`, `finance.ops`, `ops.viewer`, `users.admin`, `superuser`.

When a user navigates to a route they lack the role for, they see a 403 surface, not a 404 — admins need to know the page exists (per IA doc §2).

## Keyboard shortcuts

| Key            | Action                          |
|----------------|---------------------------------|
| `[`            | Toggle sidebar                  |
| `g` then nav   | Jump to a section (`g k` → KYC) |

## Responsive layout

Desktop-first. The app renders down to **1024px**. Below that we render a "Use a larger screen" notice — admin is not a phone surface. Default design target is 1440 × 900.

## Related docs

- `docs/design/tokens.md` — colour/spacing/type tokens
- `docs/design/information-architecture.md` — nav, routes, RBAC, cross-screen patterns
- `docs/qa/test-plan.md` — QA strategy

## Tickets

- **T-web-001 (JEEB-93)** — this scaffolding, auth, shell, layout.
- T-web-002 — KYC review queue
- T-web-003 — User management
- T-web-004 — Dispute resolution queue
- T-web-005 — Finance dashboard
- T-web-006 — Operations map
- T-web-007 — Audit log viewer
