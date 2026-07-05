import { ALL_HEADINGS } from '../types.ts';
import {
  buildSwitchOutline,
  SWITCH_BRANCH_X,
  SWITCH_BRANCH_Y,
} from '../geometry.ts';
import type { PieceDefinition } from '../types.ts';

export const SWITCH_LEFT: PieceDefinition = {
  id: 'switch-left',
  name: 'Switch Point Left',
  category: 'switch-left',
  inventoryKey: 'switch-left',
  outline: buildSwitchOutline(false),
  ports: [
    { id: 'a', localPosition: { x: 0, y: 0 }, facing: 8, connector: 'rail' },
    { id: 'b', localPosition: { x: 32, y: 0 }, facing: 0, connector: 'rail' },
    {
      id: 'c',
      localPosition: { x: SWITCH_BRANCH_X, y: -SWITCH_BRANCH_Y },
      facing: 15,
      connector: 'rail',
    },
  ],
  allowedRotations: [...ALL_HEADINGS],
};
