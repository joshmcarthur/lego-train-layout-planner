import { expect, test } from '@playwright/test';

import { AUTOSAVE_KEY } from '../../../src/packages/persistence/layout-store.ts';
import {
  placedPieces,
  setupInventory,
  smallInventoryFixture,
  studToCanvasOffset,
  waitForAutosave,
} from '../helpers/inventory.ts';

test('autosaved layout persists after reload', async ({ page }) => {
  await setupInventory(page, smallInventoryFixture);
  await page.goto('editor/');
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(500);

  await page.getByTestId('palette-straight-16').click();
  const canvas = page.getByTestId('editor-canvas');
  const { x, y } = studToCanvasOffset(0, 0);
  await canvas.click({ position: { x, y } });

  await expect(placedPieces(page)).toHaveCount(1);
  await waitForAutosave(page, AUTOSAVE_KEY);

  await page.reload();
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await expect(placedPieces(page)).toHaveCount(1);
});

test('landing shows resume prompt when autosave exists', async ({ page }) => {
  await setupInventory(page, smallInventoryFixture);
  await page.goto('editor/');
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(500);

  await page.getByTestId('palette-straight-16').click();
  const canvas = page.getByTestId('editor-canvas');
  const { x, y } = studToCanvasOffset(0, 0);
  await canvas.click({ position: { x, y } });

  await waitForAutosave(page, AUTOSAVE_KEY);

  await page.goto('');
  await page.waitForSelector('[data-testid="resume-prompt"]');
  await expect(page.getByTestId('resume-prompt')).toBeVisible();
  await page.getByTestId('resume-continue').click();
  await page.waitForURL(/editor\/$/);
  await expect(placedPieces(page)).toHaveCount(1);
});
