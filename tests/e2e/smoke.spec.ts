import { expect, test } from '@playwright/test';

test('home page shows app title', async ({ page }) => {
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'Lego Train Layout Planner' }),
  ).toBeVisible();
});

test('lit smoke counter increments on click', async ({ page }) => {
  await page.goto('');
  await page.waitForLoadState('networkidle');
  const incrementButton = page.getByRole('button', { name: 'Increment' });
  await expect(incrementButton).toBeVisible();
  await expect(page.getByText('Count: 0')).toBeVisible();
  await incrementButton.click();
  await expect(page.getByText('Count: 1')).toBeVisible();
});
