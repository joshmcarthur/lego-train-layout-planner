# ADR-014: PWA offline strategy

**Status:** Accepted  
**Date:** 2026-07-05  
**Plan:** [Plan 08: App shell, PWA & accessibility](../plans/08-app-shell-pwa-and-accessibility.md)

## Context

The Lego Train Layout Planner is a static client-only app deployed to GitHub
Pages. Users should be able to install it as a PWA and continue using the editor
shell after going offline. There is no backend API to cache.

## Decision

### Tooling

Use `vite-plugin-pwa` in the Astro/Vite build (`vite.plugins` in
`astro.config.mjs`). `@vite-pwa/astro` was not used because its peer range
does not yet include Astro 7. The service worker is generated at build time
via Workbox.

### Service worker scope

- **Scope:** entire app origin (including the GitHub Pages `base` subpath).
- **Precache:** app shell assets — HTML, JS, CSS, fonts, icons, manifest.
- **No API cache:** there is no backend; runtime caching is limited to static
  assets only.

### Runtime caching

- **Static assets:** `CacheFirst` for hashed JS/CSS and images.
- **Navigation:** precached shell HTML; offline loads succeed after first visit.

### Update strategy

- `registerType: 'autoUpdate'` with a client-side update toast.
- On new service worker activation, show: “Update available — refresh” with a
  Refresh action that calls `updateSW()`.

### Manifest

- `public/manifest.webmanifest` with `display: standalone`, theme colour, and
  192×192 / 512×512 icons.
- `start_url` and `scope` must include the Astro `base` path
  (`/lego-train-layout-planner/`).

## Alternatives considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Manual service worker | Full control | Maintenance burden |
| No SW (manifest only) | Simpler | Weak offline guarantee |
| Network-first for HTML | Fresher content | Offline shell unreliable |

## Consequences

- Production builds include a service worker; dev can enable SW via
  `devOptions.enabled`.
- Deployed asset names are content-hashed by Vite, limiting stale-cache risk.
- iOS Safari PWA quirks may require manual smoke testing; document in
  `docs/deployment.md`.

## References

- [Plan 08](../plans/08-app-shell-pwa-and-accessibility.md)
- [ADR 001: Tech stack](./001-tech-stack.md)
