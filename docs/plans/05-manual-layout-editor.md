# Plan 05: Manual Layout Editor

Top-down grid canvas for placing, rotating, and removing track pieces with
real-time validation feedback and inventory integration.

**Source:** planning prompt §5 Manual Layout Editor, UI/UX Notes, user flows 3
and 5.

---

## Entry criteria

- Plans 03–04 complete: `canPlace` / `validateLayout`, inventory remaining counts.
- Astro `/editor` route exists with inventory loaded.
- Design reference: `assets/reference-layout.png`.

## Exit criteria

- Interactive editor: place, rotate, remove, pan, zoom.
- Inventory panel shows remaining counts; updates on place/remove.
- Valid/invalid feedback on hover and placement: errors (overlap, misaligned
  ports) block placement; open ends render as neutral markers, never as errors.
- Undo/redo stack — **required for exit** (history depth: at least 20, capped
  at 50). If a genuine blocker emerges, escalate before cutting scope.
- Unit tests for editor state reducer; Playwright smoke for place-one-piece flow.
- ADR **008-editor-interaction-model** accepted.
- ADR **009-canvas-rendering-approach** accepted.

---

## Decisions & ADRs

### ADR 008: Editor interaction model

**File:** `docs/adr/008-editor-interaction-model.md`

**Recommended decision:**

| Action | Desktop | Notes |
|--------|---------|-------|
| Select piece type | Click palette item | Highlights selection |
| Place | Click grid cell | Snaps anchor to stud grid |
| Rotate | `R` key or scroll wheel before place | Cycles `allowedRotations` |
| Move | Drag placed piece (optional MVP) | If deferred, remove+replace only |
| Delete | Click piece + Delete/Backspace | Returns to inventory |
| Pan | Space+drag or middle mouse | |
| Zoom | Wheel + pinch | Clamp 0.25×–4× |
| Undo/redo | Ctrl/Cmd+Z / Shift+Z | Reducer history |

**Snap (per ADR 003):** on empty grid, the anchor snaps to integer stud
coordinates and any of the 16 headings (22.5° steps). When the ghost piece's
mating port comes within 2 studs of a compatible open port, placement becomes
**port-driven** — the piece snaps so its port exactly coincides with the target
port (this is what keeps off-axis-heading pieces aligned, since their
coordinates are not integers). Rotation cycles the piece's `allowedRotations`.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Drag-from-palette | Tangible DnD | Harder on touch |
| Tile-based click only | Simple | Poor curve alignment |

### ADR 009: Canvas rendering approach

**File:** `docs/adr/009-canvas-rendering-approach.md`

**Recommended decision:** **SVG layer stack** in Lit component (not Canvas2D).

- Layer 1: grid background (light lines per stud or per 16-stud major line)
- Layer 2: footprints (semi-transparent)
- Layer 3: track sprites (simple top-down paths per piece type)
- Layer 4: port markers on hover/invalid
- Layer 5: invalid overlay (red stroke)

**Rationale:** DOM/SVG accessibility hooks, crisp zoom, easier per-piece styling
to match reference (sleepers, junction blocks).

**Alternative:** Canvas2D — better for 1000+ pieces; overkill for MVP inventories.

---

## Data models

### `EditorState`

```typescript
interface EditorState {
  layout: Layout;
  inventory: Inventory;
  selectedPieceId: string | null;
  selectedRotation: Heading; // integer steps of 22.5° (0–15), per ADR 003
  selectedInstanceId: string | null;
  viewport: { panX: number; panY: number; zoom: number };
  history: { past: Layout[]; future: Layout[] };
}
```

### Actions (reducer)

```typescript
type EditorAction =
  | { type: 'SELECT_PIECE'; pieceId: string }
  | { type: 'ROTATE_CW' }
  | { type: 'PLACE'; x: number; y: number }
  | { type: 'REMOVE'; instanceId: string }
  | { type: 'SET_VIEWPORT'; viewport: Partial<Viewport> }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

---

## Implementation tasks

### 1. Editor state module

`src/apps/web/state/editor-reducer.ts` — pure reducer + helpers:

- `placePiece(state, pieceId, x, y, rotation)` calls `canPlace` before commit
- `removePiece` increments inventory
- History: push layout snapshot on successful place/remove (cap 50)

### 2. Lit components

```
src/apps/web/components/
  layout-editor.ts          # container
  editor-canvas.ts          # SVG viewport + pan/zoom
  editor-grid.ts            # background grid
  track-piece-svg.ts        # per-piece rendering
  inventory-palette.ts      # remaining counts, disabled at 0
  validation-overlay.ts     # issue highlights
  editor-toolbar.ts         # undo/redo, zoom reset
```

### 3. Piece rendering

`src/apps/web/rendering/piece-sprites.ts` — map `pieceId` + `rotation` to SVG path
data. Start with simplified geometry (rect arcs for curves); refine to match
reference image iteratively.

**UI/UX requirements (from reference):**

- Light grid background (`--color-grid`)
- Track: rail grey with sleeper ticks
- Junction/switch: distinct hub shape at port junctions
- Invalid placement: red outline + tooltip with `ValidationIssue` message
- Valid hover: green port dots
- Palette: icon + name + remaining count badge

### 4. Keyboard handlers

Attach in `layout-editor` with `@keydown` on focusable container (`tabindex=0`).

### 5. Wire to validation

On hover cell: `canPlace` preview without mutating state (ghost piece).
On place: commit only if no error-severity issues.

The editor composes two feedback sources: engine `ValidationIssue`s (overlap,
port mismatch, near miss, open ends) and its own **inventory check** — the
engine knows nothing about inventory (plan 03 layering). Attempting to place a
piece with a remaining count of 0 is blocked in the reducer with an
"out of pieces" message; the palette item is also disabled at 0.

Issue-to-copy mapping lives in the editor:

| Issue | User message | Treatment |
|-------|--------------|-----------|
| `OVERLAP` | "Pieces overlap" | Red outline, block |
| `PORT_MISMATCH` | "Rails don't align" | Red outline, block |
| `PORT_NEAR_MISS` | "Almost connects — nudge to snap" | Red outline, block |
| `OPEN_END` | (none — marker only) | Small neutral dot on open port |
| inventory exhausted | "No more of this piece" | Palette disabled, block |

### 6. Tests

- `tests/unit/editor/editor-reducer.test.ts` — place, undo, inventory sync
- `tests/e2e/editor-place.spec.ts` — load editor with fixture inventory, place
  straight, assert count decrements

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | 60fps pan/zoom for ≤50 placements; avoid full re-layout each pointer move |
| Accessibility | Keyboard rotate/place/delete; focus ring on toolbar; contrast ≥ 4.5:1 |
| Mobile | Viewport works; placement may be desktop-only with banner (plan 08) |
| Architecture | Reducer pure; catalogue/engine imported, not duplicated |
| Desktop-first | Explicit in ADR 008 |

---

## Commit & pull request strategy

This plan is large — **two PRs** recommended:

### PR A: Editor core (merge first)

**Commits:**

1. `docs: add ADR 008 editor interaction model`
2. `docs: add ADR 009 canvas rendering approach`
3. `feat(editor): add editor state reducer and history`
4. `feat(editor): add SVG grid and piece rendering`
5. `test(editor): add reducer unit tests`

**Title:** `feat(editor): layout editor state and SVG rendering`  
**Description:** Explain reducer, snap rules, rendering layers. Screenshot of grid
with one placed piece.

### PR B: Editor interactions

**Commits:**

1. `feat(editor): add inventory palette and placement flow`
2. `feat(editor): add validation overlay and tooltips`
3. `feat(editor): add pan zoom and toolbar`
4. `test(e2e): add editor place piece smoke test`

**Title:** `feat(editor): interactive placement and validation`  
**Description:** Walk through place/rotate/delete/undo. Screenshots of valid and
invalid placement states.

---

## User flow acceptance

3. **Manual build** → Select straight → Rotate → Place on grid → See remaining
   count decrease → Invalid adjacent placement shows red feedback.
5. **Resume (partial)** → Editor shows layout in memory; persistence in plan 07.

---

## Risks

- SVG performance with many nodes — batch piece groups; limit zoom max.
- Move-piece drag complexity — acceptable to ship delete+replace if schedule
  tight; document in PR if cut.

---

## Exit validation

Place fixtures `two-straights-valid` manually via editor actions equals fixture
layout validation passing.
