import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInventory } from '@track-layout/inventory';
import {
  clearInventory,
  INVENTORY_STORAGE_KEY,
  loadInventory,
  saveInventory,
} from '@track-layout/persistence';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('inventory-store', () => {
  let memory: MemoryStorage;

  beforeEach(() => {
    memory = new MemoryStorage();
    vi.stubGlobal('localStorage', memory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when storage is empty', () => {
    expect(loadInventory()).toBeNull();
  });

  it('round-trips inventory through localStorage', () => {
    const inventory = createInventory(
      {
        'straight-16': 4,
        'curve-r40': 16,
        'switch-left': 0,
        'switch-right': 0,
      },
      CATALOGUE_V1,
    );

    expect(saveInventory(inventory)).toEqual({ ok: true });
    expect(loadInventory()).toEqual(inventory);
    expect(memory.getItem(INVENTORY_STORAGE_KEY)).not.toBeNull();
  });

  it('returns null for malformed JSON', () => {
    memory.setItem(INVENTORY_STORAGE_KEY, '{not-json');
    expect(loadInventory()).toBeNull();
  });

  it('returns null for invalid schema versions', () => {
    memory.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 99,
        counts: { 'straight-16': 1 },
        updatedAt: '2026-07-05T00:00:00.000Z',
      }),
    );
    expect(loadInventory()).toBeNull();
  });

  it('reports quota errors on save', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        const error = new DOMException('quota', 'QuotaExceededError');
        throw error;
      },
      getItem: () => null,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    });

    const inventory = createInventory({ 'straight-16': 1 }, CATALOGUE_V1);
    expect(saveInventory(inventory)).toEqual({ ok: false, reason: 'quota' });
  });

  it('clears stored inventory', () => {
    const inventory = createInventory({ 'straight-16': 1 }, CATALOGUE_V1);
    saveInventory(inventory);
    clearInventory();
    expect(loadInventory()).toBeNull();
  });
});
