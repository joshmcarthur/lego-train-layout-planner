import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import {
  INVENTORY_SCHEMA_VERSION,
  MAX_PIECE_COUNT,
  MIN_PIECE_COUNT,
  type Inventory,
  type ValidateCountResult,
} from './types.ts';

export function validateCount(value: unknown): ValidateCountResult {
  if (typeof value === 'string' && value.trim() === '') {
    return { ok: true, count: 0 };
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    return { ok: false, error: 'Enter a whole number' };
  }

  if (numeric < MIN_PIECE_COUNT) {
    return { ok: false, error: 'Count cannot be negative' };
  }

  if (numeric > MAX_PIECE_COUNT) {
    return { ok: false, error: `Maximum is ${MAX_PIECE_COUNT}` };
  }

  return { ok: true, count: numeric };
}

export function normalizeCounts(
  counts: Record<string, number>,
  catalogue: PieceCatalogue,
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const piece of catalogue.all()) {
    const raw = counts[piece.inventoryKey] ?? 0;
    const validated = validateCount(raw);
    normalized[piece.inventoryKey] = validated.ok ? validated.count : 0;
  }

  return normalized;
}

export function createEmptyInventory(catalogue: PieceCatalogue): Inventory {
  const counts: Record<string, number> = {};
  for (const piece of catalogue.all()) {
    counts[piece.inventoryKey] = 0;
  }
  return createInventory(counts, catalogue);
}

export function createInventory(
  counts: Record<string, number>,
  catalogue?: PieceCatalogue,
): Inventory {
  const normalized = catalogue ? normalizeCounts(counts, catalogue) : { ...counts };

  return {
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    counts: normalized,
    updatedAt: new Date().toISOString(),
  };
}

export function totalPieceCount(inventory: Inventory): number {
  return Object.values(inventory.counts).reduce((sum, count) => sum + count, 0);
}

export function isInventory(value: unknown): value is Inventory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Inventory>;
  return (
    candidate.schemaVersion === INVENTORY_SCHEMA_VERSION &&
    typeof candidate.counts === 'object' &&
    candidate.counts !== null &&
    typeof candidate.updatedAt === 'string'
  );
}
