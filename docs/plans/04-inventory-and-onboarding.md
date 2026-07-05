# Plan 04: Inventory & Onboarding

Piece inventory entry, validation, random inventory mode, and localStorage
persistence. First user-facing UI beyond the app shell.

**Source:** planning prompt §1 Onboarding, §2 Random Inventory Mode, user flows
1 and 2 (partial).

---

## Entry criteria

- Plan 01 complete (Astro + Lit shell).
- Plan 02 complete (`inventoryKey` per piece in catalogue).
- `src/packages/inventory/` stub exists.

## Exit criteria

- User can enter counts per MVP piece type on first visit.
- Inputs validated (non-negative integers, max cap e.g. 999).
- Inventory persisted to `localStorage` and restored on reload.
- Random inventory presets: `small`, `medium`, `large` with editable results.
- Settings path to edit inventory later with warning if layout in progress.
- Unit tests for inventory math and storage adapter.
- ADR **006-inventory-storage-schema** accepted.
- ADR **007-onboarding-ux** accepted.

---

## Decisions & ADRs

### ADR 006: Inventory storage schema

**File:** `docs/adr/006-inventory-storage-schema.md`

**Recommended decision:**

```typescript
interface Inventory {
  schemaVersion: 1;
  counts: Record<string, number>; // inventoryKey → count
  updatedAt: string; // ISO timestamp
}
```

- Storage key: `lego-train-planner/inventory`
- Default on first visit: empty counts (prompt onboarding) OR sensible starter
  set (document choice — recommend **empty** to force intentional entry).
- Max per piece: 999; min 0.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Array of `{key, count}` | Ordered display | Slower lookup |
| Embed inventory only in layout blob | Fewer keys | Duplication when editing inventory globally |

### ADR 007: Onboarding UX flow

**File:** `docs/adr/007-onboarding-ux.md`

**Recommended decision:**

- First visit without stored inventory → redirect/modal onboarding before editor.
- Desktop-first: modal dialog with numeric inputs grouped by category.
- Mobile: same form, stacked layout; editor may be read-only on small screens
  (defer strict mobile editor to plan 08).

---

## Data models

```typescript
interface InventoryPreset {
  id: 'small' | 'medium' | 'large';
  label: string;
  counts: Record<string, number>;
}

interface InventoryState {
  inventory: Inventory;
  remaining(layout: Layout): Record<string, number>;
  canUse(pieceId: string, layout: Layout): boolean;
}
```

**Preset ranges** — modelled on real Lego products (a basic train set oval is
16 curves + 4 straights; 16 curves are needed for any closed circle, so every
preset guarantees at least 16):

| Preset | Straights | Curves | L Switch | R Switch |
|--------|-----------|--------|----------|----------|
| small | 2–6 | 16 | 0 | 0 |
| medium | 8–16 | 16–24 | 0–1 | 0–1 |
| large | 16–32 | 24–48 | 1–3 | 1–3 |

Random: uniform random in range per row. No crossing — not part of the current
standard Lego track line (see `docs/research/lego-track-geometry.md`); the
inventory schema is keyed by catalogue `inventoryKey`, so third-party pieces
can be added post-MVP without schema changes.

---

## Implementation tasks

### 1. Domain package `inventory`

```
src/packages/inventory/
  types.ts
  presets.ts
  random.ts
  remaining.ts      # compute remaining from layout placements
  validate.ts       # bounds checking
  index.ts
```

- `randomInventory(preset): Inventory`
- `subtractForPlacement(inventory, pieceId): Inventory` (immutable)
- `getRemainingCounts(inventory, layout, catalogue): Record<string, number>`

### 2. Persistence adapter

`src/packages/persistence/inventory-store.ts` (thin wrapper; full persistence
plan 07 extends):

- `loadInventory(): Inventory | null`
- `saveInventory(inventory): void`
- Uses `localStorage` with try/catch for quota errors

### 3. Lit components

```
src/apps/web/components/
  inventory-form.ts       # numeric inputs per catalogue piece
  inventory-onboarding.ts # full-screen/modal first-run
  inventory-settings.ts   # gear menu entry
```

**UI/UX requirements:**

- Group fields: Straights, Curves, Switches.
- Inline validation message for negative or non-integer input.
- “Random inventory” dropdown + “Apply” + editable fields after apply.
- Primary CTA: “Continue to editor” / “Save”.
- Warning banner when editing inventory with unsaved layout: “Changing inventory
  may make your current layout invalid.”

### 4. Astro pages

- `/onboarding` — hosts `inventory-onboarding`
- `/editor` — stub that reads inventory; if missing, redirect onboarding
- App state: minimal context via Lit context or lightweight store module
  `src/apps/web/state/app-store.ts`

### 5. Tests

- `tests/unit/inventory/random.test.ts` — respects bounds
- `tests/unit/inventory/remaining.test.ts` — counts decrement per placement
- `tests/unit/persistence/inventory-store.test.ts` — mock localStorage

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Accessibility | Labels tied to inputs; error announced via `aria-live` |
| Persistence | Works offline after first load |
| Performance | Form render &lt; 16ms for ≤20 piece types |
| Security | No PII; localStorage only |
| UI/UX | Match design tokens from plan 01; clear typography; no clutter |

---

## Commit & pull request strategy

### Commits

1. `docs: add ADR 006 inventory storage schema`
2. `docs: add ADR 007 onboarding ux`
3. `feat(inventory): add presets and random generation`
4. `feat(inventory): add remaining count logic`
5. `feat(persistence): add inventory localStorage adapter`
6. `feat(web): add inventory onboarding and settings UI`
7. `test(inventory): add unit tests for inventory and storage`

### Pull request

- **When:** Onboarding flow works end-to-end in dev.
- **Title:** `feat(inventory): onboarding and random inventory`
- **Description:** Describe first-visit flow, preset behaviour, and warning when
  editing inventory mid-session. **Include screenshots** of onboarding form and
  random inventory filled state.

---

## User flow acceptance

1. **First visit** → Enter inventory → Continue → Editor stub shows loaded counts.
2. **Random play (partial)** → Random preset → Adjust counts → Continue.

---

## Risks

- localStorage unavailable (private mode) — surface toast “Could not save; session
  only” and continue.

---

## Dependencies for later plans

- Plan 05 uses remaining counts in palette.
- Plan 07 may version bundled state; inventory schema version must align.
