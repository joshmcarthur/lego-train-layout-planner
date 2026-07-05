import { expect, test } from '@playwright/test';

import { placedPieces, setupInventory } from '../helpers/inventory.ts';

test('random inventory generate opens layout in editor', async ({ page }) => {
  await setupInventory(page);
  await page.goto('generate/');
  await page.waitForSelector('layout-generator-panel');

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByText(/Explored \d+ configurations/)).toBeVisible({ timeout: 30_000 });

  const openInEditor = page.getByRole('button', { name: 'Open in editor' }).first();
  await expect(openInEditor).toBeVisible({ timeout: 30_000 });
  await openInEditor.click();

  await page.waitForURL(/editor\/$/);
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await expect(placedPieces(page)).not.toHaveCount(0);
});
