# Plan 02: Domain Research & Piece Catalogue

Research official Lego train track geometry, document findings, and implement an
extensible piece catalogue with footprints, ports, and rotations.

**Source:** planning prompt §3 Piece Geometry, Domain Research Tasks, Must Have
piece types.

---

## Entry criteria

- Plan 01 complete: TypeScript packages exist, tests run, ADR 001–002 accepted.
- `src/packages/piece-catalogue/` package stub present.

## Exit criteria

- Research document committed: `docs/research/lego-track-geometry.md`
- ADR **003-grid-coordinate-system** accepted.
- ADR **004-port-and-connection-model** accepted.
- Catalogue JSON/TS definitions for MVP piece types with unit tests.
- Each piece exposes: `id`, `name`, `outline`, `ports[]`, `allowedRotations`,
  `category`, `inventoryKey`, and precomputed per-heading geometry.
- Fixture file `tests/fixtures/pieces.json` for test consumption.

---

## Decisions & ADRs

### ADR 003: Grid coordinate system

**File:** `docs/adr/003-grid-coordinate-system.md`

**Recommended decision (validate in research):**

- **Unit:** 1 grid unit = 1 Lego stud (LDraw convention: stud spacing 20 LDU;
  use stud as logical unit, not LDU).
- **Axes:** +X east, +Y south (screen-down), rotation clockwise in degrees.
- **Rotation:** 22.5° increments — **16 headings**. Standard Lego curves turn
  22.5° per segment (4 curves = 90° turn, 16 = full circle; see research doc),
  so pieces downstream of a curve sit at 22.5° headings. Store headings as an
  **integer step index 0–15** (1 step = 22.5°) so heading arithmetic is exact:
  opposite = `(h + 8) % 16`, never floating-point degrees.
- **Positions are floating point** in stud units, not integers. Curve endpoints
  involve sin/cos of 22.5° (irrational), so positions cannot be constrained to
  an integer grid. Port matching uses a tolerance of **0.01 studs**; headings
  are exact integer steps and compared exactly.
- **Straight length:** 16 studs (part 53401); track is 8 studs wide.
- **Curve:** 22.5° arc at radius **R40** (40 studs to track centreline, part
  53400). Exact port offsets per heading documented in the research doc and
  precomputed as constants in the catalogue.
- **Switch:** straight route 32 studs; the diverging route is an internal
  S-bend (36.87° out, 14.37° back — the 24-32-40 Pythagorean triangle) whose
  **branch port exits at exactly 1 heading step (22.5°)** from the straight
  route. Internal angles never appear at ports, so the 16-heading grid holds.
- **Anchor:** Piece placement origin = **position of the piece's primary port**
  (`ports[0]`), so the anchor always lies exactly on a connection point. Other
  ports are defined in local coordinates relative to it. This makes port-to-port
  snapping (editor and generator) a simple translation with no half-stud
  bounding-box centre problems.
- **Snapping model:** free placement on empty grid snaps the anchor to integer
  stud coordinates and any of the 16 headings; placement adjacent to existing
  track is **port-driven** — the new piece's mating port is translated onto the
  target open port, which is what keeps off-axis-heading pieces exactly aligned.
- **Collision:** the catalogue precomputes, per piece per rotation, a rasterized
  occupancy set at 1-stud resolution (cells overlapped by the rotated footprint
  polygon). Collision checks compare these integer cell sets.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Integer stud grid, 90° rotations only | Simple mental model, exact math | Cannot represent 22.5° curve headings — geometrically wrong for Lego track |
| 45° headings (8-way) | Fewer states | Wrong: one curve turns 22.5°, not 45° — a 90° turn takes 4 curves |
| Sub-stud grid (0.5 or 0.25 stud) | Bounded precision | Still cannot exactly represent irrational curve offsets; false precision |
| LDraw LDU as unit | Studio compatibility | Large numbers; same irrational-offset problem; awkward for UI grid |
| Tile-based (1 tile = 16 studs) | Coarse placement | Poor curve/switch fidelity |

### ADR 004: Port and connection model

**File:** `docs/adr/004-port-and-connection-model.md`

**Recommended decision:**

- Each port: `{ id, localPosition: {x,y}, facing: Heading, connector: ConnectorType }`.
- **Position convention:** a port sits at the piece's physical rail-end
  boundary point, facing **outward**. Two connected ports occupy the **same
  world point** (within the 0.01-stud tolerance from ADR 003) with facings
  exactly 180° apart. This is the single convention used everywhere — plan 03's
  adjacency check matches coincident points; there is no "one stud step"
  neighbour offset.
- **Connector compatibility, not gender:** modern Lego train track (RC/PF era)
  has symmetric, genderless rail ends — any end mates with any end. Model this
  as a `ConnectorType` (MVP: single value `'rail'`) with a symmetric
  `connectorsCompatible(a, b)` function. **The research task must confirm this**
  (legacy 9V/12V or unusual pieces may differ); if a gendered or keyed end
  exists, add a connector type rather than changing the schema.
- **Switch modelling:** All physical ports exist on the piece; route graph
  (plan 03) may traverse one branch at a time for “chosen path” analysis, but
  editor shows all ports for placement validation.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Male/female gender flag | Familiar model | Factually wrong for modern track; forces schema change if disproven |
| Direction vectors only (no connector type) | Simpler | Cannot exclude incompatible piece systems later |
| Graph-only (no spatial ports) | Abstract | Cannot validate geometric alignment |

---

## Domain research tasks

Document in `docs/research/lego-track-geometry.md`:

Seed findings already gathered in that document — validate and extend during
implementation:

1. **Official piece list (MVP):** current-era (RC/Powered Up, 2006–present)
   plastic track only:
   - Straight, 16 studs — part **53401**
   - Curve, 22.5° arc, R40 — part **53400** (direction is placement rotation;
     there is no left/right curve variant)
   - Left switch point — part **53407**; right switch point — part **53404**
   - **No crossing:** crossings are not part of the standard current line (the
     2007 double-crossover set 7996 was discontinued); excluded from MVP
     inventory. Keep the `crossing` category in the schema for post-MVP
     third-party pieces.
   - Flex track (88492) — post-MVP; variable geometry doesn't fit the fixed
     port model
2. **Dimensions:** stud footprint, port positions, curve radius, switch branch
   angles and branch port offsets.
3. **Connector symmetry:** confirm modern rail ends are genderless and mutually
   compatible (informs ADR 004 `ConnectorType`); note any legacy exceptions.
4. **Prior art:** BlueBrick, Bricklink Studio, TrackPlan — note import/export
   formats; no compatibility required for MVP but record learnings.
5. **Combinatorial note:** typical inventory 10–50 pieces informs generator
   limits (plan 06).

Include citations (Bricklink, LDraw part library, Lego instructions) with URLs.

---

## Data models

### `PieceDefinition`

```typescript
/**
 * Piece orientation and port facing as integer steps of 22.5° (ADR 003).
 * 0 = east, 4 = south (90°), 8 = west (180°), 12 = north (270°).
 */
type Heading = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/** Stud units; floating point — curve endpoints are irrational (ADR 003) */
interface Point {
  x: number;
  y: number;
}

/** MVP has a single symmetric rail end; extend if research finds keyed ends */
type ConnectorType = 'rail';

interface PortDefinition {
  id: string;
  /** Relative to anchor (= ports[0] position, so ports[0].localPosition is {0,0}) */
  localPosition: Point;
  /** Direction the port points outward from the piece */
  facing: Heading;
  connector: ConnectorType;
}

/** Integer occupancy cell used for collision rasterization */
interface FootprintCell {
  x: number;
  y: number;
}

interface PieceDefinition {
  id: string;           // stable slug, e.g. 'straight-16'
  name: string;
  category: 'straight' | 'curve' | 'switch-left' | 'switch-right' | 'crossing';
  inventoryKey: string; // key in Inventory map
  /** Outline polygon in local coords; rasterized per heading for collision */
  outline: Point[];
  ports: PortDefinition[];
  allowedRotations: Heading[];
  /** heading steps turned when traversing curve from entry to exit (1 = 22.5°) */
  curveDelta?: 1;
}

/** Precomputed by the catalogue for each (piece, heading) pair */
interface TransformedGeometry {
  ports: Array<{ id: string; position: Point; facing: Heading; connector: ConnectorType }>;
  occupancy: FootprintCell[];
}
```

### `PieceCatalogue`

```typescript
interface PieceCatalogue {
  version: number;
  pieces: PieceDefinition[];
  getById(id: string): PieceDefinition | undefined;
  getByInventoryKey(key: string): PieceDefinition | undefined;
  all(): PieceDefinition[];
}
```

### Inventory keys (MVP)

| inventoryKey | Part | Description |
|--------------|------|-------------|
| `straight-16` | 53401 | Standard 16-stud straight |
| `curve-r40` | 53400 | 22.5° R40 curve (direction handled by rotation) |
| `switch-left` | 53407 | Left-hand point |
| `switch-right` | 53404 | Right-hand point |

No crossing in MVP — not part of the current standard Lego line (see research
doc). The `crossing` category remains in the schema for post-MVP third-party
pieces.

---

## Implementation tasks

### 1. Research document

Complete `docs/research/lego-track-geometry.md` with measured port coordinates
for each MVP piece. Include ASCII diagrams per piece showing ports and footprint.

### 2. ADRs 003 and 004

Write and mark Accepted after research validates or adjusts recommendations.

### 3. Transform utilities

`src/packages/piece-catalogue/transform.ts`:

- `rotatePoint(point, heading): Point` — uses a precomputed sin/cos table for
  the 16 headings; results compared with 0.01-stud tolerance
- `rotateHeading(facing, by): Heading` — `(facing + by) % 16`, exact integers
- `oppositeHeading(h): Heading` — `(h + 8) % 16`
- `getTransformedGeometry(piece, heading): TransformedGeometry` — memoized per
  (piece, heading); includes rasterized occupancy cells
- `pointsCoincide(a, b): boolean` — tolerance comparison, single source of truth

Unit tests: rotating 16 steps returns original within tolerance; 1-step and
4-step rotations of known straight ports match fixture coordinates; a chain of
**sixteen** curves returns to the origin (closes a circle) within tolerance and
a chain of **four** curves turns exactly 90°.

### 4. Piece definitions

`src/packages/piece-catalogue/pieces/*.ts` or single `pieces.ts` — one
definition per MVP type. Values must match research doc.

### 5. Catalogue loader

`src/packages/piece-catalogue/catalogue.ts` — builds `PieceCatalogue`, validates
unique ids, exposes `CATALOGUE_V1`.

### 6. Tests

`tests/unit/piece-catalogue/`:

- Each piece has ≥2 ports (except dead-end variants if any)
- Outlines and occupancy sets non-empty
- Port facings are outward-normalized (facing away from piece centre)
- `ports[0].localPosition` is `{0,0}` for every piece (anchor convention)
- Coordinate tests per piece at heading steps 0, 1, and 4
- Sixteen-curve circle closure and four-curve 90° turn tests (see transform
  utilities)
- Switch branch port exits at exactly 1 heading step from the straight route

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Extensibility | New piece = new definition file + catalogue registration; no engine changes |
| Accuracy | Port coordinates verified against research; tests are source of truth |
| Performance | Catalogue loaded once; O(1) lookup by id |
| UI/UX | No UI in this plan; export piece `name` and `category` for palette labels later |
| Versioning | `catalogue.version` incremented when port geometry changes (breaks saved layouts — document in plan 07) |

---

## Commit & pull request strategy

### Commits

1. `docs: add lego track geometry research`
2. `docs: add ADR 003 grid coordinate system`
3. `docs: add ADR 004 port and connection model`
4. `feat(piece-catalogue): add transform utilities`
5. `feat(piece-catalogue): add MVP piece definitions`
6. `feat(piece-catalogue): add catalogue loader`
7. `test(piece-catalogue): add piece and transform tests`

### Pull request

- **When:** After research + catalogue + tests green.
- **Title:** `feat(piece-catalogue): lego track definitions and geometry research`
- **Description:** Summarise coordinate convention, list MVP pieces, call out
  any uncertainty still open. Link research doc. No screenshots.

---

## Risks

- Official geometry ambiguity for switches/crossings — prefer LDraw/BlueBrick
  consensus; document assumptions in research.
- Wrong anchor choice breaks entire engine — validate with two-piece straight
  join test in plan 03 immediately after catalogue lands.

---

## Acceptance criteria

- `getTransformedGeometry(straight, 0)` and `getTransformedGeometry(straight, 180)`
  produce opposite-end ports that coincide when placed end to end, allowing a
  colinear join (validated in plan 03).
- Catalogue version exported for persistence schema.
