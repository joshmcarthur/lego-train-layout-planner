import { describe, expect, it } from 'vitest';

import {
  CATALOGUE_V1,
  getTransformedGeometry,
  headingToUnitVector,
  SWITCH_LEFT,
  SWITCH_RIGHT,
} from '@track-layout/piece-catalogue';
import type { Heading, PieceDefinition, Point } from '@track-layout/piece-catalogue';

function polygonCentroid(outline: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const point of outline) {
    x += point.x;
    y += point.y;
  }
  return { x: x / outline.length, y: y / outline.length };
}

function portFacesOutward(piece: PieceDefinition, portIndex: number): void {
  const port = piece.ports[portIndex];
  const centroid = polygonCentroid(piece.outline);
  const toPort = {
    x: port.localPosition.x - centroid.x,
    y: port.localPosition.y - centroid.y,
  };
  const facing = headingToUnitVector(port.facing);
  const dot = toPort.x * facing.x + toPort.y * facing.y;
  expect(dot).toBeGreaterThan(0);
}

function headingDelta(a: Heading, b: Heading): number {
  return ((b - a) % 16 + 16) % 16;
}

describe('piece definitions', () => {
  for (const piece of CATALOGUE_V1.all()) {
    describe(piece.id, () => {
      it('has required ports and anchor at origin', () => {
        expect(piece.ports.length).toBeGreaterThanOrEqual(2);
        expect(piece.ports[0].localPosition).toEqual({ x: 0, y: 0 });
      });

      it('has non-empty outline and occupancy', () => {
        expect(piece.outline.length).toBeGreaterThanOrEqual(3);
        const geometry = getTransformedGeometry(piece, 0);
        expect(geometry.occupancy.length).toBeGreaterThan(0);
      });

      it('has outward-facing ports', () => {
        for (let i = 0; i < piece.ports.length; i++) {
          portFacesOutward(piece, i);
        }
      });
    });
  }

  it('switch-right branch exits one heading step from straight route', () => {
    const straight = SWITCH_RIGHT.ports.find((port) => port.id === 'b');
    const branch = SWITCH_RIGHT.ports.find((port) => port.id === 'c');
    expect(straight).toBeDefined();
    expect(branch).toBeDefined();
    if (!straight || !branch) {
      return;
    }
    expect(headingDelta(straight.facing, branch.facing)).toBe(1);
  });

  it('switch-left branch exits one heading step from straight route', () => {
    const straight = SWITCH_LEFT.ports.find((port) => port.id === 'b');
    const branch = SWITCH_LEFT.ports.find((port) => port.id === 'c');
    expect(straight).toBeDefined();
    expect(branch).toBeDefined();
    if (!straight || !branch) {
      return;
    }
    expect(headingDelta(branch.facing, straight.facing)).toBe(1);
  });
});
