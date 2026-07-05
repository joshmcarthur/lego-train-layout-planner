# ADR-015: Mobile editor posture

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 08: App shell, PWA & accessibility](../plans/08-app-shell-pwa-and-accessibility.md)

## Context

The layout editor relies on precise pointer placement on a stud grid, keyboard
shortcuts, and a side palette. Touch targets and small screens make full
editing unreliable on phones and small tablets.

## Decision

### Breakpoint

- **Desktop editor (≥1024px):** full placement tools — palette, place, rotate,
  remove, pan, zoom, undo/redo.
- **Tablet/mobile (<1024px):** view-only editing mode on the editor page.

### Mobile editor capabilities

On viewports below 1024px the editor allows:

- View layout on canvas
- Pan and zoom
- Share link and fork banner actions
- Save/load library (read existing layouts)

On viewports below 1024px the editor **disables**:

- Piece placement from palette
- Remove and rotate via canvas interaction

A persistent banner states: *“Editing is best on desktop. You can still view and
share layouts.”*

### Other routes

- **Onboarding** and **generator** remain fully usable on mobile (forms and
  carousel are touch-friendly).

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Full mobile editor | Feature parity | Poor UX; high implementation cost |
| Block editor route on mobile | Simple | Users cannot view shared layouts |
| Separate mobile app | Native UX | Out of MVP scope |

## Consequences

- `layout-editor` listens to `matchMedia('(max-width: 1023px)')` and toggles
  read-only mode.
- `inventory-palette` is hidden or non-interactive on mobile editor view.
- E2E tests include a mobile viewport case for the banner and disabled placement.

## References

- [Plan 08](../plans/08-app-shell-pwa-and-accessibility.md)
- [ADR 008: Editor interaction model](./008-editor-interaction-model.md)
