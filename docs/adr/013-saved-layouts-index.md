# ADR-013: Saved layouts index

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 07: Persistence, sharing & layout lifecycle](../plans/07-persistence-sharing-and-layout-lifecycle.md)

## Context

Users need multiple named layouts in addition to a single autosaved session.
The index must stay small in `localStorage` while full layout blobs are stored
separately. Optional thumbnails may be added later without schema changes.

## Decision

### Storage keys

| Key | Value |
|-----|-------|
| `lego-train-planner/layouts` | `SavedLayoutIndex[]` |
| `lego-train-planner/autosave` | latest `SerializedAppState` |
| `lego-train-planner/layout/<id>` | `SerializedAppState` per saved layout |

`lego-train-planner/inventory` remains owned by ADR 006.

### Index entry shape

```typescript
interface SavedLayoutIndex {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string; // optional data URL from SVG snapshot
}
```

- `id`: `crypto.randomUUID()` at save time.
- `name`: user-provided; default ISO timestamp.
- `updatedAt`: ISO timestamp, updated on each save.

### Autosave

- Debounce **1 second** after layout changes in the editor.
- Skip autosave while in fork mode (shared URL not yet saved).
- Autosave includes current layout and stored inventory reference.

### Quota handling

Catch `QuotaExceededError` on write. Prune optional thumbnails from index
entries before failing; surface a user-visible error if still over quota.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Single blob for all layouts | One read/write | Large writes; poor partial updates |
| Index only in autosave | Simpler | No multi-layout library |
| IndexedDB | Larger quota | Heavier API; deferred to post-MVP |

## Consequences

- `layout-store.ts` owns index CRUD and per-layout blobs.
- Library UI lists `SavedLayoutIndex` and loads blobs by `id`.
- Thumbnails are optional; MVP may ship without generating them.

## References

- [Plan 07](../plans/07-persistence-sharing-and-layout-lifecycle.md)
- [ADR 012: Serialization format](./012-serialization-format.md)
