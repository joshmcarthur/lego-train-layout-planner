import { expect, test } from '@playwright/test';

import { INVENTORY_STORAGE_KEY } from '../../src/packages/persistence/inventory-store.ts';

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

/** Matches default editor viewport from createEditorState. */
const DEFAULT_VIEWPORT = { panX: 48, panY: 48, zoom: 6 };

function studToCanvasOffset(studX: number, studY: number) {
  return {
    x: DEFAULT_VIEWPORT.panX + studX * DEFAULT_VIEWPORT.zoom,
    y: DEFAULT_VIEWPORT.panY + studY * DEFAULT_VIEWPORT.zoom,
  };
}

test('editor places a straight piece and decrements inventory badge', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await page.goto('editor/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(500);

  const straightBadge = page.getByTestId('palette-straight-16').locator('.badge');
  await expect(straightBadge).toHaveText('3');

  await page.getByTestId('palette-straight-16').click();

  const canvas = page.getByTestId('editor-canvas');
  await expect(canvas).toBeVisible();

  const { x, y } = studToCanvasOffset(0, 0);
  await canvas.click({ position: { x, y } });

  await expect(straightBadge).toHaveText('2');
});
