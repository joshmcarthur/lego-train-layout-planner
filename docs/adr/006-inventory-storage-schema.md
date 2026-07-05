# ADR-006: Inventory storage schema

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 04: Inventory & onboarding](../plans/04-inventory-and-onboarding.md)

## Context

Users must enter and persist piece counts before using the editor or generator.
Inventory must survive page reloads, align with the piece catalogue's
`inventoryKey` identifiers, and remain extensible when new piece types are added
post-MVP. Plan 07 will embed inventory in bundled layout state — the schema
version must be stable from the start.

## Decision

Store inventory as a versioned JSON object in `localStorage`:

```typescript
interface Inventory {
  schemaVersion: 1;
  counts: Record<string, number>; // inventoryKey → count
  updatedAt: string; // ISO timestamp
}
```

- **Storage key:** `lego-train-planner/inventory`
- **First-visit default:** no stored inventory (empty / missing) — onboarding
  prompts intentional entry rather than pre-filling counts.
- **Bounds:** each count is a non-negative integer, maximum 999.
- **Keys:** catalogue `inventoryKey` strings only (e.g. `straight-16`,
  `curve-r40`). Missing keys in stored data are treated as 0 on load.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Array of `{key, count}` | Ordered display | Slower lookup; harder to merge |
| Embed inventory only in layout blob | Fewer storage keys | Duplication when editing inventory globally |
| Pre-filled starter set on first visit | Faster to try the app | Users may not notice they can edit counts |

## Consequences

- Plan 04 persistence adapter (`inventory-store.ts`) owns read/write for this key.
- Plan 07 `SerializedAppState` reuses this `Inventory` shape with
  `schemaVersion: 1`.
- Adding piece types requires no schema change — only new `inventoryKey` entries
  in the catalogue and form.

## References

- [Plan 04: Inventory & onboarding](../plans/04-inventory-and-onboarding.md)
- [ADR 002: Module boundaries](./002-module-boundaries.md)
