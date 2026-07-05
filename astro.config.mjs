// @ts-check
import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

// https://astro.build/config
export default defineConfig({
  srcDir: './src/apps/web',
  publicDir: './public',
  site: 'https://joshmcarthur.github.io',
  base: '/lego-train-layout-planner',
  trailingSlash: 'always',
  integrations: [lit()],
});
