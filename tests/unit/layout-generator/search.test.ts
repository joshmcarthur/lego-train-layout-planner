import { buildRouteGraph } from '@track-layout/connection-engine';
import { createInventory } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import {
  canonicalHash,
  handleWorkerRequest,
  searchLayouts,
} from '@track-layout/layout-generator';
import { describe, expect, it } from 'vitest';

import { createLayout } from '../connection-engine/layout-builder.ts';

function inventory(counts: Record<string, number>) {
  return createInventory(counts, CATALOGUE_V1);
}

describe('searchLayouts', () => {
  it('returns one colinear layout for two straights', () => {
    const result = searchLayouts(inventory({ 'straight-16': 2 }), {
      seed: 42,
      maxResults: 12,
    });

    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    const layout = result.candidates[0]!;
    expect(layout.placements).toHaveLength(2);
    expect(layout.placements.every((p) => p.pieceId === 'straight-16')).toBe(true);
  });

  it('returns empty result below minPieces for a single straight', () => {
    const result = searchLayouts(inventory({ 'straight-16': 1 }), { seed: 42 });

    expect(result.candidates).toHaveLength(0);
    expect(result.message).toBe('No valid layout found');
  });

  it('returns immediate empty result for empty inventory', () => {
    const result = searchLayouts(inventory({}), { seed: 42 });

    expect(result.candidates).toHaveLength(0);
    expect(result.exhausted).toBe(true);
    expect(result.message).toBe('No valid layout found');
    expect(result.explored).toBe(0);
  });

  it('finds a closed loop with sixteen curves', () => {
    const result = searchLayouts(inventory({ 'curve-r40': 16 }), {
      seed: 7,
      timeoutMs: 20000,
      maxNodesExplored: 150000,
      maxResults: 12,
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    const hasClosed = result.candidates.some(
      (layout) => buildRouteGraph(layout, CATALOGUE_V1).closedComponents.length > 0,
    );
    expect(hasClosed).toBe(true);
  }, 25000);

  it('returns open candidates only for fifteen curves', () => {
    const result = searchLayouts(inventory({ 'curve-r40': 15 }), {
      seed: 7,
      timeoutMs: 8000,
      maxNodesExplored: 80000,
      maxResults: 12,
    });

    if (result.candidates.length > 0) {
      for (const layout of result.candidates) {
        expect(buildRouteGraph(layout, CATALOGUE_V1).closedComponents).toHaveLength(0);
      }
    }
  }, 15000);

  it('is deterministic for the same seed', () => {
    const inv = inventory({ 'straight-16': 4 });
    const options = { seed: 99, maxResults: 6, timeoutMs: 5000, maxNodesExplored: 10000 };

    const first = searchLayouts(inv, options);
    const second = searchLayouts(inv, options);

    expect(first.candidates.map((l) => canonicalHash(l))).toEqual(
      second.candidates.map((l) => canonicalHash(l)),
    );
  }, 15000);

  it('returns partial results on timeout when layouts were found', () => {
    const result = searchLayouts(inventory({ 'straight-16': 8, 'curve-r40': 8 }), {
      seed: 1,
      timeoutMs: 1,
      maxNodesExplored: 100000,
      maxResults: 12,
    });

    expect(result.exhausted).toBe(true);
  });
});

describe('canonicalHash', () => {
  it('treats translated layouts as duplicates', () => {
    const layoutA = createLayout([
      {
        instanceId: 'a-1',
        pieceId: 'straight-16',
        x: 0,
        y: 0,
        rotation: 0,
      },
      {
        instanceId: 'a-2',
        pieceId: 'straight-16',
        x: 16,
        y: 0,
        rotation: 0,
      },
    ]);

    const layoutB = createLayout([
      {
        instanceId: 'b-1',
        pieceId: 'straight-16',
        x: 100,
        y: 50,
        rotation: 0,
      },
      {
        instanceId: 'b-2',
        pieceId: 'straight-16',
        x: 116,
        y: 50,
        rotation: 0,
      },
    ]);

    expect(canonicalHash(layoutA)).toBe(canonicalHash(layoutB));
  });
});

describe('handleWorkerRequest', () => {
  it('round-trips worker messages', () => {
    const messages: unknown[] = [];

    const done = handleWorkerRequest(
      {
        type: 'search',
        inventory: inventory({ 'straight-16': 2 }),
        options: {
          maxResults: 4,
          timeoutMs: 5000,
          maxNodesExplored: 50000,
          preferClosedLoops: true,
          minPieces: 2,
          seed: 42,
        },
      },
      (message) => {
        messages.push(message);
      },
    );

    expect(done).not.toBeNull();
    expect(done?.status).toBe('done');
    expect(messages.some((m) => (m as { status: string }).status === 'progress')).toBe(true);
    expect(messages.at(-1)).toMatchObject({ status: 'done' });
  });
});
