import { LAYOUT_SCHEMA_VERSION, type Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import { saveAutosave, saveInventory, type SaveInventoryResult } from '@track-layout/persistence';

import { buildAutosaveState, type BootstrapResult } from './bootstrap.ts';

export interface AppState {
  inventory: Inventory | null;
  storedInventory: Inventory | null;
  layout: Layout;
  forkMode: boolean;
  forkSourceInventory?: Inventory;
  catalogueMismatch: boolean;
}

type Listener = (state: AppState) => void;

const AUTOSAVE_DEBOUNCE_MS = 1000;

const emptyLayout = (): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  catalogueVersion: CATALOGUE_VERSION,
  placements: [],
});

let state: AppState = {
  inventory: null,
  storedInventory: null,
  layout: emptyLayout(),
  forkMode: false,
  catalogueMismatch: false,
};

const listeners = new Set<Listener>();
let initialized = false;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let sessionEpoch = 0;

function notify(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

function scheduleAutosave(): void {
  if (state.forkMode || !state.storedInventory) {
    return;
  }

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    if (!state.storedInventory) {
      return;
    }
    saveAutosave(buildAutosaveState(state.layout, state.storedInventory));
  }, AUTOSAVE_DEBOUNCE_MS);
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

export function getSessionEpoch(): number {
  return sessionEpoch;
}

export function initAppStoreFromInventory(load: () => Inventory | null): void {
  if (initialized) {
    return;
  }
  const inventory = load();
  initAppStore({
    layout: emptyLayout(),
    inventory,
    storedInventory: inventory,
    forkMode: false,
    catalogueMismatch: false,
  });
}

export function initAppStore(bootstrap: BootstrapResult): void {
  if (initialized) {
    return;
  }
  initialized = true;
  sessionEpoch += 1;

  state = {
    inventory: bootstrap.inventory,
    storedInventory: bootstrap.storedInventory,
    layout: bootstrap.layout,
    forkMode: bootstrap.forkMode,
    forkSourceInventory: bootstrap.forkSourceInventory,
    catalogueMismatch: bootstrap.catalogueMismatch,
  };
  notify();
}

export function setInventory(inventory: Inventory): SaveInventoryResult {
  const result = saveInventory(inventory);
  state = {
    ...state,
    inventory,
    storedInventory: inventory,
  };
  notify();
  scheduleAutosave();
  return result;
}

export function setLayout(layout: Layout): void {
  state = { ...state, layout };
  notify();
  scheduleAutosave();
}

export function loadEditorSession(
  layout: Layout,
  options: { forkMode?: boolean; catalogueMismatch?: boolean } = {},
): void {
  sessionEpoch += 1;
  state = {
    ...state,
    layout,
    forkMode: options.forkMode ?? false,
    forkSourceInventory: undefined,
    catalogueMismatch: options.catalogueMismatch ?? state.catalogueMismatch,
    inventory: state.storedInventory,
  };
  notify();
  scheduleAutosave();
}

export function clearForkMode(): void {
  if (!state.forkMode) {
    return;
  }
  sessionEpoch += 1;
  state = {
    ...state,
    forkMode: false,
    forkSourceInventory: undefined,
    inventory: state.storedInventory,
    catalogueMismatch: false,
  };
  notify();
  scheduleAutosave();
}

export function adoptForkInventory(): void {
  if (!state.forkSourceInventory) {
    return;
  }
  const result = saveInventory(state.forkSourceInventory);
  if (result.ok) {
    sessionEpoch += 1;
    state = {
      ...state,
      inventory: state.forkSourceInventory,
      storedInventory: state.forkSourceInventory,
      forkMode: false,
      forkSourceInventory: undefined,
    };
    notify();
    scheduleAutosave();
  }
}

export function hasLayoutInProgress(): boolean {
  return state.layout.placements.length > 0;
}

export function resetAppStoreForTests(): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  initialized = false;
  sessionEpoch = 0;
  state = {
    inventory: null,
    storedInventory: null,
    layout: emptyLayout(),
    forkMode: false,
    catalogueMismatch: false,
  };
  listeners.clear();
}
