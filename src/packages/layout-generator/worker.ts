import type { Inventory } from '@track-layout/inventory';

import { searchLayouts } from './search.ts';
import type {
  GeneratorOptions,
  WorkerDoneMessage,
  WorkerProgressMessage,
  WorkerRequest,
  WorkerResponse,
} from './types.ts';

const PROGRESS_INTERVAL_MS = 200;

let abortController: AbortController | null = null;
let lastProgressAt = 0;

function postProgress(
  post: (message: WorkerResponse) => void,
  explored: number,
  found: number,
  elapsedMs: number,
): void {
  const now = Date.now();
  if (now - lastProgressAt < PROGRESS_INTERVAL_MS) {
    return;
  }
  lastProgressAt = now;
  const message: WorkerProgressMessage = {
    status: 'progress',
    explored,
    found,
    elapsedMs,
  };
  post(message);
}

export function handleWorkerRequest(
  request: WorkerRequest,
  post: (message: WorkerResponse) => void,
): WorkerDoneMessage | null {
  if (request.type === 'cancel') {
    abortController?.abort();
    return null;
  }

  abortController?.abort();
  abortController = new AbortController();
  lastProgressAt = 0;

  const startTime = Date.now();
  const result = searchLayouts(
    request.inventory as Inventory,
    request.options as GeneratorOptions,
    undefined,
    {
      signal: abortController.signal,
      onProgress: (progress) => {
        postProgress(post, progress.explored, progress.found, progress.elapsedMs);
      },
    },
  );

  const done: WorkerDoneMessage = {
    status: 'done',
    candidates: result.candidates,
    exhausted: result.exhausted,
    explored: result.explored,
    message: result.message,
  };

  post({
    status: 'progress',
    explored: result.explored,
    found: result.candidates.length,
    elapsedMs: Date.now() - startTime,
  });
  post(done);

  return done;
}

if (typeof self !== 'undefined' && typeof postMessage !== 'undefined') {
  self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
    handleWorkerRequest(event.data, (message) => {
      self.postMessage(message);
    });
  });
}
