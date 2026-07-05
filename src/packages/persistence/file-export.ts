import { migrateSerializedState } from './migrate.ts';
import type { SerializedAppState } from './types.ts';
import { parseSerializedAppState } from './validate.ts';

export function exportJsonFile(state: SerializedAppState, filename: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importJsonFile(file: File): Promise<SerializedAppState | null> {
  const text = await file.text();
  const parsed = parseSerializedAppState(text);
  if (!parsed) {
    return null;
  }
  const migrated = migrateSerializedState(parsed);
  return migrated?.state ?? null;
}

export function copyJsonToClipboard(state: SerializedAppState): Promise<void> {
  const text = JSON.stringify(state, null, 2);
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard unavailable'));
}
