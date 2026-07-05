import { describe, expect, it } from 'vitest';

import { validateLayout } from '@track-layout/connection-engine';
import { createInventory } from '@track-layout/inventory';
import { CATALOGUE_V1, type Heading } from '@track-layout/piece-catalogue';

import {
  createEditorState,
  editorReducer,
  HISTORY_CAP,
  previewPlacement,
} from '../../../src/apps/web/state/editor-reducer.ts';
import { resolvePlacement } from '../../../src/apps/web/state/snap-placement.ts';

function makeInventory(counts: Record<string, number>) {
  return createInventory(
    {
      'straight-16': 0,
      'curve-r40': 0,
      'switch-left': 0,
      'switch-right': 0,
      ...counts,
    },
    CATALOGUE_V1,
  );
}

describe('editorReducer', () => {
  it('places a valid piece and records history', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    expect(state.layout.placements).toHaveLength(1);
    expect(state.layout.placements[0]?.pieceId).toBe('straight-16');
    expect(state.history.past).toHaveLength(1);
    expect(state.history.future).toHaveLength(0);
  });

  it('rejects overlapping placement without changing history', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    const afterFirst = state;

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    expect(state.layout.placements).toHaveLength(1);
    expect(state.history.past).toHaveLength(afterFirst.history.past.length);
  });

  it('blocks placement when inventory is exhausted', () => {
    const inventory = makeInventory({ 'straight-16': 0 });
    let state = createEditorState(inventory);

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    expect(state.layout.placements).toHaveLength(0);
    expect(state.history.past).toHaveLength(0);
  });

  it('removes a piece and records history', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);
    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    const instanceId = state.layout.placements[0]!.instanceId;

    state = editorReducer(state, { type: 'REMOVE', instanceId });
    expect(state.layout.placements).toHaveLength(0);
    expect(state.history.past).toHaveLength(2);
  });

  it('undo and redo restore layout', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);
    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    state = editorReducer(state, { type: 'PLACE', x: 32, y: 0 });

    expect(state.layout.placements).toHaveLength(2);

    state = editorReducer(state, { type: 'UNDO' });
    expect(state.layout.placements).toHaveLength(1);

    state = editorReducer(state, { type: 'REDO' });
    expect(state.layout.placements).toHaveLength(2);
  });

  it('caps history at HISTORY_CAP entries', () => {
    const inventory = makeInventory({ 'straight-16': 100 });
    let state = createEditorState(inventory);

    for (let i = 0; i < HISTORY_CAP + 5; i++) {
      state = editorReducer(state, { type: 'PLACE', x: i * 32, y: 0 });
    }

    expect(state.history.past.length).toBeLessThanOrEqual(HISTORY_CAP);
    expect(state.layout.placements.length).toBe(HISTORY_CAP + 5);
  }, 30_000);

  it('cycles rotation through allowedRotations', () => {
    const inventory = makeInventory({ 'straight-16': 1 });
    let state = createEditorState(inventory);
    const initial = state.selectedRotation;

    state = editorReducer(state, { type: 'ROTATE_CW' });
    expect(state.selectedRotation).not.toBe(initial);

    for (let i = 0; i < 15; i++) {
      state = editorReducer(state, { type: 'ROTATE_CW' });
    }
    expect(state.selectedRotation).toBe(initial);
  });

  it('does not mutate inventory counts on place or remove', () => {
    const inventory = makeInventory({ 'straight-16': 2 });
    let state = createEditorState(inventory);
    const originalCount = state.inventory.counts['straight-16'];

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    expect(state.inventory.counts['straight-16']).toBe(originalCount);

    const instanceId = state.layout.placements[0]!.instanceId;
    state = editorReducer(state, { type: 'REMOVE', instanceId });
    expect(state.inventory.counts['straight-16']).toBe(originalCount);
  });
});

describe('previewPlacement', () => {
  it('reports invalid preview for overlap', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);
    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });

    const preview = previewPlacement(state, 0, 0);
    expect(preview).not.toBeNull();
    expect(preview!.valid).toBe(false);
  });
});

describe('resolvePlacement', () => {
  it('snaps to integer grid on empty layout', () => {
    const layout = {
      schemaVersion: 1,
      catalogueVersion: CATALOGUE_V1.version,
      placements: [],
    };

    const result = resolvePlacement(3.7, 5.2, 'straight-16', 0, layout, CATALOGUE_V1);
    expect(result).toEqual({
      pieceId: 'straight-16',
      x: 4,
      y: 5,
      rotation: 0,
    });
  });

  it('port-snaps second straight to first', () => {
    const layout = {
      schemaVersion: 1,
      catalogueVersion: CATALOGUE_V1.version,
      placements: [
        {
          instanceId: 's1',
          pieceId: 'straight-16',
          x: 0,
          y: 0,
          rotation: 0 as Heading,
        },
      ],
    };

    const result = resolvePlacement(17, 0, 'straight-16', 0, layout, CATALOGUE_V1);
    expect(result).toEqual({
      pieceId: 'straight-16',
      x: 16,
      y: 0,
      rotation: 0,
    });
  });
});

describe('two-straights-valid fixture via editor actions', () => {
  it('matches fixture validation after placing two straights', () => {
    const inventory = makeInventory({ 'straight-16': 5 });
    let state = createEditorState(inventory);

    state = editorReducer(state, { type: 'PLACE', x: 0, y: 0 });
    state = editorReducer(state, { type: 'PLACE', x: 17, y: 0 });

    const result = validateLayout(state.layout, CATALOGUE_V1);
    expect(result.valid).toBe(true);
    expect(state.layout.placements).toHaveLength(2);
    expect(state.layout.placements[1]?.x).toBe(16);
  });
});
