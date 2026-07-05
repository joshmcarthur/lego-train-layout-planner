import {
  canPlace,
  LAYOUT_SCHEMA_VERSION,
  validateLayout,
  type Layout,
  type Placement,
  type WorldPort,
} from '@track-layout/connection-engine';
import { getRemainingCounts } from '@track-layout/inventory';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_V1, type PieceCatalogue } from '@track-layout/piece-catalogue';

import { enumerateAttachments } from './attach.ts';
import { isDuplicate } from './dedupe.ts';
import { getOpenPorts, sortFrontier } from './frontier.ts';
import { sortCandidates } from './scoring.ts';
import {
  defaultGeneratorOptions,
  type GeneratorOptions,
  type GeneratorProgress,
  type GeneratorResult,
} from './types.ts';

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function totalPieceCount(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function pickSeedPieceId(
  inventory: Inventory,
  catalogue: PieceCatalogue,
): string | null {
  const counts = inventory.counts;

  if ((counts['straight-16'] ?? 0) > 0) {
    return catalogue.getByInventoryKey('straight-16')?.id ?? null;
  }

  if ((counts['curve-r40'] ?? 0) > 0) {
    return catalogue.getByInventoryKey('curve-r40')?.id ?? null;
  }

  for (const piece of catalogue.all()) {
    if ((counts[piece.inventoryKey] ?? 0) > 0) {
      return piece.id;
    }
  }

  return null;
}

function createSeedLayout(
  pieceId: string,
  catalogue: PieceCatalogue,
): Layout {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    catalogueVersion: catalogue.version,
    placements: [
      {
        instanceId: 'seed-1',
        pieceId,
        x: 0,
        y: 0,
        rotation: 0,
      },
    ],
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

interface SearchState {
  explored: number;
  found: Layout[];
  seenHashes: Set<string>;
  startTime: number;
  instanceCounter: number;
  limitsHit: boolean;
}

interface SearchLimits {
  maxResults: number;
  timeoutMs: number;
  maxNodesExplored: number;
  minPieces: number;
  maxDepth: number;
}

function shouldStop(
  state: SearchState,
  limits: SearchLimits,
  signal?: AbortSignal,
): boolean {
  if (signal?.aborted) {
    return true;
  }
  if (state.explored >= limits.maxNodesExplored) {
    state.limitsHit = true;
    return true;
  }
  if (Date.now() - state.startTime >= limits.timeoutMs) {
    state.limitsHit = true;
    return true;
  }
  if (state.found.length >= limits.maxResults) {
    return true;
  }
  return false;
}

function tryCollectCandidate(
  layout: Layout,
  catalogue: PieceCatalogue,
  state: SearchState,
  limits: SearchLimits,
): void {
  if (layout.placements.length < limits.minPieces) {
    return;
  }

  const validation = validateLayout(layout, catalogue);
  if (!validation.valid) {
    return;
  }

  if (isDuplicate(layout, state.seenHashes)) {
    return;
  }

  state.found.push({
    schemaVersion: layout.schemaVersion,
    catalogueVersion: layout.catalogueVersion,
    placements: layout.placements.map((p) => ({ ...p })),
  });
}

function explore(
  layout: Layout,
  inventory: Inventory,
  catalogue: PieceCatalogue,
  state: SearchState,
  limits: SearchLimits,
  rng: () => number,
  signal?: AbortSignal,
): void {
  if (shouldStop(state, limits, signal)) {
    return;
  }

  state.explored += 1;
  tryCollectCandidate(layout, catalogue, state, limits);

  if (layout.placements.length >= limits.maxDepth) {
    return;
  }

  const remaining = getRemainingCounts(inventory, layout, catalogue);
  const availablePieceIds = catalogue
    .all()
    .filter((piece) => (remaining[piece.inventoryKey] ?? 0) > 0)
    .map((piece) => piece.id);

  if (availablePieceIds.length === 0) {
    return;
  }

  const frontier = shuffleWithRng(sortFrontier(getOpenPorts(layout, catalogue)), rng);

  for (const port of frontier) {
    if (shouldStop(state, limits, signal)) {
      return;
    }

    const pieceIds = shuffleWithRng(availablePieceIds, rng);

    for (const pieceId of pieceIds) {
      const attachments = enumerateAttachments(port, pieceId, catalogue);

      for (const attachment of attachments) {
        if (shouldStop(state, limits, signal)) {
          return;
        }

        state.instanceCounter += 1;
        const candidate: Placement = {
          ...attachment,
          instanceId: `gen-${state.instanceCounter}`,
        };

        const placementCheck = canPlace(layout, candidate, catalogue);
        if (!placementCheck.valid) {
          continue;
        }

        const nextLayout: Layout = {
          ...layout,
          placements: [...layout.placements, candidate],
        };

        explore(nextLayout, inventory, catalogue, state, limits, rng, signal);
      }
    }

    tryLoopClosure(layout, port, inventory, catalogue, state, limits, rng, signal);
  }
}

function portsCanConnect(a: WorldPort, b: WorldPort): boolean {
  if (a.instanceId === b.instanceId && a.portId === b.portId) {
    return false;
  }

  const dx = Math.abs(a.position.x - b.position.x);
  const dy = Math.abs(a.position.y - b.position.y);
  const facingMatch = (a.facing + 8) % 16 === b.facing;

  return dx < 0.01 && dy < 0.01 && facingMatch;
}

function tryLoopClosure(
  layout: Layout,
  frontierPort: WorldPort,
  inventory: Inventory,
  catalogue: PieceCatalogue,
  state: SearchState,
  limits: SearchLimits,
  rng: () => number,
  signal?: AbortSignal,
): void {
  const openPorts = getOpenPorts(layout, catalogue);
  const targets = openPorts.filter(
    (port) =>
      port.instanceId !== frontierPort.instanceId || port.portId !== frontierPort.portId,
  );

  for (const target of targets) {
    if (!portsCanConnect(frontierPort, target)) {
      continue;
    }

    const pieceIds = shuffleWithRng(
      catalogue
        .all()
        .filter((piece) => (getRemainingCounts(inventory, layout, catalogue)[piece.inventoryKey] ?? 0) > 0)
        .map((piece) => piece.id),
      rng,
    );

    for (const pieceId of pieceIds) {
      const viaFrontier = enumerateAttachments(frontierPort, pieceId, catalogue);
      for (const attachment of viaFrontier) {
        if (shouldStop(state, limits, signal)) {
          return;
        }

        state.instanceCounter += 1;
        const candidate: Placement = {
          ...attachment,
          instanceId: `gen-${state.instanceCounter}`,
        };

        const withCandidate: Layout = {
          ...layout,
          placements: [...layout.placements, candidate],
        };

        const placementCheck = canPlace(layout, candidate, catalogue);
        if (!placementCheck.valid) {
          continue;
        }

        const candidateOpen = getOpenPorts(withCandidate, catalogue);
        const closes = candidateOpen.some((port) =>
          portsCanConnect(port, target),
        );
        if (!closes) {
          continue;
        }

        explore(withCandidate, inventory, catalogue, state, limits, rng, signal);
      }
    }
  }
}

export function searchLayouts(
  inventory: Inventory,
  options: Partial<GeneratorOptions> = {},
  catalogue: PieceCatalogue = CATALOGUE_V1,
  callbacks?: {
    onProgress?: (progress: GeneratorProgress) => void;
    signal?: AbortSignal;
  },
): GeneratorResult {
  const resolved = defaultGeneratorOptions(options);
  const totalPieces = totalPieceCount(inventory.counts);

  if (totalPieces === 0) {
    return {
      candidates: [],
      exhausted: true,
      explored: 0,
      message: 'No valid layout found',
    };
  }

  const seedPieceId = pickSeedPieceId(inventory, catalogue);
  if (!seedPieceId) {
    return {
      candidates: [],
      exhausted: true,
      explored: 0,
      message: 'No valid layout found',
    };
  }

  const seedLayout = createSeedLayout(seedPieceId, catalogue);
  const seedValidation = validateLayout(seedLayout, catalogue);
  if (!seedValidation.valid) {
    return {
      candidates: [],
      exhausted: true,
      explored: 0,
      message: 'No valid layout found',
    };
  }

  const rng = mulberry32(resolved.seed ?? 1);
  const maxDepth = resolved.maxDepth ?? totalPieces;
  const limits: SearchLimits = {
    maxResults: resolved.maxResults,
    timeoutMs: resolved.timeoutMs,
    maxNodesExplored: resolved.maxNodesExplored,
    minPieces: resolved.minPieces,
    maxDepth,
  };

  const state: SearchState = {
    explored: 0,
    found: [],
    seenHashes: new Set(),
    startTime: Date.now(),
    instanceCounter: 1,
    limitsHit: false,
  };

  const reportProgress = (): void => {
    callbacks?.onProgress?.({
      explored: state.explored,
      found: state.found.length,
      elapsedMs: Date.now() - state.startTime,
    });
  };

  explore(seedLayout, inventory, catalogue, state, limits, rng, callbacks?.signal);
  reportProgress();

  const candidates = sortCandidates(
    state.found,
    catalogue,
    resolved.preferClosedLoops,
  ).slice(0, resolved.maxResults);

  const exhausted = state.limitsHit || callbacks?.signal?.aborted === true;
  const message =
    candidates.length === 0 ? 'No valid layout found' : undefined;

  return {
    candidates,
    exhausted,
    explored: state.explored,
    message,
  };
}
