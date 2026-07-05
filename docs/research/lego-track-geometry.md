# Lego Train Track Geometry — Research Findings

Seed findings for plan 02 (Domain Research & Piece Catalogue). Verify measured
port coordinates during implementation; the facts below are sourced from the
references at the bottom.

## The current (RC / Powered Up era) track system

Introduced 2006, still current. All-plastic, no conductive rails. Four track
pieces are sold by Lego today, plus flex track:

| Piece | BrickLink part | Dimensions | Notes |
|-------|----------------|------------|-------|
| Straight | 53401 (alt 7389, 17275) | 16 studs long × 8 wide | In production 2006–present |
| Curve | 53400 | 22.5° arc, radius R40 | 16 per circle; 4 per 90° turn |
| Switch point, left | 53407 (alt 18612, 53406) | straight route 32 studs | Pairs with 53404 |
| Switch point, right | 53404 | straight route 32 studs | |
| Flex track | 88492 | 4-stud segment | Acts as 4/8/12-stud straight or loose curve; post-MVP |

**There is no crossing/crossover in the current line.** Lego released one
double-crossover set (7996, 2007, built from two 60128 halves) which was
quickly discontinued. Crossings are widely available from third parties
(TrixBrix, BlueBrixx, 4DBrix, BrickTracks) but are not standard Lego pieces.

## Curve geometry

- Arc: **22.5°** per curve — a 90° turn requires **4 curves**; a full circle
  requires **16**.
- Radius: **R40** — 40 studs measured to the track centreline. Track is 8 studs
  wide, so a full circle's outer diameter is (40 + 4) × 2 = **88 studs**
  (704 mm).
- Curve endpoint offsets involve sin/cos of 22.5° (irrational), so positions
  must be floating point with a tolerance; headings stay on an exact 22.5°
  grid.

## Straight geometry

- 16 studs long, 8 studs wide. Rails 6 studs apart (gauge), 1 stud of tie on
  each side.
- L-gauge convention: parallel tracks at **16-stud centres** (8 studs between
  edges); on baseplates, track runs 4 studs in from the edge.

## Switch (point) geometry

The critical, non-obvious facts:

- The straight route is 32 studs long (two straights' worth).
- The diverging route is an incomplete S-bend built on a **24–32–40
  Pythagorean triangle** (the 3-4-5 triangle scaled by 8): it turns
  **36.87°** (= atan 3/4) outward at R40, then **14.37°** back the other way
  inside the piece.
- Net result: **the branch port exits the piece facing exactly 22.5°** from the
  straight route — on the standard heading grid. The 36.87° angle is internal
  to the piece and never appears at a port.
- Adding one standard R40 curve (22.5° back) to the branch, plus a 16-stud
  straight on the main route, produces two parallel tracks at 16-stud centres
  over a total length of 48 studs. This is why switches and curves are
  effectively companion pieces.
- The 36.87° arc endpoint inside the piece is at exactly (24, 8) studs relative
  to the facing point — rational coordinates, courtesy of the 3-4-5 triangle.
  The exact branch-port coordinates must be derived and unit-tested during
  plan 02 implementation.

## Implications for the data model

1. **Headings are 16-valued:** multiples of 22.5°. Store as an integer 0–15
   (units of 22.5°) for exact arithmetic; opposite facing = `(h + 8) % 16`.
2. **Positions are floats** in stud units with a small comparison tolerance
   (0.01 studs): curve offsets are irrational, switch branch offsets are
   rational, both fit.
3. **No crossing in MVP inventory.** The planning prompt scopes crossings "if
   part of standard Lego train track sets" — they are not. Model support for a
   crossing piece can remain in the catalogue schema (category exists) but no
   MVP piece definition or inventory row is needed.
4. **Flex track is post-MVP**: variable geometry (each 4-stud segment hinges up
   to ~7.6°) doesn't fit the fixed-piece port model without special handling.

## Prior art

- **BlueBrick** — free layout editor with part libraries and arbitrary-angle
  placement; its track part definitions are a useful cross-check for port
  coordinates.
- **BrickTracks / TrixBrix / Fx Bricks** — third-party ecosystems define larger
  radii (R56, R72, R88, R104, R120…) at 22.5° or 11.25° arcs; the R40+16-stud
  conventions above are the common baseline. Post-MVP extensibility should
  allow adding these as new piece definitions.
- **L-gauge.org / L-gauge modular standard** — community geometry conventions
  (16-stud parallel spacing, baseplate alignment).

## References

- Bill Ward's Brickpile, "Track Layout Geometry" —
  <https://www.brickpile.com/articles/track-layout-geometry/>
- Transponderings, "The straight, the curved and the pointy of LEGO-compatible
  train track" (2024) — switch S-bend math, 24-32-40 triangle —
  <https://transponderings.blog/2024/05/03/the-straight-the-curved-and-the-pointy-of-lego-compatible-train-track/>
- Monty's Trains, "Track Planning for LEGO Trains, Part 2" —
  <http://montystrains.net/workshop-blog/2018/2/22/track-planning-for-lego-trains-part-2-track-geometry-and-tips-tricks>
- BrickLink part pages: 53401 (straight), 53400 (curve), 53407/53404
  (switch left/right)
- Peeron inventory for set 7996 (double crossover, 2007) —
  <http://www.peeron.com/cgi-bin/invcgis/inv/sets/7996>
