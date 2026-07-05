import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { setupInventory, smallInventoryFixture } from './helpers/inventory.ts';

test.describe('accessibility', () => {
  test('home page has no axe violations', async ({ page }) => {
    await page.goto('');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('onboarding page has no axe violations', async ({ page }) => {
    await page.goto('onboarding/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('inventory-onboarding');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('editor page has no axe violations', async ({ page }) => {
    await setupInventory(page, smallInventoryFixture);
    await page.goto('editor/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="editor-canvas"]');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('generate page has no axe violations', async ({ page }) => {
    await setupInventory(page, smallInventoryFixture);
    await page.goto('generate/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('layout-generator-panel');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
