import {
  buildCurveOutline,
  CURVE_EXIT_X,
  CURVE_EXIT_Y,
  SWITCH_BRANCH_X,
  SWITCH_BRANCH_Y,
} from '@track-layout/piece-catalogue';

export interface PieceSprite {
  /** Centreline path for rails */
  railPath: string;
  /** Footprint outline for collision preview */
  footprintPath: string;
  /** Sleeper tick positions along the centreline */
  sleepers: Array<{ x: number; y: number; angle: number }>;
}

function pointsToPath(points: Array<{ x: number; y: number }>, close = true): string {
  if (points.length === 0) {
    return '';
  }
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  return `M ${first!.x} ${first!.y} ${segments}${close ? ' Z' : ''}`;
}

function straightSleepers(length: number): PieceSprite['sleepers'] {
  const sleepers: PieceSprite['sleepers'] = [];
  for (let x = 2; x < length; x += 4) {
    sleepers.push({ x, y: 0, angle: 90 });
  }
  return sleepers;
}

const STRAIGHT_SPRITE: PieceSprite = {
  railPath: 'M 0 0 L 16 0',
  footprintPath: pointsToPath([
    { x: 0, y: -4 },
    { x: 16, y: -4 },
    { x: 16, y: 4 },
    { x: 0, y: 4 },
  ]),
  sleepers: straightSleepers(16),
};

const CURVE_SPRITE: PieceSprite = {
  railPath: `M 0 0 A 40 40 0 0 1 ${CURVE_EXIT_X} ${CURVE_EXIT_Y}`,
  footprintPath: pointsToPath(buildCurveOutline()),
  sleepers: [
    { x: 0, y: 0, angle: 180 },
    { x: CURVE_EXIT_X * 0.5, y: CURVE_EXIT_Y * 0.5, angle: 157.5 },
    { x: CURVE_EXIT_X, y: CURVE_EXIT_Y, angle: 112.5 },
  ],
};

function switchSprite(branchY: number): PieceSprite {
  return {
    railPath: `M 0 0 L 32 0 M 0 0 L ${SWITCH_BRANCH_X} ${branchY}`,
    footprintPath: pointsToPath([
      { x: 0, y: -4 },
      { x: 32, y: -4 },
      { x: 34, y: branchY > 0 ? 6 : -6 },
      { x: 32.7, y: branchY > 0 ? 16 : -16 },
      { x: 24, y: branchY > 0 ? 14 : -14 },
      { x: 0, y: 4 },
    ]),
    sleepers: [
      { x: 4, y: 0, angle: 90 },
      { x: 12, y: 0, angle: 90 },
      { x: 20, y: 0, angle: 90 },
      { x: 28, y: 0, angle: 90 },
      { x: SWITCH_BRANCH_X * 0.6, y: branchY * 0.5, angle: branchY > 0 ? 60 : 120 },
    ],
  };
}

const SPRITES: Record<string, PieceSprite> = {
  'straight-16': STRAIGHT_SPRITE,
  'curve-r40': CURVE_SPRITE,
  'switch-left': switchSprite(-SWITCH_BRANCH_Y),
  'switch-right': switchSprite(SWITCH_BRANCH_Y),
};

export function getPieceSprite(pieceId: string): PieceSprite | null {
  return SPRITES[pieceId] ?? null;
}
