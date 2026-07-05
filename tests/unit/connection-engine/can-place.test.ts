import { describe, expect, it } from 'vitest';

import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { canPlace, validateLayout } from '@track-layout/connection-engine';

import { createLayout, placePiece } from './layout-builder.ts';

describe('canPlace', () => {
  it('allows adding a valid straight to an empty layout', () => {
    const empty = createLayout([]);
    const candidate = placePiece('straight-16', 0, 0, 0, 'candidate');

    const result = canPlace(empty, candidate, CATALOGUE_V1);
    expect(result.valid).toBe(true);
  });

  it('rejects an overlapping straight on the same anchor', () => {
    const existing = createLayout([placePiece('straight-16', 0, 0, 0, 'existing')]);
    const candidate = placePiece('straight-16', 0, 0, 0, 'overlap');

    const result = canPlace(existing, candidate, CATALOGUE_V1);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'OVERLAP')).toBe(true);
  });

  it('matches validateLayout with candidate appended', () => {
    const layout = createLayout([placePiece('straight-16', 0, 0, 0, 'existing')]);
    const candidate = placePiece('straight-16', 32, 0, 0, 'separate');

    const canPlaceResult = canPlace(layout, candidate, CATALOGUE_V1);
    const validateResult = validateLayout(
      { ...layout, placements: [...layout.placements, candidate] },
      CATALOGUE_V1,
    );

    expect(canPlaceResult).toEqual(validateResult);
  });
});
