import { expect, test } from '@playwright/test';

test('home page redirects to onboarding on first visit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('');
  await page.waitForURL(/onboarding\/$/);
  await expect(page.getByRole('heading', { name: 'Your track inventory' })).toBeVisible();
});

test('app header shows main navigation', async ({ page }) => {
  await page.goto('onboarding/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});
