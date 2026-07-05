# ADR-012: Serialization format

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 07: Persistence, sharing & layout lifecycle](../plans/07-persistence-sharing-and-layout-lifecycle.md)

## Context

Users must save layouts locally, share them via URL, and export/import JSON files
without a backend. Payloads must be versioned, validated as untrusted input, and
compact enough for chat/email links. Inventory may optionally travel with a
shared layout without overwriting the recipient's stored inventory.

## Decision

### Serialized state shape

```typescript
interface SerializedAppState {
  schemaVersion: 1;
  catalogueVersion: number;
  inventory?: Inventory;
  layout: Layout;
  meta?: { name?: string; createdAt?: string };
}
```

`Inventory` and `Layout` reuse shapes from ADR 006 and the connection engine.

### URL encoding

1. `JSON.stringify(state)` with minimal whitespace.
2. Compress with `lz-string` `compressToEncodedURIComponent`.
3. Place in the editor URL hash: `#s=<payload>` (preferred). Also accept query
   `?s=` for robustness.

**Share URL default:** omit `inventory` unless the user opts in — saves URL space
and avoids silently implying inventory transfer.

**Length guard:** warn when encoded payload exceeds **1800** characters. Fallback:
copy JSON to clipboard with message “URL too long; share file instead”.

### Fork inventory semantics

- Embedded `inventory` applies to the **forked session only**; recipient stored
  inventory is never silently overwritten.
- No embedded inventory → validate against recipient's stored inventory.
- Layout loads even when piece counts exceed inventory; show a banner listing
  shortfall per piece. Placement beyond available counts stays blocked.
- On first save from a fork with embedded inventory, prompt: “Keep your inventory”
  (default) or “Adopt this layout's inventory”.

### Migration

`schemaVersion` bumps run migrators in `persistence/migrate.ts`. Catalogue version
mismatch shows a non-blocking banner: “Layout saved with older track definitions”.

### Security

- Treat imported JSON and URL payloads as untrusted.
- Cap layouts at **500** placements after decode.
- Reject malformed or oversized compressed strings before decompress.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Base64 only (no compression) | Simpler | URLs too long for sharing |
| gzip + base64 (`CompressionStream`) | Better compression | Async decode complicates bootstrap |
| React URL-state libraries (nuqs, state-in-url) | Live param sync | React-only; wrong problem for one-shot share blobs |

## Consequences

- `url-codec.ts` owns encode/decode; UI calls `encodeShareUrl` / `decodeShareUrl`.
- `lz-string@1.5.0` is the only new runtime dependency for compression.
- File export uses the same `SerializedAppState` JSON without compression.

## References

- [Plan 07](../plans/07-persistence-sharing-and-layout-lifecycle.md)
- [ADR 006: Inventory storage schema](./006-inventory-storage-schema.md)
