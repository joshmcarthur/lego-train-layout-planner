import type { Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';

export const DEFAULT_MAX_RESULTS = 12;
export const DEFAULT_TIMEOUT_MS = 8000;
export const DEFAULT_MAX_NODES_EXPLORED = 50000;
export const DEFAULT_MIN_PIECES = 2;

export interface GeneratorOptions {
  maxResults: number;
  timeoutMs: number;
  maxNodesExplored: number;
  preferClosedLoops: boolean;
  /** A lone piece is valid but not an interesting candidate. */
  minPieces: number;
  maxDepth?: number;
  seed?: number;
}

export interface GeneratorProgress {
  explored: number;
  found: number;
  elapsedMs: number;
}

export interface GeneratorResult {
  candidates: Layout[];
  exhausted: boolean;
  explored: number;
  message?: string;
}

export interface SearchContext {
  inventory: Inventory;
  options: GeneratorOptions;
  signal?: AbortSignal;
  onProgress?: (progress: GeneratorProgress) => void;
}

export type WorkerSearchRequest = {
  type: 'search';
  inventory: Inventory;
  options: GeneratorOptions;
  seed?: number;
};

export type WorkerCancelRequest = {
  type: 'cancel';
};

export type WorkerRequest = WorkerSearchRequest | WorkerCancelRequest;

export type WorkerProgressMessage = {
  status: 'progress';
  explored: number;
  found: number;
  elapsedMs: number;
};

export type WorkerDoneMessage = {
  status: 'done';
  candidates: Layout[];
  exhausted: boolean;
  explored: number;
  message?: string;
};

export type WorkerResponse = WorkerProgressMessage | WorkerDoneMessage;

export function defaultGeneratorOptions(
  overrides: Partial<GeneratorOptions> = {},
): GeneratorOptions {
  return {
    maxResults: DEFAULT_MAX_RESULTS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxNodesExplored: DEFAULT_MAX_NODES_EXPLORED,
    preferClosedLoops: true,
    minPieces: DEFAULT_MIN_PIECES,
    ...overrides,
  };
}
