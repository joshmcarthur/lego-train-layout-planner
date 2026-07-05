# ADR-009: Canvas rendering approach

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 05: Manual layout editor](../plans/05-manual-layout-editor.md)

## Context

The manual layout editor needs a top-down visual canvas showing a stud grid,
track pieces, placement feedback, and validation overlays. The reference layout
uses light grid lines, rail-grey track with sleeper ticks, and red invalid
outlines.

## Decision

Use an **SVG layer stack** inside a Lit component (not Canvas2D):

1. Grid background (light lines per stud; major lines every 16 studs)
2. Footprints (semi-transparent)
3. Track sprites (simple top-down paths per piece type)
4. Port markers on hover/invalid
5. Invalid overlay (red stroke)

Pan and zoom apply via an SVG `<g transform="translate(...) scale(...)">` around
world content. Design tokens from `src/styles/tokens.css` drive colours.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Canvas2D | Better for 1000+ pieces | Harder per-piece styling; weaker a11y hooks |
| WebGL | High performance | Overkill for MVP inventories |

## Consequences

- Lit components: `editor-canvas`, `editor-grid`, `track-piece-svg`,
  `validation-overlay`.
- Piece SVG paths live in `src/apps/web/rendering/piece-sprites.ts`.
- Performance target: 60fps pan/zoom for ≤50 placements; group pieces in `<g>`
  elements.

## References

- [Plan 05: Manual layout editor](../plans/05-manual-layout-editor.md)
- [Reference layout](../../assets/reference-layout.png)
