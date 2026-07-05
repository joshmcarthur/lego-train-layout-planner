import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CURVE_R40,
  getTransformedGeometry,
  oppositeHeading,
  pointsCoincide,
  POSITION_TOLERANCE,
  rotateHeading,
  rotatePoint,
  STRAIGHT_16,
} from '@track-layout/piece-catalogue';
import type { Heading, Point } from '@track-layout/piece-catalogue';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const piecesFixture = JSON.parse(
  readFileSync(path.resolve(fixtureDir, '../../fixtures/pieces.json'), 'utf8'),
) as {
  tolerance: number;
  pieces: Record<
    string,
    {
      transforms: Record<string, { ports: Array<{ id: string; position: Point; facing: Heading }> }>;
    }
  >;
};

function expectNear(actual: number, expected: number, tolerance = POSITION_TOLERANCE): void {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
}

describe('transform utilities', () => {
  it('returns to origin after 16 heading rotations of a point', () => {
    const point = { x: 3.5, y: -7.25 };
    let rotated = point;
    for (let step = 0; step < 16; step++) {
      rotated = rotatePoint(rotated, 1);
    }
    expectNear(rotated.x, point.x);
    expectNear(rotated.y, point.y);
  });

  it('rotates headings with exact integer arithmetic', () => {
    expect(rotateHeading(0, 1)).toBe(1);
    expect(rotateHeading(15, 1)).toBe(0);
    expect(oppositeHeading(3)).toBe(11);
  });

  it('compares points within tolerance', () => {
    expect(pointsCoincide({ x: 0, y: 0 }, { x: 0.005, y: -0.005 })).toBe(true);
    expect(pointsCoincide({ x: 0, y: 0 }, { x: 0.02, y: 0 })).toBe(false);
  });

  it('matches straight fixture ports at headings 0, 1, and 4', () => {
    const fixture = piecesFixture.pieces['straight-16'];
    for (const heading of [0, 1, 4] as Heading[]) {
      const actual = getTransformedGeometry(STRAIGHT_16, heading).ports;
      const expected = fixture.transforms[String(heading)].ports;
      expect(actual).toHaveLength(expected.length);
      for (let i = 0; i < actual.length; i++) {
        expectNear(actual[i].position.x, expected[i].position.x);
        expectNear(actual[i].position.y, expected[i].position.y);
        expect(actual[i].facing).toBe(expected[i].facing);
      }
    }
  });

  it('closes a circle with sixteen curves', () => {
    let origin = { x: 0, y: 0 };
    let heading: Heading = 0;

    for (let i = 0; i < 16; i++) {
      const geometry = getTransformedGeometry(CURVE_R40, heading);
      const exit = geometry.ports.find((port) => port.id === 'b');
      if (!exit) {
        throw new Error('curve missing exit port');
      }
      origin = {
        x: origin.x + exit.position.x,
        y: origin.y + exit.position.y,
      };
      heading = rotateHeading(heading, 1);
    }

    expectNear(origin.x, 0);
    expectNear(origin.y, 0);
    expect(heading).toBe(0);
  });

  it('turns exactly 90° with four curves', () => {
    let heading: Heading = 0;
    for (let i = 0; i < 4; i++) {
      heading = rotateHeading(heading, 1);
    }
    expect(heading).toBe(4);
  });
});
