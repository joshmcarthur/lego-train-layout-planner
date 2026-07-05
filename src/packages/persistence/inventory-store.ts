import {
  INVENTORY_SCHEMA_VERSION,
  isInventory,
  normalizeCounts,
  type Inventory,
} from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

export const INVENTORY_STORAGE_KEY = 'lego-train-planner/inventory';

export type SaveInventoryResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'quota' };

function getLocalStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

export function loadInventory(): Inventory | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(INVENTORY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isInventory(parsed)) {
      return null;
    }

    return {
      schemaVersion: INVENTORY_SCHEMA_VERSION,
      counts: normalizeCounts(parsed.counts, CATALOGUE_V1),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveInventory(inventory: Inventory): SaveInventoryResult {
  const storage = getLocalStorage();
  if (!storage) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    storage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}

export function clearInventory(): void {
  const storage = getLocalStorage();
  storage?.removeItem(INVENTORY_STORAGE_KEY);
}
