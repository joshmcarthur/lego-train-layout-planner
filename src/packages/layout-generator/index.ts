export const PACKAGE_VERSION = '0.1.0';

export { attachToFrontier, enumerateAttachments } from './attach.ts';
export { canonicalHash, isDuplicate } from './dedupe.ts';
export { frontierKey, getOpenPorts, sortFrontier } from './frontier.ts';
export { compareScores, scoreLayout, sortCandidates } from './scoring.ts';
export { searchLayouts } from './search.ts';
export { handleWorkerRequest } from './worker.ts';
export {
  DEFAULT_MAX_NODES_EXPLORED,
  DEFAULT_MAX_RESULTS,
  DEFAULT_MIN_PIECES,
  DEFAULT_TIMEOUT_MS,
  defaultGeneratorOptions,
} from './types.ts';
export type {
  GeneratorOptions,
  GeneratorProgress,
  GeneratorResult,
  SearchContext,
  WorkerCancelRequest,
  WorkerDoneMessage,
  WorkerProgressMessage,
  WorkerRequest,
  WorkerResponse,
  WorkerSearchRequest,
} from './types.ts';
