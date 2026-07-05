import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInventory } from '@track-layout/inventory';
import {
  AUTOSAVE_KEY,
  clearAutosave,
  deleteLayout,
  layoutBlobKey,
  listLayouts,
  loadAutosave,
  loadLayout,
  LAYOUTS_INDEX_KEY,
  saveAutosave,
  saveLayout,
  type SerializedAppState,
} from '@track-layout/persistence';
import { CATALOGUE_V1, CATALOGUE_VERSION } from '@track-layout/piece-catalogue';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(
  readFileSync(join(__dirname, '../../fixtures/serialized/v1-minimal.json'), 'utf8'),
) as SerializedAppState;

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

describe('layout-store', () => {
  let memory: MemoryStorage;

  beforeEach(() => {
    memory = new MemoryStorage();
    vi.stubGlobal('localStorage', memory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves, lists, loads, and deletes layouts', () => {
    const index = {
      id: 'layout-1',
      name: 'Test layout',
      updatedAt: '2026-07-05T12:00:00.000Z',
    };

    expect(saveLayout(index, golden)).toEqual({ ok: true });
    expect(listLayouts()).toEqual([index]);
    expect(loadLayout('layout-1')).toEqual(golden);

    deleteLayout('layout-1');
    expect(listLayouts()).toEqual([]);
    expect(memory.getItem(layoutBlobKey('layout-1'))).toBeNull();
  });

  it('round-trips autosave', () => {
    expect(saveAutosave(golden)).toEqual({ ok: true });
    expect(loadAutosave()).toEqual(golden);
    clearAutosave();
    expect(loadAutosave()).toBeNull();
    expect(memory.getItem(AUTOSAVE_KEY)).toBeNull();
  });

  it('reports quota errors', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
      getItem: () => null,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    });

    const index = { id: 'x', name: 'x', updatedAt: '2026-07-05T00:00:00.000Z' };
    expect(saveLayout(index, golden)).toEqual({ ok: false, reason: 'quota' });
  });

  it('updates existing index entry on save', () => {
    const index = { id: 'layout-1', name: 'First', updatedAt: '2026-07-05T10:00:00.000Z' };
    saveLayout(index, golden);

    const updated = { id: 'layout-1', name: 'Renamed', updatedAt: '2026-07-05T11:00:00.000Z' };
    saveLayout(updated, golden);
    expect(listLayouts()).toEqual([updated]);
    expect(JSON.parse(memory.getItem(LAYOUTS_INDEX_KEY)!)).toEqual([updated]);
  });
});

describe('migrate', () => {
  it('passes through valid v1 state', async () => {
    const { migrateSerializedState } = await import('@track-layout/persistence');
    const result = migrateSerializedState(golden);
    expect(result?.state).toEqual(golden);
    expect(result?.catalogueMismatch).toBe(false);
  });

  it('rejects invalid schema', async () => {
    const { migrateSerializedState } = await import('@track-layout/persistence');
    expect(migrateSerializedState({ schemaVersion: 99 })).toBeNull();
  });
});

describe('file-export validation', () => {
  it('rejects layouts over placement cap on import parse', async () => {
    const { parseSerializedAppState } = await import('@track-layout/persistence');
    const inventory = createInventory({ 'straight-16': 600 }, CATALOGUE_V1);
    const placements = Array.from({ length: 501 }, (_, i) => ({
      instanceId: `p-${i}`,
      pieceId: 'straight-16',
      x: i,
      y: 0,
      rotation: 0,
    }));

    const raw = JSON.stringify({
      schemaVersion: 1,
      catalogueVersion: CATALOGUE_VERSION,
      inventory,
      layout: { schemaVersion: 1, catalogueVersion: CATALOGUE_VERSION, placements },
    });

    expect(parseSerializedAppState(raw)).toBeNull();
  });
});
