import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@lego/piece-catalogue': path.resolve(
        root,
        'src/packages/piece-catalogue/index.ts',
      ),
      '@lego/connection-engine': path.resolve(
        root,
        'src/packages/connection-engine/index.ts',
      ),
      '@lego/layout-generator': path.resolve(
        root,
        'src/packages/layout-generator/index.ts',
      ),
      '@lego/inventory': path.resolve(root, 'src/packages/inventory/index.ts'),
      '@lego/persistence': path.resolve(
        root,
        'src/packages/persistence/index.ts',
      ),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
