import { expect, test } from '@playwright/test';

import { setupInventory } from './helpers/inventory.ts';

test('app shell shows navigation on editor', async ({ page }) => {
  await setupInventory(page);
  await page.goto('editor/');
  await page.waitForSelector('[data-testid="editor-canvas"]');

  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Generate' })).toBeVisible();
});

test('mobile editor shows view-only banner and hides palette', async ({ page }) => {
  await setupInventory(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('editor/');
  await page.waitForSelector('[data-testid="editor-canvas"]');

  await expect(page.getByTestId('mobile-editor-banner')).toBeVisible();
  await expect(page.getByTestId('palette-straight-16')).toHaveCount(0);
});
