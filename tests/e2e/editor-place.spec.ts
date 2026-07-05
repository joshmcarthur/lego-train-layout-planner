import { expect, test } from '@playwright/test';

import { INVENTORY_STORAGE_KEY } from '../../src/packages/persistence/inventory-store.ts';

const inventoryFixture = {
  schemaVersion: 1,
  counts: {
    'straight-16': 3,
    'curve-r40': 0,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

test('editor places a straight piece and decrements inventory badge', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await page.goto('editor/');
  await page.waitForLoadState('networkidle');

  const straightBadge = page.getByTestId('palette-straight-16').locator('.badge');
  await expect(straightBadge).toHaveText('3');

  await page.getByTestId('palette-straight-16').click();

  const canvas = page.getByTestId('editor-canvas');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  // Click near canvas centre (world origin area with default pan/zoom)
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.45);

  await expect(straightBadge).toHaveText('2');
});
