# Plan 07: Persistence, Sharing & Layout Lifecycle

Local save/load, URL serialization for sharing, JSON export/import, and
duplicate/extend/fork workflows — all client-side.

**Source:** planning prompt §6 Save/Load/Share, §7 Start From Existing Layout,
user flows 4–5.

---

## Entry criteria

- Plan 04 complete: inventory storage adapter.
- Plan 05 complete: editor produces `Layout` with stable `instanceId`s.
- Connection engine and catalogue versions defined.

## Exit criteria

- Multiple named layouts saved in `localStorage`.
- Current session autosaved (debounced).
- Share URL restores layout (+ optional inventory) on load.
- Export/import JSON file.
- “Duplicate”, “Extend”, and “Fork” actions implemented.
- Round-trip tests for encode/decode and file import/export.
- ADR **012-serialization-format** accepted.

---

## Decisions & ADRs

### ADR 012: Serialization format

**File:** `docs/adr/012-serialization-format.md`

**Recommended decision:**

```typescript
interface SerializedAppState {
  schemaVersion: 1;
  catalogueVersion: number;
  inventory?: Inventory;
  layout: Layout;
  meta?: { name?: string; createdAt?: string };
}
```

**URL encoding:**

1. JSON stringify `SerializedAppState` (minimal whitespace).
2. Compress with `lz-string` `compressToEncodedURIComponent`.
3. Place in hash: `https://app.example/#s=<payload>` or query `?s=` (hash
   preferred — not sent to server on static host).

**Limits:**

- Warn if encoded length &gt; 1800 chars. Evergreen browsers handle far longer
  URLs; the real constraints are shareability — chat apps and email clients
  truncate or mangle very long URLs, and QR codes become impractical.
- Fallback: copy JSON to clipboard + message “URL too long; share file instead”.

**Fork inventory semantics (decide in this ADR):**

- If the shared payload includes `inventory`, it applies to the **forked
  session only**; the recipient's stored inventory is never silently
  overwritten.
- If the payload has no `inventory`, the fork is validated against the
  recipient's own stored inventory.
- When the forked layout uses more pieces than the active inventory allows,
  the layout still loads (geometry is valid) with a banner: “This layout uses
  more pieces than your inventory” listing the shortfall per piece. Editing may
  proceed; adding pieces beyond available counts stays blocked as usual.
- On save, prompt: “Keep your inventory” (default) or “Adopt this layout's
  inventory” (only offered when the payload embedded one).

**Migration:** `schemaVersion` bump runs migrators in
`persistence/migrate.ts`; catalogue version mismatch shows non-blocking banner
“Layout saved with older track definitions”.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Base64 only (no compression) | Simpler | Long URLs |
| Custom binary codec | Smallest | Harder to debug |
| gzip + base64 | Good ratio | Async, larger lib |

### ADR 013: Saved layouts index

**File:** `docs/adr/013-saved-layouts-index.md`

**Storage keys:**

- `lego-train-planner/layouts` → `SavedLayoutIndex[]`
- `lego-train-planner/autosave` → latest `SerializedAppState`

```typescript
interface SavedLayoutIndex {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string; // optional data URL from SVG snapshot
}
```

---

## Implementation tasks

### 1. Persistence package

```
src/packages/persistence/
  types.ts
  migrate.ts
  inventory-store.ts    # from plan 04
  layout-store.ts
  url-codec.ts          # encode/decode + length check
  file-export.ts        # download/upload JSON
  index.ts
```

**API:**

```typescript
export function encodeShareUrl(state: SerializedAppState): string;
export function decodeShareUrl(url: string): SerializedAppState | null;
export function saveLayout(index: SavedLayoutIndex, state: SerializedAppState): void;
export function loadLayout(id: string): SerializedAppState | null;
export function listLayouts(): SavedLayoutIndex[];
export function exportJsonFile(state: SerializedAppState, filename: string): void;
export function importJsonFile(file: File): Promise<SerializedAppState>;
```

### 2. App bootstrap

`src/apps/web/state/bootstrap.ts`:

- On load: parse `window.location.hash` / search for share payload
- If share payload valid → **fork mode** (see below)
- Else load autosave or empty editor with inventory from storage

### 3. Fork / duplicate / extend

| Action | Behaviour |
|--------|-----------|
| **Fork** (shared URL) | Load layout into editor; new `instanceId`s; do not overwrite autosave until user saves |
| **Duplicate** | Clone saved layout to new index entry |
| **Extend** | Open layout in editor; user adds pieces within inventory limits |

`src/packages/persistence/fork.ts` — remap instanceIds, preserve geometry.

### 4. UI

```
src/apps/web/components/
  save-load-menu.ts
  share-link-button.ts    # copy URL to clipboard
  layout-library.ts       # list saved layouts
  import-export-menu.ts
  fork-banner.ts          # “Viewing shared layout — Fork to edit”
```

**UI/UX:**

- Share button: success toast “Link copied”
- URL too long: modal with export JSON CTA
- Save dialog: name field, default timestamp
- Library: name, updated date, open / duplicate / delete

### 5. Autosave

Debounce 1s after layout change in editor reducer subscription.

### 6. Tests

`tests/unit/persistence/url-codec.test.ts`:

- Round-trip fixture layout + inventory
- Corrupted payload returns null
- Length guard triggers fallback flag

`tests/fixtures/serialized/v1-minimal.json` — golden file

`tests/e2e/share-roundtrip.spec.ts` — encode in test, visit URL, assert piece
count in editor

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Security | Treat imported JSON as untrusted; validate schema; max placements 500 |
| Privacy | No analytics on shared URLs required |
| Offline | Save/load work without network |
| Performance | Encode/decode &lt; 50ms for typical layouts |
| UX | Fork banner clearly distinguishes view-only vs editing (if view-only not implemented, fork immediately editable) |

---

## Commit & pull request strategy

### Commits

1. `docs: add ADR 012 serialization format`
2. `docs: add ADR 013 saved layouts index`
3. `feat(persistence): add url codec with compression`
4. `feat(persistence): add layout store and autosave`
5. `feat(persistence): add fork duplicate and file export`
6. `feat(web): add share save load and library UI`
7. `test(persistence): add round-trip and golden fixtures`

### Pull request

- **When:** Share URL restores layout in fresh browser context (manual or e2e).
- **Title:** `feat(persistence): save share and fork layouts`
- **Description:** Explain URL format, length limits, and fork behaviour. Screenshot
  of library list and fork banner. No test plan section.

---

## User flow acceptance

4. **Share** → Copy URL → New session opens layout → Fork → Edit → Save locally.
5. **Resume** → Return visit → Autosave or pick from library → Continue editing.

---

## Risks

- Catalogue version drift breaks old URLs — migration or graceful error with
  piece mapping table.
- localStorage quota — prune old thumbnails first; catch `QuotaExceededError`.

---

## MVP success criteria linkage

Satisfies planning prompt items 4–6 for save, share, and fork.
