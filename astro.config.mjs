// @ts-check
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
  srcDir: './src/apps/web',
  publicDir: './public',
  site: 'https://joshmcarthur.github.io',
  base: '/lego-train-layout-planner',
  trailingSlash: 'always',
  integrations: [lit()],
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          navigateFallback: '/lego-train-layout-planner/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
  },
});
