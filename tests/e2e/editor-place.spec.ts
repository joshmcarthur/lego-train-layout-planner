import { expect, test } from '@playwright/test';

import { setupInventory, smallInventoryFixture, studToCanvasOffset } from './helpers/inventory.ts';

test('editor places a straight piece and decrements inventory badge', async ({ page }) => {
  await setupInventory(page, smallInventoryFixture);
  await page.goto('editor/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(500);

  const straightBadge = page.getByTestId('palette-straight-16').locator('.badge');
  await expect(straightBadge).toHaveText('3');

  await page.getByTestId('palette-straight-16').click();

  const canvas = page.getByTestId('editor-canvas');
  await expect(canvas).toBeVisible();

  const { x, y } = studToCanvasOffset(0, 0);
  await canvas.click({ position: { x, y } });

  await expect(straightBadge).toHaveText('2');
});
