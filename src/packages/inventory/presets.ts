import type { InventoryPreset } from './types.ts';

export const INVENTORY_PRESETS: InventoryPreset[] = [
  {
    id: 'small',
    label: 'Small set',
    ranges: {
      'straight-16': { min: 2, max: 6 },
      'curve-r40': { min: 16, max: 16 },
      'switch-left': { min: 0, max: 0 },
      'switch-right': { min: 0, max: 0 },
    },
  },
  {
    id: 'medium',
    label: 'Medium set',
    ranges: {
      'straight-16': { min: 8, max: 16 },
      'curve-r40': { min: 16, max: 24 },
      'switch-left': { min: 0, max: 1 },
      'switch-right': { min: 0, max: 1 },
    },
  },
  {
    id: 'large',
    label: 'Large set',
    ranges: {
      'straight-16': { min: 16, max: 32 },
      'curve-r40': { min: 24, max: 48 },
      'switch-left': { min: 1, max: 3 },
      'switch-right': { min: 1, max: 3 },
    },
  },
];

const presetById = new Map(INVENTORY_PRESETS.map((preset) => [preset.id, preset]));

export function getInventoryPreset(id: InventoryPreset['id']): InventoryPreset {
  const preset = presetById.get(id);
  if (!preset) {
    throw new Error(`Unknown inventory preset: ${id}`);
  }
  return preset;
}
