# ADR-001: Tech stack

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 01: Project foundation](../plans/01-project-foundation.md)

## Context

The Lego Train Layout Planner is a browser-based tool for designing valid train
track layouts from a fixed inventory. The product needs a static-first app shell,
interactive editor islands, framework-agnostic domain logic, fast unit tests, and
E2E coverage — all deployable to GitHub Pages without a backend.

Owner preferences (see [`docs/prompts/planning.md`](../prompts/planning.md))
favour a lightweight stack with Lit for interactive UI and domain logic kept
independent of any UI framework.

## Decision

Use the following stack, with versions pinned in `package.json` at
implementation time:

| Layer | Choice | Version (at acceptance) |
|-------|--------|-------------------------|
| Runtime | Node.js | `>=22.12.0` |
| App shell | Astro | `^7.0.6` |
| Astro integration | `@astrojs/lit` | `^4.3.0` |
| Interactive UI | Lit | `^3.3.2` |
| Language | TypeScript (strict) | `^5.9.3` |
| Build | Vite (via Astro) | bundled with Astro |
| Unit tests | Vitest | `^4.0.16` |
| E2E tests | Playwright | `^1.57.0` |
| Lint | ESLint + `eslint-plugin-astro` | `^9.39.2` |
| Format | Prettier | via editor / local config |

**Non-functional commitments:**

- Target evergreen browsers only (no IE or legacy polyfill burden).
- Client-only state — no backend, no server-side rendering of user data.
- Build output must be static-hostable (GitHub Pages, Cloudflare Pages).
- PWA (manifest, service worker) deferred to plan 08.
- Domain packages under `src/packages/` must not import Astro, Lit, or any UI
  code.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Pure Vite + Lit (no Astro) | Simpler stack; fewer integration points | Manual routing, meta, and PWA setup; more boilerplate for static hosting |
| React + Vite | Large ecosystem; familiar to many contributors | Heavier bundle; domain logic should stay framework-agnostic anyway |
| SvelteKit | Good DX; built-in routing | Not in owner preference list; adds a second UI paradigm alongside planned Lit editor |

## Consequences

**Positive:**

- Astro provides file-based routing, static output, and islands architecture
  with minimal JS on non-interactive pages.
- Lit components are framework-agnostic web components, aligning with the plan
  to keep domain logic in plain TypeScript packages.
- Vitest shares Vite's config and runs domain tests fast.
- Playwright gives reliable E2E coverage for critical flows in later plans.
- The stack deploys cleanly to GitHub Pages via `withastro/action`.

**Negative:**

- Astro + Lit integration must be verified early (see plan 01 Lit smoke
  counter) to de-risk the editor in plan 05.
- Path aliases must be mirrored in both `tsconfig.json` and `vitest.config.ts`.
- Lit components require `experimentalDecorators: true` and
  `useDefineForClassFields: false` in `tsconfig.json` for `@state()` /
  `@property()` decorators to typecheck and hydrate correctly under Astro SSR.
- Two TypeScript check paths: `astro check` for the app shell, `tsc` for domain
  packages.

## References

- [Plan 01: Project foundation](../plans/01-project-foundation.md)
- [Astro documentation](https://docs.astro.build/)
- [Lit documentation](https://lit.dev/)
- [`package.json`](../../package.json)
