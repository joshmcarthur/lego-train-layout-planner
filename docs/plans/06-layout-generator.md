# Plan 06: Layout Generator

Given inventory, search for geometrically valid candidate layouts with rotation,
respecting piece counts and optional closed-loop preference.

**Source:** planning prompt §4 Layout Generation / Combination Explorer, user
flow 2, performance NFR.

---

## Entry criteria

- Plan 03 complete: `validateLayout`, `buildRouteGraph`.
- Plan 04 complete: inventory counts available.
- Plan 05 is **not** a hard dependency: the search engine, worker, and carousel
  UI can be built and merged independently. Only the final "Open in editor"
  handoff requires plan 05; if the editor isn't merged yet, ship the carousel
  with that button disabled and wire it in a follow-up commit.

## Exit criteria

- Generator produces up to N candidate layouts within time budget.
- Search runs off main thread (Web Worker).
- UI: list/carousel of thumbnails; select loads into editor.
- Clear empty state when no layout found.
- Unit tests for search with tiny inventory (deterministic); integration test
  worker round-trip.
- ADR **010-layout-generation-algorithm** accepted.

---

## Decisions & ADRs

### ADR 010: Layout generation algorithm

**File:** `docs/adr/010-layout-generation-algorithm.md`

**Recommended decision:** **Pluggable greedy backtracking with seed** (MVP).

**Phase 1 algorithm:**

1. Seed placement: one piece at origin, rotation 0. Seed selection order:
   straight if available, else curve, else the first inventory key with
   count &gt; 0 (an inventory of only switches must still seed). Inventory with
   all counts 0 returns the empty result immediately.
2. Maintain frontier: open ports that can accept new pieces.
3. For each step, try piece types with remaining count &gt; 0, try rotations,
   placing **port-driven**: translate the candidate so its mating port
   coincides with the frontier port (per ADR 003/004 — never free placement).
4. `canPlace` prune branches with error-severity issues.
5. Stop when: max pieces placed, no frontier, or `maxDepth` reached.
6. Score layouts: prefer `closedComponents.length &gt; 0`, then more pieces
   placed, then fewer open ends.
7. Collect top K unique layouts, deduplicated by **canonical hash**: translate
   placements so the minimum corner is at the origin, generate all 32
   symmetries (16 headings × optional reflection), serialize each placement
   set sorted (positions rounded to the 0.01-stud tolerance before
   serializing), and take the lexicographically smallest string. Layouts
   identical up to translation, rotation, or mirroring count as one candidate.
8. **Limits:** `maxResults=12`, `timeoutMs=8000`, `maxNodesExplored=50000`.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| SAT/CP solver | Optimal | Heavy dependency; hard to ship |
| Random shuffle only | Fast | Low valid hit rate |
| Constraint programming (JS) | Flexible | Learning curve |

**Worker:** `src/packages/layout-generator/worker.ts` — message in/out:

```typescript
// → { inventory, options, seed }
// ← { status: 'progress'|'done', candidates: Layout[], explored: number }
```

### ADR 011: Closed-loop preference UX

**File:** `docs/adr/011-generator-ux.md`

**Toggle:** “Prefer closed loops” (default on) — filters/sorts candidates with
closed loops first; still show open layouts if none closed.

---

## Data models

```typescript
interface GeneratorOptions {
  maxResults: number;
  timeoutMs: number;
  preferClosedLoops: boolean;
  /** A lone piece is a valid open layout but not an interesting candidate */
  minPieces: number; // default 2
  seed?: number;
}

interface GeneratorProgress {
  explored: number;
  found: number;
  elapsedMs: number;
}

interface GeneratorResult {
  candidates: Layout[];
  exhausted: boolean;
  message?: string; // e.g. "No valid layout found"
}
```

---

## Implementation tasks

### 1. Core search

```
src/packages/layout-generator/
  index.ts
  search.ts           # backtracking
  frontier.ts         # open port queue
  scoring.ts
  dedupe.ts           # layout hash
  types.ts
  worker.ts           # Comlink or raw postMessage
```

### 2. Candidate placement rules

- Only attach to frontier ports (reduces search space).
- Optionally allow closed loop attempt by connecting frontier to existing open
  port on same layout.

### 3. Thumbnail rendering

**Decision: main-thread SVG.** The worker returns layout JSON only;
`src/apps/web/components/layout-thumbnail.ts` renders a small SVG per candidate
by reusing `piece-sprites` from plan 05. With ≤12 candidates of ≤50 pieces this
is well within a frame budget; worker-side rendering (OffscreenCanvas) is a
post-MVP optimization only if profiling demands it.

### 4. UI

```
src/apps/web/pages/generate.astro
src/apps/web/components/
  layout-generator-panel.ts
  layout-candidate-carousel.ts
```

**UI/UX:**

- CTA from editor/onboarding: “Generate layouts”
- Progress bar + “Explored X configurations”
- Cancel button (terminate worker)
- Carousel cards: thumbnail, piece count, “Closed loop” badge
- “Open in editor” on select
- Empty state illustration + suggest more pieces or random inventory

### 5. Tests

- Tiny inventory `{ straight-16: 2 }` → one valid colinear layout
- `{ straight-16: 1 }` → empty result (below `minPieces`, with message)
- Empty inventory → immediate empty result with message
- `{ curve-r40: 16 }` → circle candidate classified as closed loop
- `{ curve-r40: 15 }` → no closed loop possible; open candidates only
- Same seed twice → identical candidate list (determinism)
- Timeout returns partial if any found
- Worker message schema test

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | UI never blocks &gt; 100ms; worker handles search |
| Determinism | Same seed → same candidates (for tests) |
| Browser support | Workers in all evergreen targets |
| UX | Communicate combinatorial limits honestly in empty state |
| Architecture | Generator depends on engine + catalogue only |

---

## Commit & pull request strategy

### Commits

1. `docs: add ADR 010 layout generation algorithm`
2. `docs: add ADR 011 generator ux`
3. `feat(layout-generator): add backtracking search`
4. `feat(layout-generator): add web worker runner`
5. `feat(web): add generator page and candidate carousel`
6. `test(layout-generator): add search and worker tests`

### Pull request

- **When:** Generate flow works from inventory to editor handoff.
- **Title:** `feat(generator): layout candidate search and carousel`
- **Description:** Explain algorithm limits, timeout, and closed-loop toggle.
  Screenshots of carousel with multiple candidates and empty state.

---

## User flow acceptance

2. **Random play** → Random inventory → Generate → Pick candidate → Opens in editor.

---

## Risks

- Search still explosive on large inventory — enforce caps; show “partial results”.
- Canonical-hash dedup cost grows with layout size — hash lazily, only for
  layouts that pass scoring thresholds.

---

## Future improvements (post-MVP)

- Progressive result streaming in carousel
- WASM solver hook behind same worker API
