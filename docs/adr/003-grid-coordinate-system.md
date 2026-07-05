# ADR-003: Grid coordinate system

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 02: Domain research & piece catalogue](../plans/02-domain-research-and-piece-catalogue.md)

## Context

Lego train track geometry requires sub-stud precision for curves (irrational
sin/cos offsets at 22.5°) while headings must remain exact. Plan 02 researched
official RC/Powered Up track dimensions and validated port coordinates against
LDraw part files.

## Decision

- **Unit:** 1 grid unit = 1 Lego stud (LDraw stud spacing 20 LDU; use stud as
  logical unit, not LDU).
- **Axes:** +X east, +Y south (screen-down), rotation clockwise in degrees.
- **Rotation:** 22.5° increments — **16 headings**. Standard Lego curves turn
  22.5° per segment (4 curves = 90° turn, 16 = full circle). Store headings as
  an **integer step index 0–15** (1 step = 22.5°): opposite = `(h + 8) % 16`.
- **Positions are floating point** in stud units. Port matching uses tolerance
  of **0.01 studs**; headings are exact integer steps.
- **Straight length:** 16 studs (part 53401); track is 8 studs wide.
- **Curve:** 22.5° arc at radius **R40** (part 53400). Port offsets precomputed
  as constants in the catalogue.
- **Switch:** straight route 32 studs; diverging route is an internal S-bend
  (36.87° out, 14.37° back) whose branch port exits at exactly **1 heading step**
  from the straight route.
- **Anchor:** Piece placement origin = **position of `ports[0]`** (primary port
  at `{0, 0}` in local coordinates).
- **Snapping:** free placement snaps anchor to integer stud coordinates and any
  of 16 headings; adjacent placement is port-driven.
- **Collision:** per piece per rotation, rasterized occupancy at 1-stud
  resolution from the rotated footprint polygon.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Integer stud grid, 90° rotations only | Simple mental model | Cannot represent 22.5° curve headings |
| 45° headings (8-way) | Fewer states | Wrong: one curve turns 22.5°, not 45° |
| Sub-stud grid (0.5 or 0.25 stud) | Bounded precision | Still cannot exactly represent irrational offsets |
| LDraw LDU as unit | Studio compatibility | Large numbers; awkward for UI |
| Tile-based (1 tile = 16 studs) | Coarse placement | Poor curve/switch fidelity |

## Consequences

- Connection engine (plan 03) can match ports by coincident position + opposite
  heading without floating-point heading arithmetic.
- Editor grid can show stud lines while allowing off-axis curve headings.
- Saved layouts must record catalogue version when geometry changes.

## References

- [Lego track geometry research](../research/lego-track-geometry.md)
- LDraw parts 53400, 53401, 53404, 53407
