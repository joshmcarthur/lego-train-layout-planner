import { describe, expect, it } from 'vitest';

import {
  CATALOGUE_V1,
  CATALOGUE_VERSION,
  getTransformedGeometry,
  pointsCoincide,
  STRAIGHT_16,
} from '@track-layout/piece-catalogue';
import type { Heading } from '@track-layout/piece-catalogue';

describe('catalogue', () => {
  it('exports version 1 with four MVP pieces', () => {
    expect(CATALOGUE_VERSION).toBe(1);
    expect(CATALOGUE_V1.version).toBe(1);
    expect(CATALOGUE_V1.all()).toHaveLength(4);
  });

  it('has unique ids and inventory keys', () => {
    const ids = CATALOGUE_V1.all().map((piece) => piece.id);
    const keys = CATALOGUE_V1.all().map((piece) => piece.inventoryKey);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('looks up pieces by id and inventory key', () => {
    expect(CATALOGUE_V1.getById('curve-r40')?.inventoryKey).toBe('curve-r40');
    expect(CATALOGUE_V1.getByInventoryKey('switch-left')?.id).toBe('switch-left');
    expect(CATALOGUE_V1.getById('missing')).toBeUndefined();
  });

  it('allows colinear straight join between opposite headings', () => {
    const first = getTransformedGeometry(STRAIGHT_16, 0 as Heading);
    const second = getTransformedGeometry(STRAIGHT_16, 8 as Heading);

    const firstEast = first.ports.find((port) => port.id === 'b');
    const secondWest = second.ports.find((port) => port.id === 'a');

    expect(firstEast).toBeDefined();
    expect(secondWest).toBeDefined();
    if (!firstEast || !secondWest) {
      return;
    }

    const joinedEast = {
      x: firstEast.position.x,
      y: firstEast.position.y,
    };
    const joinedWest = {
      x: joinedEast.x + secondWest.position.x,
      y: joinedEast.y + secondWest.position.y,
    };

    expect(pointsCoincide(joinedEast, joinedWest)).toBe(true);
  });
});
