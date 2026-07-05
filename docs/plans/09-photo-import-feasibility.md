# Plan 09: Photo Import Feasibility (Post-MVP)

Assess and phase image-based layout import: semi-manual “trace over photo” first;
full computer vision deferred.

**Source:** planning prompt §8 Photo / Image Import (Nice to Have).

---

## Entry criteria

- MVP complete (plans 01–08).
- Manual editor stable (plan 05).

## Exit criteria

- Feasibility document: `docs/research/photo-import-feasibility.md`
- ADR **016-photo-import-phasing** accepted.
- **Phase A** prototype (optional implementation): trace-over-photo mode behind
  feature flag — OR explicit “deferred” with prototype spec only.

This plan is **optional** and does not block MVP release.

---

## Decisions & ADRs

### ADR 016: Photo import phasing

**File:** `docs/adr/016-photo-import-phasing.md`

**Recommended phasing:**

| Phase | Scope | Effort | Value |
|-------|-------|--------|-------|
| **A — Trace overlay** | User uploads image; sets scale + rotation; semi-transparent
  underlay on editor grid; manual placement on top | Medium | High for power users |
| **B — Assisted snap** | Click on image to place anchor; suggest piece type from
  local edge direction | High | Medium |
| **C — ML detection** | Segment track pieces via CV model | Very high | Uncertain accuracy |

**MVP of photo feature = Phase A only.**

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Skip photo entirely | Focus resources | Misses “photo of physical layout” job |
| Full ML first | Magical UX | Training data scarce; error-prone |

---

## Research tasks

Document in `docs/research/photo-import-feasibility.md`:

1. **User job:** photograph completed table layout → digitize for sharing/editing.
2. **Challenges:** perspective distortion, lighting, overlapping pieces, switch
   ambiguity from top-down photo angle.
3. **Prior art:** any Lego scanning apps; general CV for rail track (limited).
4. **Phase A UX wireframe** (ASCII or link to mock):
   - Upload → crop → mark two points known distance (e.g. 16 studs) → align
     overlay → trace in editor
5. **Data privacy:** images stay client-side (`URL.createObjectURL`); never
   uploaded.

---

## Phase A implementation outline (if built)

### Components

```
src/apps/web/components/
  photo-import-wizard.ts
  photo-alignment-canvas.ts   # transform matrix for overlay
  editor-canvas.ts            # extend: optional background image layer
```

### State

```typescript
interface PhotoOverlay {
  imageUrl: string;
  transform: { scale: number; rotation: number; offsetX: number; offsetY: number };
  calibrationStuds: number; // distance between two user-placed calibration points
}
```

### Flow

1. User imports image file (validate size &lt; 10MB).
2. Calibration: click two points; enter real stud distance (default 16).
3. Adjust opacity slider.
4. Place pieces in editor as normal; image not persisted in share URL (optional
   `includePhoto` false default) — document size implications in ADR.

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Privacy | No server upload |
| Performance | Downscale image &gt; 4K before overlay |
| UX | Clear “assistive only — verify connections” disclaimer |
| a11y | Wizard steps keyboard navigable |

---

## Commit & pull request strategy

### If research only

1. `docs: add photo import feasibility research`
2. `docs: add ADR 016 photo import phasing`

**PR title:** `docs: photo import feasibility and phasing`  
**Description:** Honest assessment; recommend Phase A. No screenshots.

### If Phase A implemented

1. `feat(photo-import): add image upload and calibration wizard`
2. `feat(editor): add photo overlay layer`
3. `test(photo-import): add calibration math tests`

**PR title:** `feat(photo-import): trace over photo overlay`  
**Description:** Explain calibration and that connections must still validate.
Screenshots of overlay aligned on grid.

---

## Risks

- Users expect automatic detection — set expectations in UI copy.
- Large images in localStorage — do not persist photo in autosave; session only.

---

## Success criteria (Phase A)

User aligns photo under grid and reproduces a simple loop layout manually faster
than without reference ( qualitative UX test).
