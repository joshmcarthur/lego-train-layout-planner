export const INVENTORY_SCHEMA_VERSION = 1 as const;
export const MAX_PIECE_COUNT = 999;
export const MIN_PIECE_COUNT = 0;

export interface Inventory {
  schemaVersion: typeof INVENTORY_SCHEMA_VERSION;
  counts: Record<string, number>;
  updatedAt: string;
}

export type InventoryPresetId = 'small' | 'medium' | 'large';

export interface InventoryPresetRange {
  min: number;
  max: number;
}

export interface InventoryPreset {
  id: InventoryPresetId;
  label: string;
  ranges: Record<string, InventoryPresetRange>;
}

export type ValidateCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };
