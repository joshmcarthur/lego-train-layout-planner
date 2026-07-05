import { CURVE_R40 } from './curve-r40.ts';
import { STRAIGHT_16 } from './straight-16.ts';
import { SWITCH_LEFT } from './switch-left.ts';
import { SWITCH_RIGHT } from './switch-right.ts';
import type { PieceDefinition } from '../types.ts';

export const MVP_PIECES: PieceDefinition[] = [
  STRAIGHT_16,
  CURVE_R40,
  SWITCH_LEFT,
  SWITCH_RIGHT,
];

export { CURVE_R40 } from './curve-r40.ts';
export { STRAIGHT_16 } from './straight-16.ts';
export { SWITCH_LEFT } from './switch-left.ts';
export { SWITCH_RIGHT } from './switch-right.ts';
