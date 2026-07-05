import { expect, test } from '@playwright/test';

import type { Layout } from '../../src/packages/connection-engine/types.ts';
import { INVENTORY_STORAGE_KEY } from '../../src/packages/persistence/inventory-store.ts';
import {
  createSerializedAppState,
  encodeShareUrl,
} from '../../src/packages/persistence/index.ts';
import { CATALOGUE_VERSION } from '../../src/packages/piece-catalogue/index.ts';

const inventoryFixture = {
  schemaVersion: 1 as const,
  counts: {
    'straight-16': 4,
    'curve-r40': 0,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

const sharedLayout: Layout = {
  schemaVersion: 1,
  catalogueVersion: CATALOGUE_VERSION,
  placements: [
    {
      instanceId: 'shared-1',
      pieceId: 'straight-16',
      x: 0,
      y: 0,
      rotation: 0,
    },
    {
      instanceId: 'shared-2',
      pieceId: 'straight-16',
      x: 16,
      y: 0,
      rotation: 0,
    },
  ],
};

test('share URL restores layout in a fresh session', async ({ page, baseURL }) => {
  const state = createSerializedAppState(sharedLayout, {
    catalogueVersion: CATALOGUE_VERSION,
    inventory: inventoryFixture,
  });

  const editorPath = `${baseURL}editor/`;
  const share = encodeShareUrl(state, editorPath);
  expect(share.tooLong).toBe(false);

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await page.goto(share.url);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]');

  await expect(page.locator('g.piece[data-instance-id]')).toHaveCount(2);
  await expect(page.getByText('Viewing a shared layout')).toBeVisible();
});
