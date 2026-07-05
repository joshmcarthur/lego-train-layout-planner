import { expect, test } from '@playwright/test';

import { clearAppStorage } from '../helpers/inventory.ts';

test('first visit routes through onboarding to editor', async ({ page }) => {
  await clearAppStorage(page);
  await page.goto('');
  await page.waitForURL(/onboarding\/$/);
  await page.waitForSelector('inventory-onboarding');

  await page.getByLabel('Random inventory').selectOption('small');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByLabel('Straight Track 16')).not.toHaveValue('0');

  await page.getByRole('button', { name: 'Continue to editor' }).click();

  await page.waitForURL(/editor\/$/);
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
});
