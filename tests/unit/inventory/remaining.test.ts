import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { Layout } from '@track-layout/connection-engine';
import {
  canUsePiece,
  createInventory,
  getRemainingCounts,
  subtractForPlacement,
} from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/layouts',
);

function loadLayout(name: string): Layout {
  const raw = readFileSync(path.join(fixturesDir, name), 'utf8');
  return JSON.parse(raw) as Layout;
}

describe('getRemainingCounts', () => {
  it('decrements counts for each placement', () => {
    const inventory = createInventory(
      {
        'straight-16': 10,
        'curve-r40': 20,
        'switch-left': 2,
        'switch-right': 2,
      },
      CATALOGUE_V1,
    );
    const layout = loadLayout('two-straights-valid.json');
    const remaining = getRemainingCounts(inventory, layout, CATALOGUE_V1);

    expect(remaining['straight-16']).toBe(8);
    expect(remaining['curve-r40']).toBe(20);
  });

  it('floors remaining counts at zero', () => {
    const inventory = createInventory(
      {
        'straight-16': 1,
        'curve-r40': 0,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );
    const layout = loadLayout('two-straights-valid.json');
    const remaining = getRemainingCounts(inventory, layout, CATALOGUE_V1);

    expect(remaining['straight-16']).toBe(0);
  });
});

describe('canUsePiece', () => {
  it('returns false when no pieces remain', () => {
    const inventory = createInventory(
      {
        'straight-16': 0,
        'curve-r40': 0,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );
    const layout = loadLayout('two-straights-valid.json');

    expect(canUsePiece(inventory, 'straight-16', layout, CATALOGUE_V1)).toBe(false);
  });

  it('returns true when inventory has available pieces', () => {
    const inventory = createInventory(
      {
        'straight-16': 5,
        'curve-r40': 0,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );
    const layout = loadLayout('two-straights-valid.json');

    expect(canUsePiece(inventory, 'straight-16', layout, CATALOGUE_V1)).toBe(true);
  });

  it('ignores unknown piece ids', () => {
    const inventory = createInventory(
      {
        'straight-16': 1,
        'curve-r40': 0,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );
    const layout = loadLayout('two-straights-valid.json');

    expect(canUsePiece(inventory, 'missing-piece', layout, CATALOGUE_V1)).toBe(false);
  });
});

describe('subtractForPlacement', () => {
  it('returns a new inventory with one fewer piece', () => {
    const inventory = createInventory(
      {
        'straight-16': 4,
        'curve-r40': 0,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );

    const next = subtractForPlacement(inventory, 'straight-16', CATALOGUE_V1);
    expect(next).not.toBe(inventory);
    expect(next.counts['straight-16']).toBe(3);
    expect(inventory.counts['straight-16']).toBe(4);
  });
});
