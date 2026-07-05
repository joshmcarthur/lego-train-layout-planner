import { expect, test } from '@playwright/test';

test('home page shows app title', async ({ page }) => {
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'Lego Train Layout Planner' }),
  ).toBeVisible();
});
