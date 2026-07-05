# Lego Train Layout Planner

Planning repository for a browser-based Lego train track layout tool.

**Live preview:** https://joshmcarthur.github.io/lego-train-layout-planner/ (deployed from `main` via GitHub Pages)

## Development

Requires Node.js 22+.

```bash
npm ci
npm run dev       # local dev server at http://localhost:4321/lego-train-layout-planner/
npm run build     # production bundle in dist/
npm run preview   # serve dist/ locally
npm test          # Vitest unit tests
npm run test:e2e  # Playwright smoke test (builds preview server first)
npm run lint
npm run typecheck
```

## Contents

- [`docs/prompts/planning.md`](docs/prompts/planning.md) — product scope and
  requirements (source of truth)
- [`docs/plans/README.md`](docs/plans/README.md) — ordered implementation plans
  (01–08 MVP, 09 post-MVP)
- [`docs/adr/README.md`](docs/adr/README.md) — architecture decision records
- [`assets/reference-layout.png`](assets/reference-layout.png) — reference
  design image

## Architecture

- **App shell:** Astro (`src/apps/web/`) with Lit islands (plan 05+)
- **Domain packages:** framework-agnostic TypeScript under `src/packages/`
- **Tests:** `tests/unit/` (Vitest), `tests/e2e/` (Playwright)

## Status

Implementation follows the plans in `docs/plans/` in order, starting with
[Plan 01: Project Foundation](docs/plans/01-project-foundation.md).
