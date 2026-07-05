# ADR-004: Port and connection model

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 02: Domain research & piece catalogue](../plans/02-domain-research-and-piece-catalogue.md)

## Context

The connection engine must validate geometric adjacency between track pieces.
Modern Lego RC/Powered Up track uses symmetric rail ends; the model must support
future piece systems without schema churn.

## Decision

- Each port: `{ id, localPosition: {x,y}, facing: Heading, connector: ConnectorType }`.
- **Position convention:** a port sits at the piece's physical rail-end boundary,
  facing **outward**. Two connected ports occupy the **same world point** (within
  0.01-stud tolerance) with facings exactly 180° apart.
- **Connector compatibility, not gender:** modern track has symmetric rail ends.
  MVP uses `ConnectorType = 'rail'` with symmetric `connectorsCompatible(a, b)`.
  Research confirmed genderless ends for RC/PF era; legacy 9V/12V excluded from MVP.
- **Switch modelling:** all physical ports exist on the piece; route graph (plan 03)
  may traverse one branch at a time for chosen-path analysis, but the editor shows
  all ports for placement validation.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Male/female gender flag | Familiar model | Wrong for modern track |
| Direction vectors only (no connector type) | Simpler | Cannot exclude incompatible systems later |
| Graph-only (no spatial ports) | Abstract | Cannot validate geometric alignment |

## Consequences

- Plan 03 adjacency check: coincident ports + opposite facings + compatible connectors.
- New piece systems add a `ConnectorType` variant rather than changing port schema.
- Switch pieces expose three ports; traversal semantics deferred to ADR 005.

## References

- [Lego track geometry research](../research/lego-track-geometry.md)
- [ADR 003: Grid coordinate system](./003-grid-coordinate-system.md)
