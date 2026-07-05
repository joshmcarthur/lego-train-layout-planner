import { LAYOUT_SCHEMA_VERSION, type Layout } from '@track-layout/connection-engine';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';

export function forkLayout(layout: Layout): Layout {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    catalogueVersion: CATALOGUE_VERSION,
    placements: layout.placements.map((placement) => ({
      ...placement,
      instanceId: crypto.randomUUID(),
    })),
  };
}

export function duplicateSerializedLayout<T extends { layout: Layout }>(state: T): T {
  return {
    ...state,
    layout: forkLayout(state.layout),
  };
}
