import type { Page } from '@playwright/test';

import { INVENTORY_STORAGE_KEY } from '../../../src/packages/persistence/inventory-store.ts';

export const inventoryFixture = {
  schemaVersion: 1 as const,
  counts: {
    'straight-16': 4,
    'curve-r40': 2,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

export const smallInventoryFixture = {
  schemaVersion: 1 as const,
  counts: {
    'straight-16': 3,
    'curve-r40': 0,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

export async function clearAppStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

export async function seedInventory(page: Page, inventory = inventoryFixture): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventory) },
  );
}

export async function setupInventory(page: Page, inventory = inventoryFixture): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    ({ key, value }) => {
      localStorage.clear();
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventory) },
  );
}

/** Matches default editor viewport from createEditorState. */
export const DEFAULT_VIEWPORT = { panX: 48, panY: 48, zoom: 6 };

export function studToCanvasOffset(studX: number, studY: number) {
  return {
    x: DEFAULT_VIEWPORT.panX + studX * DEFAULT_VIEWPORT.zoom,
    y: DEFAULT_VIEWPORT.panY + studY * DEFAULT_VIEWPORT.zoom,
  };
}

export function placedPieces(page: Page) {
  return page.locator('g.piece[data-instance-id]:not([data-instance-id="__ghost__"])');
}

export async function waitForAutosave(page: Page, key: string): Promise<void> {
  await page.waitForFunction(
    (storageKey) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return false;
      }
      try {
        const parsed = JSON.parse(raw) as { layout?: { placements?: unknown[] } };
        return (parsed.layout?.placements?.length ?? 0) > 0;
      } catch {
        return false;
      }
    },
    key,
    { timeout: 5000 },
  );
}
