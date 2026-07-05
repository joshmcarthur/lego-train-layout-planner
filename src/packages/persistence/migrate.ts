import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';

import { isSerializedAppState } from './validate.ts';
import type { SerializedAppState } from './types.ts';

export interface MigrateResult {
  state: SerializedAppState;
  catalogueMismatch: boolean;
}

export function migrateSerializedState(raw: unknown): MigrateResult | null {
  if (!isSerializedAppState(raw)) {
    return null;
  }

  const catalogueMismatch = raw.catalogueVersion !== CATALOGUE_VERSION;

  return {
    state: raw,
    catalogueMismatch,
  };
}
