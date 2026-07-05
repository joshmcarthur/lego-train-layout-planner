import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import { getWorldOccupancy } from './placement.ts';
import type { Layout, ValidationIssue } from './types.ts';

function overlapKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function detectOverlaps(layout: Layout, catalogue: PieceCatalogue): ValidationIssue[] {
  const cellOwners = new Map<string, string>();
  const reportedPairs = new Set<string>();
  const issues: ValidationIssue[] = [];

  for (const placement of layout.placements) {
    const cells = getWorldOccupancy(placement, catalogue);
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      const existingOwner = cellOwners.get(key);
      if (!existingOwner) {
        cellOwners.set(key, placement.instanceId);
        continue;
      }

      if (existingOwner === placement.instanceId) {
        continue;
      }

      const pairKey = overlapKey(existingOwner, placement.instanceId);
      if (reportedPairs.has(pairKey)) {
        continue;
      }

      reportedPairs.add(pairKey);
      issues.push({
        severity: 'error',
        code: 'OVERLAP',
        a: existingOwner,
        b: placement.instanceId,
      });
    }
  }

  return issues;
}
