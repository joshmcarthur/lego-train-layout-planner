import LZString from 'lz-string';

import { migrateSerializedState } from './migrate.ts';
import {
  MAX_COMPRESSED_PAYLOAD_LENGTH,
  URL_LENGTH_LIMIT,
  type SerializedAppState,
} from './types.ts';
import { parseSerializedAppState } from './validate.ts';

const SHARE_PARAM = 's';

export interface EncodeShareUrlResult {
  url: string;
  payload: string;
  tooLong: boolean;
}

export function serializeState(state: SerializedAppState): string {
  return JSON.stringify(state);
}

export function extractSharePayload(input: string): string | null {
  const hashMatch = input.match(/[#&?]s=([^&]*)/);
  if (hashMatch?.[1]) {
    return decodeURIComponent(hashMatch[1]);
  }

  try {
    const url = new URL(input, 'https://example.invalid');
    const fromQuery = url.searchParams.get(SHARE_PARAM);
    if (fromQuery) {
      return fromQuery;
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    return hashParams.get(SHARE_PARAM);
  } catch {
    return null;
  }
}

export function encodeShareUrl(
  state: SerializedAppState,
  editorPath: string,
): EncodeShareUrlResult {
  const json = serializeState(state);
  const payload = LZString.compressToEncodedURIComponent(json);
  const base = editorPath.endsWith('/') ? editorPath : `${editorPath}/`;
  const url = `${base}#${SHARE_PARAM}=${payload}`;
  return {
    url,
    payload,
    tooLong: payload.length > URL_LENGTH_LIMIT,
  };
}

export function decodeSharePayload(payload: string): SerializedAppState | null {
  if (payload.length > MAX_COMPRESSED_PAYLOAD_LENGTH) {
    return null;
  }

  const json = LZString.decompressFromEncodedURIComponent(payload);
  if (!json) {
    return null;
  }

  const parsed = parseSerializedAppState(json);
  if (!parsed) {
    return null;
  }

  const migrated = migrateSerializedState(parsed);
  return migrated?.state ?? null;
}

export function decodeShareUrl(input: string): SerializedAppState | null {
  const payload = extractSharePayload(input);
  if (!payload) {
    return null;
  }
  return decodeSharePayload(payload);
}
