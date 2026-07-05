import { migrateSerializedState } from './migrate.ts';
import {
  type SaveLayoutResult,
  type SavedLayoutIndex,
  type SerializedAppState,
} from './types.ts';

export const LAYOUTS_INDEX_KEY = 'lego-train-planner/layouts';
export const AUTOSAVE_KEY = 'lego-train-planner/autosave';

export function layoutBlobKey(id: string): string {
  return `lego-train-planner/layout/${id}`;
}

function getLocalStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

function readIndex(storage: Storage): SavedLayoutIndex[] {
  const raw = storage.getItem(LAYOUTS_INDEX_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is SavedLayoutIndex =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as SavedLayoutIndex).id === 'string' &&
        typeof (entry as SavedLayoutIndex).name === 'string' &&
        typeof (entry as SavedLayoutIndex).updatedAt === 'string',
    );
  } catch {
    return [];
  }
}

function writeIndex(storage: Storage, index: SavedLayoutIndex[]): SaveLayoutResult {
  try {
    storage.setItem(LAYOUTS_INDEX_KEY, JSON.stringify(index));
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}

function writeBlob(storage: Storage, key: string, state: SerializedAppState): SaveLayoutResult {
  try {
    storage.setItem(key, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}

export function listLayouts(): SavedLayoutIndex[] {
  const storage = getLocalStorage();
  if (!storage) {
    return [];
  }
  return readIndex(storage);
}

export function loadLayout(id: string): SerializedAppState | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(layoutBlobKey(id));
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateSerializedState(parsed);
    return migrated?.state ?? null;
  } catch {
    return null;
  }
}

export function saveLayout(index: SavedLayoutIndex, state: SerializedAppState): SaveLayoutResult {
  const storage = getLocalStorage();
  if (!storage) {
    return { ok: false, reason: 'unavailable' };
  }

  const blobResult = writeBlob(storage, layoutBlobKey(index.id), state);
  if (!blobResult.ok) {
    return blobResult;
  }

  const entries = readIndex(storage);
  const existing = entries.findIndex((entry) => entry.id === index.id);
  const nextEntry: SavedLayoutIndex = { ...index };

  if (existing === -1) {
    entries.push(nextEntry);
  } else {
    entries[existing] = nextEntry;
  }

  entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return writeIndex(storage, entries);
}

export function deleteLayout(id: string): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(layoutBlobKey(id));
  const entries = readIndex(storage).filter((entry) => entry.id !== id);
  storage.setItem(LAYOUTS_INDEX_KEY, JSON.stringify(entries));
}

export function saveAutosave(state: SerializedAppState): SaveLayoutResult {
  const storage = getLocalStorage();
  if (!storage) {
    return { ok: false, reason: 'unavailable' };
  }
  return writeBlob(storage, AUTOSAVE_KEY, state);
}

export function loadAutosave(): SerializedAppState | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTOSAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateSerializedState(parsed);
    return migrated?.state ?? null;
  } catch {
    return null;
  }
}

export function hasAutosaveSession(): boolean {
  const autosave = loadAutosave();
  return (autosave?.layout.placements.length ?? 0) > 0;
}

export function clearAutosave(): void {
  const storage = getLocalStorage();
  storage?.removeItem(AUTOSAVE_KEY);
}
