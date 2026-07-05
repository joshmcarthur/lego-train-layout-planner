import type { Point } from './types.ts';

const R = 40;
const ARC_DEGREES = 22.5;

function curveArcPoints(
  centre: Point,
  radius: number,
  startAngle: number,
  sweepRadians: number,
  segments: number,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + sweepRadians * t;
    points.push({
      x: centre.x + radius * Math.cos(angle),
      y: centre.y + radius * Math.sin(angle),
    });
  }
  return points;
}

/** Outer R44 / inner R36 arc footprint for R40 centreline curve (centre south of entry). */
export function buildCurveOutline(): Point[] {
  const centre = { x: 0, y: R };
  const startAngle = Math.atan2(-R, 0);
  const sweep = (ARC_DEGREES * Math.PI) / 180;
  const segments = 8;

  const outer = curveArcPoints(centre, R + 4, startAngle, sweep, segments);
  const inner = curveArcPoints(centre, R - 4, startAngle + sweep, -sweep, segments);
  return [...outer, ...inner];
}

/** Bounding outline for switch pieces (covers straight and branch routes). */
export function buildSwitchOutline(branchToSouth: boolean): Point[] {
  const ySign = branchToSouth ? 1 : -1;
  return [
    { x: 0, y: -4 },
    { x: 32, y: -4 },
    { x: 34, y: 6 * ySign },
    { x: 32.7, y: 16 * ySign },
    { x: 24, y: 14 * ySign },
    { x: 0, y: 4 },
  ];
}

export const CURVE_EXIT_X = R * Math.sin((ARC_DEGREES * Math.PI) / 180);
export const CURVE_EXIT_Y = R - R * Math.cos((ARC_DEGREES * Math.PI) / 180);

export const SWITCH_BRANCH_X = 32.6926;
export const SWITCH_BRANCH_Y = 12.95515;
