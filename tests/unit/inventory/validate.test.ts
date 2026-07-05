import { describe, expect, it } from 'vitest';

import {
  createEmptyInventory,
  createInventory,
  isInventory,
  MAX_PIECE_COUNT,
  normalizeCounts,
  totalPieceCount,
  validateCount,
} from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

describe('validateCount', () => {
  it('accepts valid non-negative integers', () => {
    expect(validateCount(0)).toEqual({ ok: true, count: 0 });
    expect(validateCount('12')).toEqual({ ok: true, count: 12 });
    expect(validateCount('')).toEqual({ ok: true, count: 0 });
  });

  it('rejects negative values', () => {
    const result = validateCount(-1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/negative/i);
    }
  });

  it('rejects non-integers', () => {
    const result = validateCount('1.5');
    expect(result.ok).toBe(false);
  });

  it('rejects values above the maximum', () => {
    const result = validateCount(MAX_PIECE_COUNT + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/maximum/i);
    }
  });
});

describe('normalizeCounts', () => {
  it('fills missing catalogue keys with zero', () => {
    const normalized = normalizeCounts({ 'straight-16': 3 }, CATALOGUE_V1);

    expect(normalized['straight-16']).toBe(3);
    expect(normalized['curve-r40']).toBe(0);
    expect(normalized['switch-left']).toBe(0);
    expect(normalized['switch-right']).toBe(0);
  });
});

describe('createInventory', () => {
  it('creates a versioned inventory with timestamp', () => {
    const inventory = createInventory({ 'straight-16': 2 }, CATALOGUE_V1);

    expect(inventory.schemaVersion).toBe(1);
    expect(inventory.counts['straight-16']).toBe(2);
    expect(inventory.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('createEmptyInventory', () => {
  it('initializes all catalogue keys to zero', () => {
    const inventory = createEmptyInventory(CATALOGUE_V1);
    expect(totalPieceCount(inventory)).toBe(0);
  });
});

describe('isInventory', () => {
  it('recognizes valid inventory objects', () => {
    const inventory = createInventory({ 'straight-16': 1 }, CATALOGUE_V1);
    expect(isInventory(inventory)).toBe(true);
    expect(isInventory({ schemaVersion: 2, counts: {}, updatedAt: 'x' })).toBe(false);
    expect(isInventory(null)).toBe(false);
  });
});
