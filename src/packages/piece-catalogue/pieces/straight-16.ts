import { ALL_HEADINGS } from '../types.ts';
import type { PieceDefinition } from '../types.ts';

export const STRAIGHT_16: PieceDefinition = {
  id: 'straight-16',
  name: 'Straight Track 16',
  category: 'straight',
  inventoryKey: 'straight-16',
  outline: [
    { x: 0, y: -4 },
    { x: 16, y: -4 },
    { x: 16, y: 4 },
    { x: 0, y: 4 },
  ],
  ports: [
    { id: 'a', localPosition: { x: 0, y: 0 }, facing: 8, connector: 'rail' },
    { id: 'b', localPosition: { x: 16, y: 0 }, facing: 0, connector: 'rail' },
  ],
  allowedRotations: [...ALL_HEADINGS],
};
