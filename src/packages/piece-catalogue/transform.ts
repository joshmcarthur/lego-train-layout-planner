import { TRIG_TABLE } from './constants.ts';
import type {
  FootprintCell,
  Heading,
  PieceDefinition,
  Point,
  TransformedGeometry,
} from './types.ts';
import { assertHeading, POSITION_TOLERANCE } from './types.ts';

const geometryCache = new Map<string, TransformedGeometry>();

export function rotatePoint(point: Point, heading: Heading): Point {
  const { cos, sin } = TRIG_TABLE[heading];
  return {
    x: point.x * cos + point.y * sin,
    y: -point.x * sin + point.y * cos,
  };
}

export function rotateHeading(facing: Heading, by: number): Heading {
  return assertHeading(((facing + by) % 16 + 16) % 16);
}

export function oppositeHeading(h: Heading): Heading {
  return rotateHeading(h, 8);
}

export function pointsCoincide(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < POSITION_TOLERANCE;
}

function cellKey(cell: FootprintCell): string {
  return `${cell.x},${cell.y}`;
}

/**
 * Fill a polygon at 1-stud cell resolution using ray casting per integer cell
 * in the polygon's bounding box.
 */
export function rasterizeOutline(outline: Point[], heading: Heading): FootprintCell[] {
  if (outline.length < 3) {
    return [];
  }

  const rotated = outline.map((p) => rotatePoint(p, heading));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of rotated) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const startX = Math.floor(minX);
  const endX = Math.ceil(maxX);
  const startY = Math.floor(minY);
  const endY = Math.ceil(maxY);
  const cells = new Map<string, FootprintCell>();

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      if (pointInPolygon({ x: x + 0.5, y: y + 0.5 }, rotated)) {
        const cell = { x, y };
        cells.set(cellKey(cell), cell);
      }
    }
  }

  return [...cells.values()];
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x <
        ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + Number.EPSILON) + pi.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function getTransformedGeometry(
  piece: PieceDefinition,
  heading: Heading,
): TransformedGeometry {
  const cacheKey = `${piece.id}:${heading}`;
  const cached = geometryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const geometry: TransformedGeometry = {
    ports: piece.ports.map((port) => {
      const position = rotatePoint(port.localPosition, heading);
      return {
        id: port.id,
        position,
        facing: rotateHeading(port.facing, heading),
        connector: port.connector,
      };
    }),
    occupancy: rasterizeOutline(piece.outline, heading),
  };

  geometryCache.set(cacheKey, geometry);
  return geometry;
}

/** Clear memoized geometry — intended for tests only. */
export function clearGeometryCache(): void {
  geometryCache.clear();
}

export function headingToUnitVector(heading: Heading): Point {
  const { cos, sin } = TRIG_TABLE[heading];
  return { x: cos, y: sin };
}
