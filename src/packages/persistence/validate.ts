import { LAYOUT_SCHEMA_VERSION, type Layout } from '@track-layout/connection-engine';
import {
  INVENTORY_SCHEMA_VERSION,
  isInventory,
  type Inventory,
} from '@track-layout/inventory';

import {
  MAX_PLACEMENTS,
  SERIALIZED_SCHEMA_VERSION,
  type SerializedAppState,
} from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlacement(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.instanceId === 'string' &&
    typeof value.pieceId === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.rotation === 'number'
  );
}

function isLayout(value: unknown): value is Layout {
  if (!isRecord(value)) {
    return false;
  }
  if (value.schemaVersion !== LAYOUT_SCHEMA_VERSION) {
    return false;
  }
  if (typeof value.catalogueVersion !== 'number') {
    return false;
  }
  if (!Array.isArray(value.placements)) {
    return false;
  }
  if (value.placements.length > MAX_PLACEMENTS) {
    return false;
  }
  return value.placements.every(isPlacement);
}

function isMeta(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (value.name !== undefined && typeof value.name !== 'string') {
    return false;
  }
  if (value.createdAt !== undefined && typeof value.createdAt !== 'string') {
    return false;
  }
  return true;
}

export function isSerializedAppState(value: unknown): value is SerializedAppState {
  if (!isRecord(value)) {
    return false;
  }
  if (value.schemaVersion !== SERIALIZED_SCHEMA_VERSION) {
    return false;
  }
  if (typeof value.catalogueVersion !== 'number') {
    return false;
  }
  if (value.inventory !== undefined && !isInventory(value.inventory)) {
    return false;
  }
  if (!isLayout(value.layout)) {
    return false;
  }
  if (value.meta !== undefined && !isMeta(value.meta)) {
    return false;
  }
  return true;
}

export function parseSerializedAppState(raw: string): SerializedAppState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSerializedAppState(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createSerializedAppState(
  layout: Layout,
  options: {
    catalogueVersion: number;
    inventory?: Inventory;
    meta?: SerializedAppState['meta'];
  },
): SerializedAppState {
  const state: SerializedAppState = {
    schemaVersion: SERIALIZED_SCHEMA_VERSION,
    catalogueVersion: options.catalogueVersion,
    layout,
  };

  if (options.inventory) {
    state.inventory = {
      schemaVersion: INVENTORY_SCHEMA_VERSION,
      counts: { ...options.inventory.counts },
      updatedAt: options.inventory.updatedAt,
    };
  }

  if (options.meta) {
    state.meta = { ...options.meta };
  }

  return state;
}
