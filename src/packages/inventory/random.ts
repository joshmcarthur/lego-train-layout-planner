import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import { getInventoryPreset } from './presets.ts';
import type { Inventory, InventoryPresetId } from './types.ts';
import { createInventory } from './validate.ts';

export function randomInRange(min: number, max: number): number {
  if (min > max) {
    throw new Error(`Invalid range: min ${min} > max ${max}`);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomInventory(
  presetId: InventoryPresetId,
  catalogue: PieceCatalogue,
): Inventory {
  const preset = getInventoryPreset(presetId);
  const counts: Record<string, number> = {};

  for (const piece of catalogue.all()) {
    const range = preset.ranges[piece.inventoryKey];
    if (!range) {
      counts[piece.inventoryKey] = 0;
      continue;
    }
    counts[piece.inventoryKey] = randomInRange(range.min, range.max);
  }

  return createInventory(counts);
}
