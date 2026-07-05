import { ALL_HEADINGS } from '../types.ts';
import {
  buildCurveOutline,
  CURVE_EXIT_X,
  CURVE_EXIT_Y,
} from '../geometry.ts';
import type { PieceDefinition } from '../types.ts';

export const CURVE_R40: PieceDefinition = {
  id: 'curve-r40',
  name: 'Curved Track R40 22.5°',
  category: 'curve',
  inventoryKey: 'curve-r40',
  outline: buildCurveOutline(),
  ports: [
    { id: 'a', localPosition: { x: 0, y: 0 }, facing: 8, connector: 'rail' },
    {
      id: 'b',
      localPosition: { x: CURVE_EXIT_X, y: CURVE_EXIT_Y },
      facing: 1,
      connector: 'rail',
    },
  ],
  allowedRotations: [...ALL_HEADINGS],
  curveDelta: 1,
};
