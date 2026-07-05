import { expect, test } from '@playwright/test';

test('home page shows app title', async ({ page }) => {
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'Lego Train Layout Planner' }),
  ).toBeVisible();
});

test('lit smoke counter increments on click', async ({ page }) => {
  await page.goto('');
  const counter = page.locator('lit-smoke-counter');
  await expect(counter).toBeVisible();
  await expect(counter.getByText('Count: 0')).toBeVisible();
  await counter.getByRole('button', { name: 'Increment' }).click();
  await expect(counter.getByText('Count: 1')).toBeVisible();
});
