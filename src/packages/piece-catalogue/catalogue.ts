import { MVP_PIECES } from './pieces/index.ts';
import type { PieceCatalogue, PieceDefinition } from './types.ts';

export const CATALOGUE_VERSION = 1;

function validatePieces(pieces: PieceDefinition[]): void {
  const ids = new Set<string>();
  const inventoryKeys = new Set<string>();

  for (const piece of pieces) {
    if (ids.has(piece.id)) {
      throw new Error(`Duplicate piece id: ${piece.id}`);
    }
    ids.add(piece.id);

    if (inventoryKeys.has(piece.inventoryKey)) {
      throw new Error(`Duplicate inventory key: ${piece.inventoryKey}`);
    }
    inventoryKeys.add(piece.inventoryKey);

    const anchor = piece.ports[0];
    if (anchor.localPosition.x !== 0 || anchor.localPosition.y !== 0) {
      throw new Error(`Piece ${piece.id}: ports[0] must be at origin`);
    }
  }
}

validatePieces(MVP_PIECES);

const byId = new Map(MVP_PIECES.map((piece) => [piece.id, piece]));
const byInventoryKey = new Map(MVP_PIECES.map((piece) => [piece.inventoryKey, piece]));

export const CATALOGUE_V1: PieceCatalogue = {
  version: CATALOGUE_VERSION,
  pieces: MVP_PIECES,
  getById(id: string): PieceDefinition | undefined {
    return byId.get(id);
  },
  getByInventoryKey(key: string): PieceDefinition | undefined {
    return byInventoryKey.get(key);
  },
  all(): PieceDefinition[] {
    return [...MVP_PIECES];
  },
};
