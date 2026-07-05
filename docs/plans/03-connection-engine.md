# Plan 03: Connection Engine

Implement geometric adjacency validation, placement collision detection, and
route graph construction on top of the piece catalogue.

**Source:** planning prompt §3 Piece Geometry & Connection Model, route validity
rules.

---

## Entry criteria

- Plan 02 complete: `PieceCatalogue` with tested definitions, ADR 003–004 accepted.
- Transform utilities produce world-space ports and footprints.

## Exit criteria

- `connection-engine` package implements placement validation and route analysis.
- Unit tests cover known-good joins, known-bad misalignments, overlaps, switch
  branching, closed loops vs open ends.
- Fixture layouts in `tests/fixtures/layouts/` with JSON schema documented.
- ADR **005-route-graph-semantics** accepted.

---

## Decisions & ADRs

### ADR 005: Route graph semantics

**File:** `docs/adr/005-route-graph-semantics.md`

**Recommended decision:**

- A **layout** is a set of **placements** `{ pieceId, x, y, rotation }`.
- **Two-tier validity.** Issues are split by severity:
  - **Errors** (layout is invalid, editor blocks placement): footprint
    overlap; two ports coincident but misaligned (facings not opposite or
    connectors incompatible); two ports nearly coincident (within 1 stud but
    outside connection tolerance) — a physically impossible near-miss.
  - **Info** (layout remains valid): **open ends** — ports with no partner.
    The product explicitly supports open routes (sidings, dead ends), and
    every switch on a loop necessarily leaves one branch port open. Open ends
    are reported for UI display and generator scoring, never as errors.
- **Route graph:** nodes = ports; edges = valid connections between coincident
  ports.
- **Internal traversal edges** distinguish topology per piece: a straight or
  curve links its two ports; a **switch** links its common port to each branch
  port (traversal chooses one); a **crossing** links only its two opposite port
  pairs — it is two independent paths, **not** a degree-4 junction you can turn
  at.
- **Closed loop:** a connected component is *closed* if there exists a cycle
  through connection edges and internal traversal edges. Switch branch ports
  and siding stubs hanging off the cycle do not disqualify it. A component with
  no cycle is *open*.
- **Switch path mode for MVP:** Editor validates geometry only; generator (plan
  06) treats switch as **all branches available** for reachability; optional
  `selectedBranch` on placement post-MVP.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Open ports are errors | Forces tidy loops | Contradicts product vision (open routes) and makes any switch layout invalid |
| Closed = all ports degree 2 | Trivial check | No switch or siding layout can ever be closed |
| Single path per switch only | Simpler train simulation | Harder placement validation |
| Crossing as degree-4 junction | Uniform graph | Misrepresents topology — trains cannot turn at a crossing |

---

## Data models

### `Placement`

```typescript
interface Placement {
  instanceId: string; // uuid per placed piece
  pieceId: string;
  x: number; // stud units, floating point (ADR 003)
  y: number;
  rotation: Heading; // integer steps of 22.5° (0–15, ADR 003)
}
```

### `Layout`

```typescript
interface Layout {
  schemaVersion: number;
  catalogueVersion: number;
  placements: Placement[];
}
```

### `ValidationResult`

```typescript
type ValidationIssue =
  | { severity: 'error'; code: 'OVERLAP'; a: string; b: string }
  | { severity: 'error'; code: 'PORT_MISMATCH'; instanceId: string; portId: string }
  | { severity: 'error'; code: 'PORT_NEAR_MISS'; instanceId: string; portId: string }
  | { severity: 'info'; code: 'OPEN_END'; instanceId: string; portId: string };

interface ValidationResult {
  valid: boolean; // true iff no error-severity issues; info issues allowed
  issues: ValidationIssue[];
}
```

Inventory checks are **not** the engine's concern — the engine depends only on
the catalogue. The editor layer (plan 05) composes engine issues with its own
inventory-exceeded feedback.

### `RouteGraph`

```typescript
interface RouteGraph {
  nodes: Map<string, { instanceId: string; portId: string; x: number; y: number }>;
  /** kind distinguishes port-to-port connections from within-piece traversal */
  edges: Array<{ from: string; to: string; kind: 'connection' | 'internal' }>;
  components: string[][]; // node id groups (connected via any edge kind)
  closedComponents: string[][]; // components containing at least one cycle
  openEnds: string[]; // ports with no connection edge
}
```

---

## Algorithms

### 1. World-space port map

For each placement, look up the catalogue's precomputed geometry:

```
{ ports, occupancy } = getTransformedGeometry(piece, rotation)
worldPort.position = translate(port.position, placement.x, placement.y)
```

Index ports spatially by quantized key `round(x / tolerance), round(y / tolerance)`
(with neighbouring-bucket lookup) and by `(instanceId, portId)`.

### 2. Footprint collision

Occupancy grid: mark all precomputed occupancy cells per placement (translated
by placement position rounded to integers). Overlap → `OVERLAP` error if same
cell claimed by two instanceIds.

### 3. Port connection check

Per ADR 004, connected ports occupy the **same world point**. For each pair of
ports whose positions coincide within tolerance:

```
function portsConnect(a, b): boolean
  return pointsCoincide(a.position, b.position)   // 0.01-stud tolerance
    && a.facing === opposite(b.facing)            // exact 180° apart
    && connectorsCompatible(a.connector, b.connector)
```

Classification per port pair:

- Coincident + aligned + compatible → **connection edge**
- Coincident but misaligned/incompatible → `PORT_MISMATCH` error on both ports
- Within 1 stud but not coincident → `PORT_NEAR_MISS` error (physically
  impossible near-join, catches off-by-tolerance placements)
- No nearby port → the port is an **open end** (`OPEN_END` info issue)

### 4. Route graph build

- Create node per port.
- Add **connection edges** from step 3.
- Add **internal edges** per piece: straight/curve link both ports; switch
  links common port to each branch port; crossing links only its two opposite
  port pairs (no turning at a crossing).
- Union-find over all edges for components.
- **Closed** component: contains at least one cycle. With union-find this is
  detected when adding an edge whose endpoints are already in the same set;
  alternatively `edgeCount ≥ nodeCount` per component. Branch stubs and sidings
  hanging off a loop do not disqualify closure.
- `openEnds` = ports with no connection edge.

Pseudocode:

```
function buildRouteGraph(layout, catalogue): RouteGraph
  ports = allWorldPorts(layout)
  edges = connectionEdges(ports) ++ internalEdges(layout, catalogue)
  return analyze(ports, edges)   // components, cycle detection, open ends
```

---

## Implementation tasks

### 1. Package structure

```
src/packages/connection-engine/
  index.ts
  placement.ts      # world transforms for a placement
  collision.ts      # footprint overlap
  adjacency.ts      # port connection checks
  validate.ts       # full layout validation
  route-graph.ts    # graph build + classification
  types.ts
```

### 2. Fixtures

`tests/fixtures/layouts/`:

| File | Purpose | Expected |
|------|---------|----------|
| `two-straights-valid.json` | Colinear join | valid; 2 `OPEN_END` infos |
| `straight-curve-chain-valid.json` | Straight + curve at 22.5° heading | valid |
| `overlap-invalid.json` | Footprint collision | `OVERLAP` error |
| `port-near-miss-invalid.json` | Ports ~0.5 stud apart | `PORT_NEAR_MISS` error |
| `port-misaligned-invalid.json` | Coincident ports, facings not opposite | `PORT_MISMATCH` error |
| `curve-loop-valid.json` | Circle of sixteen 22.5° curves | valid; 1 closed component; 0 open ends |
| `quarter-turn-valid.json` | Straight, four curves, straight (90° turn) | valid; 2 `OPEN_END` infos |
| `switch-siding-valid.json` | Loop with switch + siding straight | valid; closed component; 1 `OPEN_END` info (siding) |

### 3. Unit tests

- Each fixture: `validate()` expected valid/invalid with specific issue codes
  and severities per the table above.
- `buildRouteGraph()` on `curve-loop-valid`: one closed component.
- `buildRouteGraph()` on `switch-siding-valid`: component classified closed
  despite the open siding end (cycle-based closure).
- Crossing semantics: no crossing exists in the MVP catalogue (see research
  doc), but the engine's internal-edge rules must still be tested — use a
  **test-only synthetic crossing definition** to assert that two paths through
  a crossing remain separate components when not otherwise linked.
- Open straight terminator: one `openEnds` node.

### 4. Public API

```typescript
export function validateLayout(layout: Layout, catalogue: PieceCatalogue): ValidationResult;
export function buildRouteGraph(layout: Layout, catalogue: PieceCatalogue): RouteGraph;
export function canPlace(layout: Layout, candidate: Placement, catalogue: PieceCatalogue): ValidationResult;
```

`canPlace` = validate layout with candidate added (for editor preview).

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | `validateLayout` for ≤100 placements &lt; 5ms on M1-class laptop |
| Determinism | Same layout → same issues order (sort issues for stable UI) |
| Purity | No DOM, no storage — 100% unit-testable |
| UI/UX (downstream) | Issue codes map to user strings in plan 05 (`PORT_MISMATCH` → “Rails don’t align”) |
| Architecture | `layout-generator` and editor depend only on public API |

---

## Commit & pull request strategy

### Commits

1. `docs: add ADR 005 route graph semantics`
2. `feat(connection-engine): add placement world transforms`
3. `feat(connection-engine): add footprint collision detection`
4. `feat(connection-engine): add port adjacency validation`
5. `feat(connection-engine): add route graph builder`
6. `test(connection-engine): add layout fixtures and validation tests`

### Pull request

- **When:** All fixtures pass; API stable.
- **Title:** `feat(connection-engine): layout validation and route graph`
- **Description:** Explain validation severities, the open-end policy, and
  switch/crossing traversal semantics. Point reviewers to fixture JSON. No
  screenshots.

---

## Risks

- Facings are exact integer degrees; only positions use tolerance comparison.
  Never compare positions with `===`.
- Tolerance drift over long curve chains — accumulate placements from catalogue
  constants, not from previously rounded positions; the sixteen-curve circle
  test in plan 02 guards this.
- Curve port positions wrong — fix in catalogue (plan 02), not engine hacks.

---

## Acceptance criteria (planning prompt flows)

Enables: manual build validation (plan 05), generator correctness (plan 06),
share round-trip integrity (plan 07).
