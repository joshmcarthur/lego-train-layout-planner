# ADR-005: Route graph semantics

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 03: Connection engine](../plans/03-connection-engine.md)

## Context

The connection engine must validate geometric adjacency between placed track
pieces and analyse route topology for the editor (plan 05) and layout generator
(plan 06). Product requirements explicitly support open routes (sidings, dead
ends) and switches that leave branch ports open on loops.

## Decision

- A **layout** is a set of **placements** `{ instanceId, pieceId, x, y, rotation }`.
- **Two-tier validity.** Issues are split by severity:
  - **Errors** (layout is invalid; editor blocks placement): footprint overlap;
    two ports coincident but misaligned (facings not opposite or connectors
    incompatible); two ports nearly coincident (within 1 stud but outside
    connection tolerance) — a physically impossible near-miss.
  - **Info** (layout remains valid): **open ends** — ports with no connection
    partner. Open ends are reported for UI display and generator scoring, never
    as errors.
- **Route graph:** nodes = ports (`${instanceId}:${portId}`); edges =
  `connection` (valid port-to-port joins) and `internal` (within-piece
  traversal).
- **Internal traversal edges** distinguish topology per piece:
  - Straight or curve: link both ports.
  - Switch: link common port (`ports[0]`, entry) to each branch port.
  - Crossing: link only opposite port pairs — two independent paths, not a
    degree-4 junction you can turn at.
- **Closed loop:** a connected component is *closed* if there exists a cycle
  through connection edges and internal traversal edges. Switch branch ports
  and siding stubs hanging off the cycle do not disqualify it. A component
  with no cycle is *open*.
- **Switch path mode (MVP):** Editor validates geometry only; generator (plan
  06) treats switch as **all branches available** for reachability; optional
  `selectedBranch` on placement post-MVP.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Open ports are errors | Forces tidy loops | Contradicts product vision; any switch layout invalid |
| Closed = all ports degree 2 | Trivial check | No switch or siding layout can ever be closed |
| Single path per switch only | Simpler train simulation | Harder placement validation |
| Crossing as degree-4 junction | Uniform graph | Misrepresents topology — trains cannot turn at a crossing |

## Consequences

- `validateLayout` returns `valid: true` when only `OPEN_END` info issues exist.
- `buildRouteGraph` exposes `closedComponents` for generator scoring.
- Crossing semantics are implemented even though no MVP catalogue piece exists;
  a test-only synthetic crossing validates the internal-edge rules.
- Post-MVP switch path selection can extend `Placement` without changing graph
  node identity.

## References

- [ADR 003: Grid coordinate system](./003-grid-coordinate-system.md)
- [ADR 004: Port and connection model](./004-port-and-connection-model.md)
- [Plan 03: Connection engine](../plans/03-connection-engine.md)
