# Deployment

The Lego Train Layout Planner is a static Astro site with no backend. It deploys
to GitHub Pages via the workflow in
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which runs
after CI succeeds on `main`.

## GitHub Pages

1. Enable GitHub Pages for the repository (source: GitHub Actions).
2. Merge to `main`; CI builds and verifies the site, then the deploy workflow
   publishes `dist/` to Pages.
3. Production URL:
   `https://joshmcarthur.github.io/lego-train-layout-planner/`

### Base path

[`astro.config.mjs`](../astro.config.mjs) sets:

```js
base: '/lego-train-layout-planner',
trailingSlash: 'always',
```

All in-app links use `import.meta.env.BASE_URL`. If you fork the repo to a
user/org Pages root (`base: '/'`), update `base`, `site`, manifest `start_url`
/ `scope`, and Workbox `navigateFallback` accordingly.

## Share URLs

Layout sharing uses a hash parameter (`#s=…`) produced by
[`encodeShareUrl`](../src/packages/persistence/url-codec.ts). Hash fragments are
not sent to the server, so sharing works on any static host without server-side
routing.

Share links target the editor route, e.g.
`https://joshmcarthur.github.io/lego-train-layout-planner/editor/#s=…`

## PWA

- Manifest: [`public/manifest.webmanifest`](../public/manifest.webmanifest)
- Service worker: generated at build time by `@vite-pwa/astro` / Workbox
- `start_url` and `scope` must include the GitHub Pages base path
- After deploy, verify installability and offline shell in Chrome DevTools →
  Application

### iOS Safari

Add-to-homescreen behaviour can differ from Chrome. Test manually on Safari if
possible; document known limitations (e.g. update prompts) here as they are
discovered.

## Cloudflare Pages (optional)

1. Connect the repository to Cloudflare Pages.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `BASE_URL` / Astro `base` to match your Pages URL if not using the
   default GitHub Pages subpath.

## Local preview

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

E2E tests use `http://127.0.0.1:4321/lego-train-layout-planner/` by default
(see [`playwright.config.ts`](../playwright.config.ts)).
