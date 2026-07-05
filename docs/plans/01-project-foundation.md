# Plan 01: Project Foundation

Establish the repository scaffold, recommended tech stack, module boundaries, CI,
and test harness so later plans can add domain logic and UI without rework.

**Source:** [`docs/prompts/planning.md`](../prompts/planning.md) — Architecture
Preferences, Suggested Module Boundaries, Non-Functional Requirements.

---

## Entry criteria

- Repository exists with planning prompt and reference assets path documented.
- No conflicting application code in `src/` (greenfield or clean slate).

## Exit criteria

- `npm run dev` serves a placeholder app shell.
- `npm run test` runs Vitest; `npm run test:e2e` runs Playwright (smoke test).
- `npm run build` produces a production bundle.
- CI workflow runs lint, typecheck, unit tests on push/PR.
- Module directory structure exists with README stubs per package.
- ADR **001-tech-stack** is **Accepted**.
- ADR **002-module-boundaries** is **Accepted**.

---

## Decisions & ADRs

### ADR 001: Tech stack

**Create before scaffolding:** `docs/adr/001-tech-stack.md`

**Decision to document:** Astro (current stable at implementation time) + Vite +
Lit + TypeScript. Pin exact versions in the ADR when written, not here.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| App shell | Astro | Static-first shell, file-based routing, islands for interactive editor |
| Interactive UI | Lit web components | Framework-agnostic components; aligns with owner preference #2 |
| Build | Vite (via Astro) | Fast HMR, ESM-native, Vitest integration |
| Unit tests | Vitest | Same config as Vite; fast domain-logic tests |
| E2E | Playwright | Cross-browser; critical flows in plan 08 |
| Lint/format | ESLint + Prettier | Repo already has Prettier config |

**Alternatives to capture in ADR:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Pure Vite + Lit (no Astro) | Simpler stack | More manual routing/PWA setup |
| React + Vite | Large ecosystem | Heavier; domain logic should stay framework-agnostic anyway |
| SvelteKit | Good DX | Not in owner preference list |

**Non-functional commitments in ADR:**

- Evergreen browsers only
- No backend; client-only state
- PWA target (manifest/SW deferred to plan 08)
- Domain packages must not import Astro/Lit

### ADR 002: Module boundaries

**Create before creating packages:** `docs/adr/002-module-boundaries.md`

**Proposed layout:**

```
src/
  packages/
    piece-catalogue/      # Piece defs, ports, rotations (no UI)
    connection-engine/    # Validity, adjacency, graph
    layout-generator/     # Search/heuristics
    inventory/            # Count tracking, random presets
    persistence/          # localStorage, URL codec, export
  apps/
    web/                  # Astro app: pages, layouts, Lit islands
  styles/                 # Global tokens, grid background CSS
tests/
  unit/                   # Mirror packages/
  e2e/                    # Playwright specs
  fixtures/               # Known-good/bad layouts (JSON)
docs/
  adr/
  plans/
public/
  manifest.webmanifest    # stub in plan 08
```

**Package rules (document in ADR):**

- `piece-catalogue`, `connection-engine`, `layout-generator`, `inventory`,
  `persistence` are **framework-agnostic** TypeScript libraries.
- UI lives only under `src/apps/web/` as Astro pages + Lit components.
- Cross-package imports: UI → domain only; domain packages never import UI.

---

## Architectural & non-functional requirements

| Area | Requirement |
|------|-------------|
| TypeScript | `strict: true`; no `any` in domain packages |
| Path aliases | `@lego/piece-catalogue`, etc., via `tsconfig` paths |
| Test coverage | Domain packages: tests required before merge in later plans |
| Performance | No long sync work on main thread in UI (enforced in plans 05–06) |
| Accessibility | Baseline: semantic HTML in shell; editor a11y in plan 08 |
| UI/UX (shell) | Minimal placeholder: app title, “Planning…” message; design tokens file for colours used in reference layout (light grid, rail greys, error red) |
| Offline | Build output must be static-hostable (GitHub Pages, Cloudflare Pages) |

---

## Implementation tasks

### 1. Initialize monorepo-style Node project

- `package.json` with scripts: `dev`, `build`, `preview`, `test`, `test:e2e`,
  `lint`, `typecheck`
- `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`,
  `playwright.config.ts`
- Dependencies: `astro`, `@astrojs/lit`, `lit`, `typescript`, `vitest`,
  `@playwright/test`, `eslint`, `@typescript-eslint/*`

### 2. Astro app shell

- `src/apps/web/pages/index.astro` — landing with link to `/editor` (stub)
- `src/apps/web/layouts/BaseLayout.astro` — meta, viewport, global CSS import
- `src/styles/tokens.css` — CSS variables: `--color-grid`, `--color-rail`,
  `--color-invalid`, `--color-valid`

### 3. Package stubs

Each package gets `index.ts` exporting a version constant, `package.json` type
path (or barrel only), and `README.md` describing responsibility per planning
prompt module list.

### 4. Test harness

- `tests/unit/smoke.test.ts` — `expect(true).toBe(true)` plus import of each
  package barrel
- `tests/e2e/smoke.spec.ts` — visit `/`, assert title visible

### 5. CI

- `.github/workflows/ci.yml`: Node 22, `npm ci`, lint, typecheck, `npm test`,
  `npm run build`, Playwright smoke test
- `.github/workflows/deploy.yml`: build and deploy to GitHub Pages after CI
  succeeds on `main` (requires Pages source = GitHub Actions in repo settings)

### 6. Developer docs

- Update root `README.md`: dev commands, plan index link, architecture overview

---

## Data models (stubs only)

No domain models yet. Define shared types file placeholder:

`src/packages/piece-catalogue/types.ts` — empty exported `/** Placeholder */`
comment; filled in plan 02.

---

## Commit & pull request strategy

### Commits (atomic, in order)

1. `chore: add node project and astro toolchain`
2. `chore: scaffold domain package directories and path aliases`
3. `chore: add vitest and playwright smoke tests`
4. `ci: add github actions workflow`
5. `docs: add ADR 001 tech stack and ADR 002 module boundaries`
6. `docs: update readme with development setup`

### Pull request

- **When:** Single PR when all exit criteria met (end of plan 01).
- **Title:** `feat: project foundation and toolchain`
- **Description (prose, no headings):** Explain Astro + Lit choice, module
  layout, and that this PR is infrastructure only with no track logic. Note CI
  commands for reviewers. No screenshots required (no meaningful UI yet); optional
  screenshot of placeholder page acceptable.

---

## Risks

- Astro + Lit integration quirks — verify `@astrojs/lit` island on a trivial
  counter component in this plan to de-risk plan 05.
- Path alias resolution in Vitest — configure `vitest.config.ts` `resolve.alias`
  to match `tsconfig`.

---

## User flows

None in this plan. Enables all flows in plans 04–08.
