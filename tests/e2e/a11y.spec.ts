import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { setupInventory } from './helpers/inventory.ts';

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
    await setupInventory(page, inventoryFixture);
    await page.goto('editor/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="editor-canvas"]');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('generate page has no axe violations', async ({ page }) => {
    await setupInventory(page, inventoryFixture);
    await page.goto('generate/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('layout-generator-panel');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
