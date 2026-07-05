# ADR-002: Module boundaries

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 01: Project foundation](../plans/01-project-foundation.md)

## Context

The Lego Train Layout Planner separates framework-agnostic domain logic from
interactive UI. Without explicit module boundaries, domain code risks coupling
to Astro or Lit, making unit testing harder and blocking future reuse (e.g.
layout generator in a Web Worker).

Plan 01 establishes the directory layout and import rules that all later plans
(02–08) must follow.

## Decision

Adopt a monorepo-style layout with five domain packages and one web app:

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
  unit/                   # Vitest — mirrors packages over time
  e2e/                    # Playwright specs
  fixtures/               # Known-good/bad layouts (JSON, plan 02+)
docs/
  adr/
  plans/
public/
  favicon.svg             # manifest.webmanifest stub in plan 08
```

### Package responsibilities

| Package | Responsibility |
|---------|----------------|
| `piece-catalogue` | Piece definitions, connection ports, and rotation rules. Framework-agnostic; no UI imports. |
| `connection-engine` | Track connection validity, adjacency checks, and layout graph operations. |
| `layout-generator` | Search and heuristics for generating valid layouts from inventory. |
| `inventory` | Piece count tracking and random inventory presets. |
| `persistence` | localStorage, URL codec, and layout export/import. |

### Import rules

1. **UI → domain only.** Code under `src/apps/web/` may import `@lego/*` domain
   packages. Domain packages must never import Astro, Lit, or any file under
   `src/apps/web/`.
2. **Domain independence.** Until a later plan specifies a dependency, domain
   packages remain independent of each other. Planned cross-package imports:
   - `connection-engine` → `piece-catalogue` (plan 03)
   - `layout-generator` → `connection-engine`, `inventory` (plan 06)
   - `inventory` → `piece-catalogue` (plan 04)
   - `persistence` → layout/inventory types (plan 07)
3. **No circular imports** between domain packages.
4. **Tests** under `tests/unit/` import domain packages via the same `@lego/*`
   path aliases as application code.

### Path aliases

TypeScript path aliases in `tsconfig.json`:

- `@lego/piece-catalogue` → `src/packages/piece-catalogue/index.ts`
- `@lego/connection-engine` → `src/packages/connection-engine/index.ts`
- `@lego/layout-generator` → `src/packages/layout-generator/index.ts`
- `@lego/inventory` → `src/packages/inventory/index.ts`
- `@lego/persistence` → `src/packages/persistence/index.ts`

The same aliases are mirrored in `vitest.config.ts` `resolve.alias` so unit
tests resolve packages identically to the app.

Domain packages are typechecked via `tsconfig.packages.json` (excludes the
Astro app). The app shell is typechecked via `astro check`.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Single `src/lib/` folder | Simpler tree | No clear ownership; harder to enforce import boundaries |
| npm workspaces per package | True package isolation | Overhead for a small MVP; path aliases suffice |
| Domain logic inside Astro components | Faster initial scaffolding | Untestable without browser; blocks Web Worker generator |

## Consequences

**Positive:**

- Domain logic can be unit-tested in Vitest without a browser or Astro runtime.
- Clear ownership per package matches the implementation plan sequence.
- Path aliases give ergonomic imports without publishing internal packages.
- Layout generator can run in a worker (plan 06) because domain code has no UI
  dependencies.

**Negative:**

- Contributors must respect import direction; ESLint boundary rules may be
  added in a later plan if violations become common.
- Two tsconfig paths (`astro check` + `tsc -p tsconfig.packages.json`) require
  both to pass in CI.

## References

- [Plan 01: Project foundation](../plans/01-project-foundation.md)
- [ADR 001: Tech stack](./001-tech-stack.md)
- [`tsconfig.json`](../../tsconfig.json)
- [`vitest.config.ts`](../../vitest.config.ts)
