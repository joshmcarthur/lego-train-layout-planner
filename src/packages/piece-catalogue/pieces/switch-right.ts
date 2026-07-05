import { ALL_HEADINGS } from '../types.ts';
import {
  buildSwitchOutline,
  SWITCH_BRANCH_X,
  SWITCH_BRANCH_Y,
} from '../geometry.ts';
import type { PieceDefinition } from '../types.ts';

export const SWITCH_RIGHT: PieceDefinition = {
  id: 'switch-right',
  name: 'Switch Point Right',
  category: 'switch-right',
  inventoryKey: 'switch-right',
  outline: buildSwitchOutline(true),
  ports: [
    { id: 'a', localPosition: { x: 0, y: 0 }, facing: 8, connector: 'rail' },
    { id: 'b', localPosition: { x: 32, y: 0 }, facing: 0, connector: 'rail' },
    {
      id: 'c',
      localPosition: { x: SWITCH_BRANCH_X, y: SWITCH_BRANCH_Y },
      facing: 1,
      connector: 'rail',
    },
  ],
  allowedRotations: [...ALL_HEADINGS],
};
