import { POSITION_TOLERANCE, type Heading } from '@track-layout/piece-catalogue';
import type { Layout, Placement } from '@track-layout/connection-engine';

const ROUND_FACTOR = 1 / POSITION_TOLERANCE;

function roundStud(value: number): number {
  return Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;
}

function rotatePoint(x: number, y: number, steps: number): { x: number; y: number } {
  const angle = (steps * Math.PI) / 8;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function mirrorHeading(heading: Heading): Heading {
  return ((16 - heading) % 16) as Heading;
}

function transformPlacement(
  placement: Placement,
  rotationSteps: number,
  mirror: boolean,
): { pieceId: string; x: number; y: number; rotation: Heading } {
  let { x, y } = rotatePoint(placement.x, placement.y, rotationSteps);
  let rotation = ((placement.rotation + rotationSteps) % 16) as Heading;

  if (mirror) {
    y = -y;
    rotation = mirrorHeading(rotation);
  }

  return {
    pieceId: placement.pieceId,
    x: roundStud(x),
    y: roundStud(y),
    rotation,
  };
}

function normalizePlacements(
  placements: Placement[],
): Array<{ pieceId: string; x: number; y: number; rotation: Heading }> {
  if (placements.length === 0) {
    return [];
  }

  let minX = Infinity;
  let minY = Infinity;

  for (const placement of placements) {
    minX = Math.min(minX, placement.x);
    minY = Math.min(minY, placement.y);
  }

  return placements.map((placement) => ({
    pieceId: placement.pieceId,
    x: roundStud(placement.x - minX),
    y: roundStud(placement.y - minY),
    rotation: placement.rotation,
  }));
}

function serializeNormalized(
  normalized: Array<{ pieceId: string; x: number; y: number; rotation: Heading }>,
): string {
  const parts = normalized
    .map((p) => `${p.pieceId}@${p.x},${p.y},${p.rotation}`)
    .sort();
  return parts.join('|');
}

export function canonicalHash(layout: Layout): string {
  let best = '';

  for (let mirror = 0; mirror < 2; mirror++) {
    for (let rotation = 0; rotation < 16; rotation++) {
      const transformed = layout.placements.map((placement) =>
        transformPlacement(placement, rotation, mirror === 1),
      );
      const normalized = normalizePlacements(
        transformed.map((t) => ({
          instanceId: '',
          pieceId: t.pieceId,
          x: t.x,
          y: t.y,
          rotation: t.rotation,
        })),
      );
      const serialized = serializeNormalized(normalized);
      if (!best || serialized < best) {
        best = serialized;
      }
    }
  }

  return best;
}

export function isDuplicate(layout: Layout, seen: Set<string>): boolean {
  const hash = canonicalHash(layout);
  if (seen.has(hash)) {
    return true;
  }
  seen.add(hash);
  return false;
}
