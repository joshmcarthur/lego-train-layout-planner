# ADR-010: Layout generation algorithm

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 06: Layout generator](../plans/06-layout-generator.md)

## Context

Given a piece inventory, the app must search for geometrically valid candidate
layouts with rotation, respecting piece counts. Generation is combinatorially
explosive; the UI must not freeze. Search must run off the main thread and
return a bounded set of diverse candidates within a time budget.

## Decision

Adopt **pluggable greedy backtracking with seed** for MVP.

### Phase 1 algorithm

1. **Seed placement:** one piece at origin, rotation 0. Seed selection order:
   straight if available, else curve, else the first inventory key with count
   > 0. Inventory with all counts 0 returns empty immediately.
2. **Frontier:** maintain open ports that can accept new pieces.
3. **Expansion:** for each step, try piece types with remaining count > 0 and
   all rotations, placing **port-driven** — translate the candidate so its
   mating port coincides with the frontier port (per ADR 003/004).
4. **Prune:** `canPlace` branches with error-severity issues.
5. **Stop when:** max pieces placed, no frontier, or `maxDepth` reached.
6. **Score:** prefer `closedComponents.length > 0`, then more pieces placed,
   then fewer open ends.
7. **Dedup:** canonical hash — translate to minimum corner, generate 32
   symmetries (16 headings × optional reflection), serialize placements sorted
   (positions rounded to 0.01 studs), take lexicographically smallest string.
8. **Limits:** `maxResults=12`, `timeoutMs=8000`, `maxNodesExplored=50000`,
   `minPieces=2`.

### Worker API

`src/packages/layout-generator/worker.ts` uses raw `postMessage`:

```typescript
// → { type: 'search', inventory, options, seed }
// ← { status: 'progress'|'done', candidates, explored, ... }
```

Domain search code lives in `@track-layout/layout-generator` with no UI
imports, enabling Web Worker execution per ADR 002.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| SAT/CP solver | Optimal | Heavy dependency; hard to ship |
| Random shuffle only | Fast | Low valid hit rate |
| Constraint programming (JS) | Flexible | Learning curve |

## Consequences

- Same seed produces identical candidates (deterministic tests).
- Large inventories may return partial results within timeout.
- Post-MVP: WASM solver or progressive streaming behind same worker API.

## References

- [ADR 003: Grid coordinate system](./003-grid-coordinate-system.md)
- [ADR 004: Port and connection model](./004-port-and-connection-model.md)
- [ADR 005: Route graph semantics](./005-route-graph-semantics.md)
- [Plan 06: Layout generator](../plans/06-layout-generator.md)
