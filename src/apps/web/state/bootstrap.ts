import { LAYOUT_SCHEMA_VERSION, type Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import {
  createSerializedAppState,
  decodeShareUrl,
  forkLayout,
  loadAutosave,
  loadInventory,
} from '@track-layout/persistence';

export interface BootstrapResult {
  layout: Layout;
  inventory: Inventory | null;
  storedInventory: Inventory | null;
  forkMode: boolean;
  forkSourceInventory?: Inventory;
  catalogueMismatch: boolean;
}

function emptyLayout(): Layout {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    catalogueVersion: CATALOGUE_VERSION,
    placements: [],
  };
}

function stripShareParam(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  let changed = false;

  if (url.searchParams.has('s')) {
    url.searchParams.delete('s');
    changed = true;
  }

  const hashBody = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hashBody) {
    const hashParams = new URLSearchParams(hashBody);
    if (hashParams.has('s')) {
      hashParams.delete('s');
      const nextHash = hashParams.toString();
      url.hash = nextHash ? `#${nextHash}` : '';
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, '', url.toString());
  }
}

export function bootstrapEditor(): BootstrapResult {
  const storedInventory = loadInventory();
  const shareInput = typeof window !== 'undefined' ? window.location.href : '';
  const shared = shareInput ? decodeShareUrl(shareInput) : null;

  if (shared) {
    stripShareParam();

    const forkedLayout = forkLayout(shared.layout);
    const forkSourceInventory = shared.inventory;
    const effectiveInventory = forkSourceInventory ?? storedInventory;

    return {
      layout: forkedLayout,
      inventory: effectiveInventory,
      storedInventory,
      forkMode: true,
      forkSourceInventory,
      catalogueMismatch: shared.catalogueVersion !== CATALOGUE_VERSION,
    };
  }

  const autosave = loadAutosave();
  const layout = autosave?.layout ?? emptyLayout();
  const catalogueMismatch = autosave
    ? autosave.catalogueVersion !== CATALOGUE_VERSION
    : false;

  return {
    layout,
    inventory: storedInventory,
    storedInventory,
    forkMode: false,
    catalogueMismatch,
  };
}

export function buildAutosaveState(
  layout: Layout,
  inventory: Inventory | null,
  meta?: { name?: string; createdAt?: string },
) {
  return createSerializedAppState(layout, {
    catalogueVersion: CATALOGUE_VERSION,
    inventory: inventory ?? undefined,
    meta,
  });
}
