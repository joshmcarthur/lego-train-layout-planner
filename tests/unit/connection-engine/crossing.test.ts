import { describe, expect, it } from 'vitest';

import { STRAIGHT_16, type PieceCatalogue, type PieceDefinition } from '@track-layout/piece-catalogue';
import { buildRouteGraph } from '@track-layout/connection-engine';

import { connectToPort, createLayout, placePiece } from './layout-builder.ts';

const SYNTHETIC_CROSSING: PieceDefinition = {
  id: 'test-crossing',
  name: 'Synthetic Crossing',
  category: 'crossing',
  inventoryKey: 'test-crossing',
  outline: [
    { x: 0, y: -4 },
    { x: 16, y: -4 },
    { x: 16, y: 4 },
    { x: 0, y: 4 },
  ],
  ports: [
    { id: 'a', localPosition: { x: 0, y: 0 }, facing: 8, connector: 'rail' },
    { id: 'b', localPosition: { x: 16, y: 0 }, facing: 0, connector: 'rail' },
    { id: 'c', localPosition: { x: 0, y: 8 }, facing: 12, connector: 'rail' },
    { id: 'd', localPosition: { x: 16, y: 8 }, facing: 4, connector: 'rail' },
  ],
  allowedRotations: [0],
};

const TEST_CATALOGUE: PieceCatalogue = {
  version: 99,
  pieces: [SYNTHETIC_CROSSING, STRAIGHT_16],
  getById(id: string): PieceDefinition | undefined {
    return TEST_CATALOGUE.pieces.find((piece) => piece.id === id);
  },
  getByInventoryKey(key: string): PieceDefinition | undefined {
    return TEST_CATALOGUE.pieces.find((piece) => piece.inventoryKey === key);
  },
  all(): PieceDefinition[] {
    return [...TEST_CATALOGUE.pieces];
  },
};

describe('crossing route graph semantics', () => {
  it('keeps opposite port pairs as separate paths when not externally linked', () => {
    const crossing = placePiece('test-crossing', 0, 0, 0, 'cross');
    const withWestArm = createLayout([
      crossing,
      connectToPort(
        createLayout([crossing]),
        { instanceId: 'cross', portId: 'a' },
        'straight-16',
        'a',
        TEST_CATALOGUE,
        'west-arm',
      ),
    ]);
    const layout = createLayout([
      ...withWestArm.placements,
      connectToPort(
        withWestArm,
        { instanceId: 'cross', portId: 'd' },
        'straight-16',
        'a',
        TEST_CATALOGUE,
        'south-arm',
      ),
    ]);

    const graph = buildRouteGraph(layout, TEST_CATALOGUE);
    expect(graph.components).toHaveLength(2);
    expect(graph.closedComponents).toHaveLength(0);
  });
});
