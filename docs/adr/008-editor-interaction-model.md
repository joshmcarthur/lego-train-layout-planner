# ADR-008: Editor interaction model

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 05: Manual layout editor](../plans/05-manual-layout-editor.md)

## Context

Plan 05 requires an interactive top-down editor for placing, rotating, and removing
track pieces with real-time validation. Users need predictable desktop controls,
snap behaviour aligned with ADR 003, and undo/redo for iterative design.

## Decision

| Action | Desktop | Notes |
|--------|---------|-------|
| Select piece type | Click palette item | Highlights selection |
| Place | Click grid cell | Snaps anchor to stud grid |
| Rotate | `R` key or scroll wheel before place | Cycles `allowedRotations` |
| Move | Drag placed piece (optional MVP) | **Deferred** — remove+replace only |
| Delete | Click piece + Delete/Backspace | Returns piece to available pool |
| Pan | Space+drag or middle mouse | |
| Zoom | Wheel + pinch | Clamp 0.25×–4× |
| Undo/redo | Ctrl/Cmd+Z / Shift+Z | Reducer history (cap 50) |

**Snap (per ADR 003):** on empty grid, the anchor snaps to integer stud
coordinates and any of the 16 headings (22.5° steps). When the ghost piece's
mating port comes within 2 studs of a compatible open port, placement becomes
**port-driven** — the piece snaps so its port exactly coincides with the target
port. Rotation cycles the piece's `allowedRotations`.

Editor is **desktop-first**; mobile placement posture is deferred to Plan 08
(ADR 015).

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Drag-from-palette | Tangible DnD | Harder on touch |
| Tile-based click only | Simple | Poor curve alignment |
| Drag-to-move placed pieces | Familiar CAD UX | Complexity; deferred for MVP |

## Consequences

- Pure reducer in `src/apps/web/state/editor-reducer.ts` with history stack.
- Snap helper separates port-driven and grid-driven placement.
- Keyboard handlers on a focusable editor container (`tabindex=0`).
- Inventory counts are not mutated on place/remove; remaining counts derive from
  layout placements.

## References

- [ADR 003: Grid coordinate system](./003-grid-coordinate-system.md)
- [Plan 05: Manual layout editor](../plans/05-manual-layout-editor.md)
