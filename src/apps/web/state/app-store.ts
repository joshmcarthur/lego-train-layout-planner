import { LAYOUT_SCHEMA_VERSION, type Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import { saveInventory, type SaveInventoryResult } from '@track-layout/persistence';

export interface AppState {
  inventory: Inventory | null;
  layout: Layout;
}

type Listener = (state: AppState) => void;

const emptyLayout = (): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  catalogueVersion: CATALOGUE_VERSION,
  placements: [],
});

let state: AppState = {
  inventory: null,
  layout: emptyLayout(),
};

const listeners = new Set<Listener>();
let initialized = false;

function notify(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function initAppStore(load: () => Inventory | null): void {
  if (initialized) {
    return;
  }
  initialized = true;

  const inventory = load();
  if (inventory) {
    state = { ...state, inventory };
    notify();
  }
}

export function setInventory(inventory: Inventory): SaveInventoryResult {
  const result = saveInventory(inventory);
  state = { ...state, inventory };
  notify();
  return result;
}

export function setLayout(layout: Layout): void {
  state = { ...state, layout };
  notify();
}

export function hasLayoutInProgress(): boolean {
  return state.layout.placements.length > 0;
}

export function resetAppStoreForTests(): void {
  initialized = false;
  state = {
    inventory: null,
    layout: emptyLayout(),
  };
  listeners.clear();
}
