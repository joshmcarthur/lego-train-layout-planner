# Lego Train Track Geometry — Research Findings

Verified port coordinates for plan 02 (Domain Research & Piece Catalogue). Facts
below are sourced from the references at the bottom; measured port coordinates
were derived from LDraw part files (LDU ÷ 20 = studs) with axis mapping
**+X east, +Y south** (LDraw +Z → our −Y).

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

## Coordinate convention (ADR 003)

- **Unit:** 1 stud (LDraw 20 LDU).
- **Axes:** +X east, +Y south; rotation clockwise in 22.5° steps (headings 0–15).
- **Anchor:** `ports[0]` at `{0, 0}` — the primary connection point.
- **Tolerance:** 0.01 studs for position comparison.

## Connector symmetry (ADR 004)

Modern RC/Powered Up plastic track uses **symmetric, genderless** rail ends.
Any end mates with any end. Legacy 9V/12V metal-rail track is out of MVP scope.
MVP uses a single `ConnectorType = 'rail'`.

## Straight geometry — part 53401

16 studs long, 8 studs wide. Rails 6 studs apart (gauge), 1 stud of tie on
each side. L-gauge parallel spacing: **16 studs between track centres**.

### ASCII diagram (top-down, anchor `*` at west port)

```
        N
        ^
  W <---+---> E
        |
        S

  (-4)  +------------------+  (4)     y = -4 (north edge)
        |                  |
  *=====#==================#====>      y = 0  centreline (west port *)
        |                  |
  (-4)  +------------------+  (4)     y = +4 (south edge)
        x=0              x=16
        facing W (8)     facing E (0)
```

### Port table (local coordinates)

| id | localPosition | facing | connector |
|----|---------------|--------|-----------|
| `a` | `{0, 0}` | 8 (west) | `rail` |
| `b` | `{16, 0}` | 0 (east) | `rail` |

### Outline polygon

`{0,-4}`, `{16,-4}`, `{16,4}`, `{0,4}`

---

## Curve geometry — part 53400

- Arc: **22.5°** per curve — 4 curves = 90°; 16 curves = full circle.
- Radius: **R40** to track centreline (outer diameter 88 studs).
- Arc centre lies **40 studs south** of the entry port when the piece is
  oriented for eastbound entry with a clockwise (right-hand) turn.
- `curveDelta: 1` (one heading step from entry to exit).

### ASCII diagram

```
              arc centre (0, 40)
                    o
                   / \
                  /   \
         *-------/     \------> exit port
    entry          22.5°
    facing W (8)   facing heading 1 (ESE)
```

### Port table

| id | localPosition | facing | connector |
|----|---------------|--------|-----------|
| `a` | `{0, 0}` | 8 (west) | `rail` |
| `b` | `{15.3073, 3.0448}` | 1 | `rail` |

Exit position: `(R·sin 22.5°, R − R·cos 22.5°)` with R = 40.

### Outline polygon

Outer arc R = 44, inner arc R = 36, centre `(0, 40)`, swept clockwise from
entry to exit (see `curve-r40.ts`).

---

## Switch (point) geometry — parts 53404 / 53407

Critical facts:

- Straight route is **32 studs** long (two 16-stud straights).
- Diverging route is an incomplete **S-bend** on the 24–32–40 Pythagorean
  triangle (3-4-5 × 8): 36.87° out at R40, then 14.37° back inside the piece.
- **Branch port exits facing exactly 1 heading step (22.5°)** from the straight
  route. Internal angles never appear at ports.
- First arc apex inside the piece: **(24, 8)** studs from anchor along the
  straight route (right switch, branch to south).
- Adding one R40 curve plus a 16-stud straight on the main route produces
  parallel tracks at 16-stud centres over 48 studs total.

Port coordinates measured from LDraw end-sleeper positions (53404.dat /
53407.dat), anchor at west straight end (`-320` LDU from part origin).

### Right switch — part 53404

```
  *============================#========> straight east (facing 0)
  |  west (8)              x=32
  |
  |    branch
  \    /
   \  /  facing 1 (ESE)
    # branch port (32.69, 12.96)
```

| id | localPosition | facing | connector |
|----|---------------|--------|-----------|
| `a` | `{0, 0}` | 8 (west) | `rail` |
| `b` | `{32, 0}` | 0 (east) | `rail` |
| `c` | `{32.6926, 12.95515}` | 1 | `rail` |

### Left switch — part 53407

Mirror of right switch across the straight axis (negate Y).

| id | localPosition | facing | connector |
|----|---------------|--------|-----------|
| `a` | `{0, 0}` | 8 (west) | `rail` |
| `b` | `{32, 0}` | 0 (east) | `rail` |
| `c` | `{32.6926, -12.95515}` | 15 | `rail` |

Branch facing differs from straight east port (0) by exactly **1 heading step**
(right: +1 → 1; left: −1 → 15).

---

## Implications for the data model

1. **Headings are 16-valued:** integer 0–15; opposite = `(h + 8) % 16`.
2. **Positions are floats** with 0.01-stud tolerance.
3. **No crossing in MVP inventory.** Schema retains `crossing` category for
   post-MVP third-party pieces.
4. **Flex track is post-MVP:** variable geometry does not fit the fixed port model.

## Prior art

| Tool | Notes |
|------|-------|
| **BlueBrick** | Free layout editor; part libraries useful for port cross-check |
| **Bricklink Studio** | Commercial CAD; proprietary format; no MVP import |
| **TrackPlan** | Web-based; different geometry model |
| **BrickTracks / TrixBrix / Fx Bricks** | Third-party R56–R184 curves at 22.5°; post-MVP extensibility |

## Combinatorial note

Typical hobby inventories contain **10–50 pieces**. The layout generator (plan 06)
should cap search depth and result count accordingly.

## References

- Bill Ward's Brickpile, "Track Layout Geometry" —
  <https://www.brickpile.com/articles/track-layout-geometry/>
- Transponderings, "The straight, the curved and the pointy of LEGO-compatible
  train track" (2024) — switch S-bend math, 24-32-40 triangle —
  <https://transponderings.blog/2024/05/03/the-straight-the-curved-and-the-pointy-of-lego-compatible-train-track/>
- Monty's Trains, "Track Planning for LEGO Trains, Part 2" —
  <http://montystrains.net/workshop-blog/2018/2/22/track-planning-for-lego-trains-part-2-track-geometry-and-tips-tricks>
- LDraw parts: [53401](https://library.ldraw.org/parts/10016),
  [53400](https://library.ldraw.org/parts/10014),
  [53407](https://library.ldraw.org/parts/25336),
  [53404](https://library.ldraw.org/parts/25333)
- BrickLink: [53401](https://www.bricklink.com/v2/catalog/catalogitem.page?P=53401),
  [53400](https://www.bricklink.com/v2/catalog/catalogitem.page?P=53400),
  [53407](https://www.bricklink.com/v2/catalog/catalogitem.page?P=53407),
  [53404](https://www.bricklink.com/v2/catalog/catalogitem.page?P=53404)
- Peeron inventory for set 7996 (double crossover, 2007) —
  <http://www.peeron.com/cgi-bin/invcgis/inv/sets/7996>
