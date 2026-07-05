import type { Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';

export const SERIALIZED_SCHEMA_VERSION = 1 as const;
export const MAX_PLACEMENTS = 500;
export const URL_LENGTH_LIMIT = 1800;
export const MAX_COMPRESSED_PAYLOAD_LENGTH = 50_000;

export interface SerializedAppState {
  schemaVersion: typeof SERIALIZED_SCHEMA_VERSION;
  catalogueVersion: number;
  inventory?: Inventory;
  layout: Layout;
  meta?: { name?: string; createdAt?: string };
}

export interface SavedLayoutIndex {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string;
}

export type SaveLayoutResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'quota' };
