export const PACKAGE_VERSION = '0.1.0';

export {
  clearInventory,
  INVENTORY_STORAGE_KEY,
  loadInventory,
  saveInventory,
} from './inventory-store.ts';
export type { SaveInventoryResult } from './inventory-store.ts';

export {
  AUTOSAVE_KEY,
  LAYOUTS_INDEX_KEY,
  clearAutosave,
  deleteLayout,
  hasAutosaveSession,
  layoutBlobKey,
  listLayouts,
  loadAutosave,
  loadLayout,
  saveAutosave,
  saveLayout,
} from './layout-store.ts';

export { forkLayout, duplicateSerializedLayout } from './fork.ts';

export {
  copyJsonToClipboard,
  exportJsonFile,
  importJsonFile,
} from './file-export.ts';

export { migrateSerializedState } from './migrate.ts';
export type { MigrateResult } from './migrate.ts';

export {
  createSerializedAppState,
  isSerializedAppState,
  parseSerializedAppState,
} from './validate.ts';

export {
  decodeSharePayload,
  decodeShareUrl,
  encodeShareUrl,
  extractSharePayload,
  serializeState,
} from './url-codec.ts';
export type { EncodeShareUrlResult } from './url-codec.ts';

export {
  MAX_COMPRESSED_PAYLOAD_LENGTH,
  MAX_PLACEMENTS,
  SERIALIZED_SCHEMA_VERSION,
  URL_LENGTH_LIMIT,
} from './types.ts';
export type {
  SaveLayoutResult,
  SavedLayoutIndex,
  SerializedAppState,
} from './types.ts';
