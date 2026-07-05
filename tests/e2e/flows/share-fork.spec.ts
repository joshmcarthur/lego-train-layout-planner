import { expect, test } from '@playwright/test';

import { placedPieces, smallInventoryFixture, studToCanvasOffset } from '../helpers/inventory.ts';
import type { Layout } from '../../../src/packages/connection-engine/types.ts';
import {
  createSerializedAppState,
  encodeShareUrl,
} from '../../../src/packages/persistence/index.ts';
import { CATALOGUE_VERSION } from '../../../src/packages/piece-catalogue/index.ts';
import { INVENTORY_STORAGE_KEY } from '../../../src/packages/persistence/inventory-store.ts';

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

test('share URL forks into editable layout in fresh session', async ({ browser, baseURL }) => {
  const state = createSerializedAppState(sharedLayout, {
    catalogueVersion: CATALOGUE_VERSION,
    inventory: smallInventoryFixture,
  });

  const editorPath = `${baseURL}editor/`;
  const share = encodeShareUrl(state, editorPath);
  expect(share.tooLong).toBe(false);

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(smallInventoryFixture) },
  );

  await page.goto(share.url);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]');

  await expect(placedPieces(page)).toHaveCount(2);
  await expect(page.getByText('Viewing a shared layout')).toBeVisible();

  await page.getByTestId('palette-straight-16').click();
  const canvas = page.getByTestId('editor-canvas');
  const { x, y } = studToCanvasOffset(32, 0);
  await canvas.click({ position: { x, y } });

  await expect(placedPieces(page)).toHaveCount(3);
  await context.close();
});
