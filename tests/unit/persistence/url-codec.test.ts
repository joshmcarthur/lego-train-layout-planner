import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { Layout, Placement } from '@track-layout/connection-engine';
import {
  createSerializedAppState,
  decodeSharePayload,
  decodeShareUrl,
  encodeShareUrl,
  extractSharePayload,
  forkLayout,
  MAX_PLACEMENTS,
  type SerializedAppState,
  URL_LENGTH_LIMIT,
} from '@track-layout/persistence';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(
  readFileSync(join(__dirname, '../../fixtures/serialized/v1-minimal.json'), 'utf8'),
) as SerializedAppState;

describe('url-codec', () => {
  it('round-trips golden fixture layout and inventory', () => {
    const encoded = encodeShareUrl(golden, 'https://example.test/editor/');
    expect(encoded.tooLong).toBe(false);

    const decoded = decodeShareUrl(encoded.url);
    expect(decoded).toEqual(golden);
  });

  it('extracts payload from hash and query', () => {
    const encoded = encodeShareUrl(golden, 'https://example.test/editor/');
    const fromHash = extractSharePayload(encoded.url);
    expect(fromHash).toBeTruthy();
    expect(decodeSharePayload(fromHash!)).toEqual(golden);

    const queryUrl = `https://example.test/editor/?s=${encoded.payload}`;
    expect(extractSharePayload(queryUrl)).toBe(encoded.payload);
  });

  it('returns null for corrupted payload', () => {
    expect(decodeSharePayload('not-valid')).toBeNull();
    expect(decodeShareUrl('https://example.test/editor/#s=not-valid')).toBeNull();
  });

  it('flags URLs over the length guard', () => {
    const placements: Placement[] = Array.from({ length: 120 }, (_, index) => ({
      instanceId: `id-${index}`,
      pieceId: 'straight-16',
      x: index * 16,
      y: 0,
      rotation: 0,
    }));

    const state = createSerializedAppState(
      {
        schemaVersion: 1,
        catalogueVersion: CATALOGUE_VERSION,
        placements,
      } satisfies Layout,
      { catalogueVersion: CATALOGUE_VERSION },
    );

    const encoded = encodeShareUrl(state, 'https://example.test/editor/');
    expect(encoded.payload.length).toBeGreaterThan(URL_LENGTH_LIMIT);
    expect(encoded.tooLong).toBe(true);
    expect(placements.length).toBeLessThanOrEqual(MAX_PLACEMENTS);
  });
});

describe('fork', () => {
  it('remaps instance IDs while preserving geometry', () => {
    const forked = forkLayout(golden.layout);
    expect(forked.placements).toHaveLength(2);
    expect(forked.placements.map((p) => p.instanceId)).not.toEqual(
      golden.layout.placements.map((p: { instanceId: string }) => p.instanceId),
    );
    expect(forked.placements[0]).toMatchObject({
      pieceId: 'straight-16',
      x: 0,
      y: 0,
      rotation: 0,
    });
  });
});
