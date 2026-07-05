import {
  canPlace,
  LAYOUT_SCHEMA_VERSION,
  type Layout,
  type Placement,
} from '@track-layout/connection-engine';
import { canUsePiece, type Inventory } from '@track-layout/inventory';
import {
  CATALOGUE_V1,
  CATALOGUE_VERSION,
  type Heading,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

import { resolvePlacement } from './snap-placement.ts';

export const HISTORY_CAP = 50;

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface EditorState {
  layout: Layout;
  inventory: Inventory;
  selectedPieceId: string | null;
  selectedRotation: Heading;
  selectedInstanceId: string | null;
  viewport: Viewport;
  history: { past: Layout[]; future: Layout[] };
}

export type EditorAction =
  | { type: 'SELECT_PIECE'; pieceId: string }
  | { type: 'ROTATE_CW' }
  | { type: 'SELECT_INSTANCE'; instanceId: string | null }
  | { type: 'PLACE'; x: number; y: number }
  | { type: 'REMOVE'; instanceId: string }
  | { type: 'SET_VIEWPORT'; viewport: Partial<Viewport> }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;

function emptyLayout(): Layout {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    catalogueVersion: CATALOGUE_VERSION,
    placements: [],
  };
}

function cloneLayout(layout: Layout): Layout {
  return {
    ...layout,
    placements: layout.placements.map((p) => ({ ...p })),
  };
}

function pushHistory(state: EditorState): EditorState['history'] {
  const past = [...state.history.past, cloneLayout(state.layout)];
  if (past.length > HISTORY_CAP) {
    past.shift();
  }
  return { past, future: [] };
}

function firstAllowedRotation(pieceId: string, catalogue: PieceCatalogue): Heading {
  const piece = catalogue.getById(pieceId);
  if (!piece || piece.allowedRotations.length === 0) {
    return 0;
  }
  return piece.allowedRotations[0]!;
}

function nextRotation(
  pieceId: string,
  current: Heading,
  catalogue: PieceCatalogue,
): Heading {
  const piece = catalogue.getById(pieceId);
  if (!piece || piece.allowedRotations.length === 0) {
    return current;
  }
  const rotations = piece.allowedRotations;
  const index = rotations.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % rotations.length;
  return rotations[nextIndex]!;
}

function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function createEditorState(
  inventory: Inventory,
  layout?: Layout,
  catalogue: PieceCatalogue = CATALOGUE_V1,
): EditorState {
  const firstPiece = catalogue.all()[0];
  return {
    layout: layout ? cloneLayout(layout) : emptyLayout(),
    inventory,
    selectedPieceId: firstPiece?.id ?? null,
    selectedRotation: firstPiece ? firstAllowedRotation(firstPiece.id, catalogue) : 0,
    selectedInstanceId: null,
    viewport: { panX: 48, panY: 48, zoom: 6 },
    history: { past: [], future: [] },
  };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
  catalogue: PieceCatalogue = CATALOGUE_V1,
): EditorState {
  switch (action.type) {
    case 'SELECT_PIECE': {
      if (!catalogue.getById(action.pieceId)) {
        return state;
      }
      return {
        ...state,
        selectedPieceId: action.pieceId,
        selectedRotation: firstAllowedRotation(action.pieceId, catalogue),
        selectedInstanceId: null,
      };
    }

    case 'ROTATE_CW': {
      if (!state.selectedPieceId) {
        return state;
      }
      return {
        ...state,
        selectedRotation: nextRotation(
          state.selectedPieceId,
          state.selectedRotation,
          catalogue,
        ),
      };
    }

    case 'SELECT_INSTANCE': {
      return {
        ...state,
        selectedInstanceId: action.instanceId,
      };
    }

    case 'PLACE': {
      if (!state.selectedPieceId) {
        return state;
      }

      const resolved = resolvePlacement(
        action.x,
        action.y,
        state.selectedPieceId,
        state.selectedRotation,
        state.layout,
        catalogue,
      );
      if (!resolved) {
        return state;
      }

      if (!canUsePiece(state.inventory, resolved.pieceId, state.layout, catalogue)) {
        return state;
      }

      const candidate: Placement = {
        ...resolved,
        instanceId: '__candidate__',
      };

      const validation = canPlace(state.layout, candidate, catalogue);
      if (!validation.valid) {
        return state;
      }

      const instanceId = crypto.randomUUID();
      const placement: Placement = { ...resolved, instanceId };
      const layout: Layout = {
        ...state.layout,
        placements: [...state.layout.placements, placement],
      };

      return {
        ...state,
        layout,
        history: pushHistory(state),
        selectedInstanceId: instanceId,
      };
    }

    case 'REMOVE': {
      const exists = state.layout.placements.some((p) => p.instanceId === action.instanceId);
      if (!exists) {
        return state;
      }

      const layout: Layout = {
        ...state.layout,
        placements: state.layout.placements.filter((p) => p.instanceId !== action.instanceId),
      };

      return {
        ...state,
        layout,
        history: pushHistory(state),
        selectedInstanceId:
          state.selectedInstanceId === action.instanceId ? null : state.selectedInstanceId,
      };
    }

    case 'SET_VIEWPORT': {
      const viewport: Viewport = {
        panX: action.viewport.panX ?? state.viewport.panX,
        panY: action.viewport.panY ?? state.viewport.panY,
        zoom: clampZoom(action.viewport.zoom ?? state.viewport.zoom),
      };
      return { ...state, viewport };
    }

    case 'UNDO': {
      if (state.history.past.length === 0) {
        return state;
      }
      const past = [...state.history.past];
      const previous = past.pop()!;
      return {
        ...state,
        layout: previous,
        history: {
          past,
          future: [cloneLayout(state.layout), ...state.history.future],
        },
        selectedInstanceId: null,
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) {
        return state;
      }
      const future = [...state.history.future];
      const next = future.shift()!;
      return {
        ...state,
        layout: next,
        history: {
          past: [...state.history.past, cloneLayout(state.layout)],
          future,
        },
        selectedInstanceId: null,
      };
    }

    default: {
      const exhaustive: never = action;
      throw new Error(`Unhandled editor action: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function previewPlacement(
  state: EditorState,
  studX: number,
  studY: number,
  catalogue: PieceCatalogue = CATALOGUE_V1,
): { placement: Placement; valid: boolean } | null {
  if (!state.selectedPieceId) {
    return null;
  }

  const resolved = resolvePlacement(
    studX,
    studY,
    state.selectedPieceId,
    state.selectedRotation,
    state.layout,
    catalogue,
  );
  if (!resolved) {
    return null;
  }

  const placement: Placement = { ...resolved, instanceId: '__ghost__' };
  const inventoryOk = canUsePiece(state.inventory, resolved.pieceId, state.layout, catalogue);
  const validation = canPlace(state.layout, placement, catalogue);

  return {
    placement,
    valid: inventoryOk && validation.valid,
  };
}
