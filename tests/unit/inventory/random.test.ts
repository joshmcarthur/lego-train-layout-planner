import { describe, expect, it } from 'vitest';

import {
  getInventoryPreset,
  INVENTORY_PRESETS,
  randomInRange,
  randomInventory,
  validateCount,
} from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

describe('randomInventory', () => {
  it('generates counts within preset bounds', () => {
    for (const preset of INVENTORY_PRESETS) {
      for (let attempt = 0; attempt < 25; attempt += 1) {
        const inventory = randomInventory(preset.id, CATALOGUE_V1);

        for (const piece of CATALOGUE_V1.all()) {
          const range = preset.ranges[piece.inventoryKey];
          const count = inventory.counts[piece.inventoryKey] ?? 0;
          expect(count).toBeGreaterThanOrEqual(range.min);
          expect(count).toBeLessThanOrEqual(range.max);
          expect(validateCount(count).ok).toBe(true);
        }
      }
    }
  });

  it('always includes at least sixteen curves for every preset', () => {
    for (const preset of INVENTORY_PRESETS) {
      const definition = getInventoryPreset(preset.id);
      expect(definition.ranges['curve-r40'].min).toBeGreaterThanOrEqual(16);
    }
  });
});

describe('randomInRange', () => {
  it('returns values inside inclusive bounds', () => {
    for (let index = 0; index < 50; index += 1) {
      const value = randomInRange(2, 6);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(6);
    }
  });
});
