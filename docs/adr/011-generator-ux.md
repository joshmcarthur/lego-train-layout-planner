# ADR-011: Generator UX

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 06: Layout generator](../plans/06-layout-generator.md)

## Context

Users need to explore multiple valid layouts from their inventory. The generator
must communicate progress, limits, and empty results honestly. Closed loops are
often preferred for continuous train operation but open layouts remain useful.

## Decision

### Closed-loop preference toggle

- **Label:** "Prefer closed loops"
- **Default:** on
- **Behaviour:** when on, sort candidates with closed loops first; still show
  open layouts if no closed candidates exist or as lower-ranked results.

### Generator page (`/generate/`)

- CTA from onboarding, home, and editor: "Generate layouts"
- Progress bar with "Explored X configurations"
- Cancel button terminates the worker
- Carousel cards: thumbnail, piece count, "Closed loop" badge when applicable
- "Open in editor" on select — saves autosave and navigates to editor
- Empty state when no layout found: explain combinatorial limits; suggest more
  pieces or random inventory

### Thumbnail rendering

Main-thread SVG reusing `piece-sprites` from the editor. Worker returns layout
JSON only. With ≤12 candidates this is within frame budget.

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Grid instead of carousel | More visible at once | Poor on mobile |
| Worker-side OffscreenCanvas | Offloads rendering | Complexity; post-MVP |
| Hide open layouts when toggle on | Simpler ranking | User may see empty state unnecessarily |

## Consequences

- Generator UX is consistent with editor visual language.
- Closed-loop toggle affects sort order only, not search pruning.
- Thumbnail performance can be profiled later without API changes.

## References

- [ADR 010: Layout generation algorithm](./010-layout-generation-algorithm.md)
- [Plan 06: Layout generator](../plans/06-layout-generator.md)
