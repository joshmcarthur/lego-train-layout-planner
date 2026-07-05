# ADR-007: Onboarding UX flow

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 04: Inventory & onboarding](../plans/04-inventory-and-onboarding.md)

## Context

The app needs a first-run experience for entering piece inventory and a path to
edit counts later. Users may also want random presets for experimentation.
Mobile editor constraints are deferred to Plan 08; onboarding must work on all
screen sizes.

## Decision

- **First visit:** if no inventory is stored in `localStorage`, redirect to
  `/onboarding` before the editor. The editor gate performs this check on load.
- **Onboarding page:** full-page form with numeric inputs grouped by category
  (Straights, Curves, Switches). Primary CTA: "Continue to editor".
- **Random inventory:** dropdown for presets (`small`, `medium`, `large`) with
  "Apply" — fills editable fields; user may adjust before continuing.
- **Validation:** non-negative integers, max 999 per piece; inline errors with
  `aria-live` announcements.
- **Settings:** accessible from the editor to re-edit inventory. When a layout
  has placements (`layout.placements.length > 0`), show a warning banner:
  "Changing inventory may make your current layout invalid."
- **Desktop-first:** same stacked form on mobile; strict mobile editor posture
  deferred to Plan 08.
- **Save failures:** if `localStorage` is unavailable, show a non-blocking
  message ("Could not save; session only") and continue in memory.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Modal on home page instead of `/onboarding` route | Single page | Harder to deep-link; worse back-button behaviour |
| Skip onboarding; default to random medium preset | Zero friction | Conflicts with inventory-first product goal |
| Block editor entirely on mobile | Simple | Over-restrictive for onboarding-only visits |

## Consequences

- Astro routes: `/onboarding` (first-run), `/editor` (gate + stub until Plan 05).
- Lit components: shared `inventory-form`, `inventory-onboarding`,
  `inventory-settings`.
- App store holds inventory and layout state for gate and warning logic.

## References

- [Planning prompt §1 Onboarding](../prompts/planning.md)
- [ADR 006: Inventory storage schema](./006-inventory-storage-schema.md)
