export const PACKAGE_VERSION = '0.1.0';

export { INVENTORY_PRESETS, getInventoryPreset } from './presets.ts';
export { randomInRange, randomInventory } from './random.ts';
export {
  canUsePiece,
  getRemainingCounts,
  subtractForPlacement,
} from './remaining.ts';
export {
  INVENTORY_SCHEMA_VERSION,
  MAX_PIECE_COUNT,
  MIN_PIECE_COUNT,
} from './types.ts';
export type {
  Inventory,
  InventoryPreset,
  InventoryPresetId,
  InventoryPresetRange,
  ValidateCountResult,
} from './types.ts';
export {
  createEmptyInventory,
  createInventory,
  isInventory,
  normalizeCounts,
  totalPieceCount,
  validateCount,
} from './validate.ts';
