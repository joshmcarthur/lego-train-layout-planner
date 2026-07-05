import type { Layout } from '@track-layout/connection-engine';
import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import type { Inventory } from './types.ts';
import { normalizeCounts } from './validate.ts';

export function getRemainingCounts(
  inventory: Inventory,
  layout: Layout,
  catalogue: PieceCatalogue,
): Record<string, number> {
  const remaining = { ...normalizeCounts(inventory.counts, catalogue) };

  for (const placement of layout.placements) {
    const piece = catalogue.getById(placement.pieceId);
    if (!piece) {
      continue;
    }

    const key = piece.inventoryKey;
    remaining[key] = Math.max(0, (remaining[key] ?? 0) - 1);
  }

  return remaining;
}

export function canUsePiece(
  inventory: Inventory,
  pieceId: string,
  layout: Layout,
  catalogue: PieceCatalogue,
): boolean {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return false;
  }

  const remaining = getRemainingCounts(inventory, layout, catalogue);
  return (remaining[piece.inventoryKey] ?? 0) > 0;
}

export function subtractForPlacement(
  inventory: Inventory,
  pieceId: string,
  catalogue: PieceCatalogue,
): Inventory {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return inventory;
  }

  const key = piece.inventoryKey;
  const current = inventory.counts[key] ?? 0;

  return {
    ...inventory,
    counts: {
      ...inventory.counts,
      [key]: Math.max(0, current - 1),
    },
    updatedAt: new Date().toISOString(),
  };
}
