# Plan 08: App Shell, PWA & Accessibility

Unify routes and onboarding flow, add PWA offline support, accessibility
pass, and mobile posture statement.

**Source:** planning prompt Non-Functional Requirements (PWA, a11y, mobile),
Architecture Preferences, deliverables §11 PWA setup.

---

## Entry criteria

- Plans 04–07 feature-complete in development.
- App routes: `/`, `/onboarding`, `/editor`, `/generate` exist.

## Exit criteria

- Coherent navigation and first-visit routing.
- PWA installable: manifest, service worker, offline app shell.
- Keyboard navigation for editor and forms; colour contrast audit passed.
- Mobile behaviour documented and implemented (view-only or simplified banner).
- E2E tests cover critical flows: onboarding → edit → save → share decode.
- ADR **014-pwa-offline-strategy** accepted.
- ADR **015-mobile-editor-posture** accepted.

---

## Decisions & ADRs

### ADR 014: PWA offline strategy

**File:** `docs/adr/014-pwa-offline-strategy.md`

**Recommended decision:**

- **Tooling:** `@vite-pwa/astro` or `vite-plugin-pwa` integrated with Astro build.
- **Service worker:** precache app shell (HTML, JS, CSS, fonts); **no** API cache
  (no backend).
- **Runtime caching:** `CacheFirst` for static assets; network optional after
  install.
- **Scope:** entire app origin.
- **Update prompt:** toast “Update available — refresh” on new SW activation.

**Alternatives:**

| Alternative | Pros | Cons |
|-------------|------|------|
| Manual service worker | Full control | Maintenance burden |
| No SW (manifest only) | Simpler | Weak offline guarantee |

### ADR 015: Mobile editor posture

**File:** `docs/adr/015-mobile-editor-posture.md`

**Recommended decision (v1):**

- **Desktop-first editor** (≥1024px): full placement tools.
- **Tablet/mobile (&lt;1024px):** view layout, pan/zoom, share, fork; banner:
  “Editing is best on desktop. You can still view and share layouts.”
- Generator and onboarding forms remain usable on mobile.

---

## Implementation tasks

### 1. App shell & routing

```
src/apps/web/pages/
  index.astro          # landing: CTA to onboarding or resume
  onboarding.astro
  editor.astro
  generate.astro
src/apps/web/components/
  app-header.ts        # nav links, inventory settings entry
  resume-prompt.ts     # “Continue last session?”
```

**First-visit logic (centralise in `bootstrap.ts`):**

```
if share URL → fork flow
else if autosave → resume prompt
else if no inventory → onboarding
else → editor
```

### 2. PWA assets

```
public/
  manifest.webmanifest   # name, icons 192/512, theme_color, display standalone
  icons/icon-192.png
  icons/icon-512.png
```

Configure in `astro.config.mjs`:

- `registerType: 'autoUpdate'` or prompt strategy per ADR
- Include catalogue JSON and critical fonts in precache

### 3. Accessibility

- Focus trap in onboarding modal only when open
- Editor canvas: `role="application"` with `aria-label="Track layout editor"`
- Palette: `role="listbox"` or toolbar with `aria-pressed` for selection
- Validation errors: `aria-live="polite"`
- Run axe-core in Playwright smoke or `npm run test:a11y` script
- Verify `--color-invalid` vs background contrast

### 4. Global styles polish

Align with reference layout:

- Page max-width none for editor (full viewport)
- Subtle shadow on palette panel
- Consistent 8px spacing scale in `tokens.css`

### 5. E2E critical flows

`tests/e2e/flows/`:

| Spec | Steps |
|------|-------|
| `first-visit.spec.ts` | onboarding → editor |
| `generate-edit.spec.ts` | random inventory → generate → open editor |
| `share-fork.spec.ts` | build layout → share URL → new context → fork |
| `resume.spec.ts` | autosave → reload → layout persists |

### 6. Production deploy docs

`docs/deployment.md` — GitHub Pages / Cloudflare Pages; hash URL sharing works
on static host; `base` path if project pages subpath.

---

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Lighthouse PWA | Installable + offline pass on production build |
| Performance | LCP &lt; 2.5s on fast 3G for shell (no heavy images) |
| Browser support | Latest Chrome, Firefox, Safari, Edge |
| SEO | Minimal meta; app not marketing site |
| UI/UX | Single consistent header; clear primary actions |

---

## Commit & pull request strategy

### Commits

1. `docs: add ADR 014 pwa offline strategy`
2. `docs: add ADR 015 mobile editor posture`
3. `feat(web): unify app routing and resume flow`
4. `feat(pwa): add manifest service worker and icons`
5. `feat(a11y): improve keyboard and aria labels`
6. `feat(web): add mobile view-only editor banner`
7. `test(e2e): add critical user flow specs`
8. `docs: add deployment guide`

### Pull request

- **When:** MVP success criteria (planning prompt) all pass in staging build.
- **Title:** `feat(app): PWA shell accessibility and e2e flows`
- **Description:** Summarise offline behaviour, mobile limitations, and completed
  user journeys. Screenshots of install prompt, mobile banner, and header nav.

---

## MVP checklist (final)

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Enter or randomize inventory | e2e first-visit |
| 2 | Generate or manually build layout | e2e generate-edit |
| 3 | Invalid connection feedback | unit + e2e |
| 4 | Save and reload locally | e2e resume |
| 5 | Share URL restores layout | e2e share-fork |
| 6 | Fork shared layout | e2e share-fork |

---

## Risks

- Service worker cache stale after deploy — versioned asset names via Vite.
- iOS Safari PWA quirks — test add-to-homescreen on Safari if available.

---

## Post-MVP

- Push notifications (out of scope)
- Train animation polish on SVG (optional visual)
