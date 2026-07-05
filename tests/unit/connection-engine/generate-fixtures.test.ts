import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';

import {
  buildCurveLoop,
  buildQuarterTurn,
  buildSwitchSiding,
  connectToPort,
  createLayout,
  placePiece,
  resetInstanceCounter,
} from './layout-builder.ts';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/layouts',
);

function writeFixture(name: string, payload: unknown): void {
  writeFileSync(path.join(fixtureDir, `${name}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}

describe('generate layout fixtures', () => {
  it('writes fixture JSON files', () => {
    mkdirSync(fixtureDir, { recursive: true });

    resetInstanceCounter();
    const straight1 = placePiece('straight-16', 0, 0, 0, 's1');
    const twoStraightsLayout = createLayout([
      straight1,
      connectToPort(
        createLayout([straight1]),
        { instanceId: 's1', portId: 'b' },
        'straight-16',
        'a',
        CATALOGUE_V1,
        's2',
      ),
    ]);

    resetInstanceCounter();
    const scStraight = placePiece('straight-16', 0, 0, 0, 'sc1');
    const straightCurveLayout = createLayout([
      scStraight,
      connectToPort(
        createLayout([scStraight]),
        { instanceId: 'sc1', portId: 'b' },
        'curve-r40',
        'a',
        CATALOGUE_V1,
        'sc2',
      ),
    ]);

    resetInstanceCounter();
    const overlapLayout = createLayout([
      placePiece('straight-16', 0, 0, 0, 'o1'),
      placePiece('straight-16', 0, 0, 0, 'o2'),
    ]);

    resetInstanceCounter();
    const nearMissBase = placePiece('straight-16', 0, 0, 0, 'n1');
    const nearMissLayout = createLayout([
      nearMissBase,
      {
        ...connectToPort(
          createLayout([nearMissBase]),
          { instanceId: 'n1', portId: 'b' },
          'straight-16',
          'a',
          CATALOGUE_V1,
          'n2',
        ),
        x: 16.5,
      },
    ]);

    resetInstanceCounter();
    const misalignedBase = placePiece('straight-16', 0, 0, 0, 'm1');
    const misalignedConnected = connectToPort(
      createLayout([misalignedBase]),
      { instanceId: 'm1', portId: 'b' },
      'straight-16',
      'b',
      CATALOGUE_V1,
      'm2',
      0,
    );
    const misalignedLayout = createLayout([misalignedBase, misalignedConnected]);

    resetInstanceCounter();
    const curveLoopLayout = createLayout(buildCurveLoop());
    resetInstanceCounter();
    const quarterTurnLayout = createLayout(buildQuarterTurn());
    resetInstanceCounter();
    const switchSidingLayout = createLayout(buildSwitchSiding());

    writeFixture('two-straights-valid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Colinear straight join',
      placements: twoStraightsLayout.placements,
      expect: {
        valid: true,
        issues: [
          { severity: 'info', code: 'OPEN_END' },
          { severity: 'info', code: 'OPEN_END' },
        ],
      },
    });

    writeFixture('straight-curve-chain-valid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Straight + curve at 22.5° heading',
      placements: straightCurveLayout.placements,
      expect: { valid: true, issues: [{ severity: 'info', code: 'OPEN_END' }] },
    });

    writeFixture('overlap-invalid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Footprint collision',
      placements: overlapLayout.placements,
      expect: { valid: false, issues: [{ severity: 'error', code: 'OVERLAP' }] },
    });

    writeFixture('port-near-miss-invalid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Ports ~0.5 stud apart',
      placements: nearMissLayout.placements,
      expect: { valid: false, issues: [{ severity: 'error', code: 'PORT_NEAR_MISS' }] },
    });

    writeFixture('port-misaligned-invalid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Coincident ports, facings not opposite',
      placements: misalignedLayout.placements,
      expect: { valid: false, issues: [{ severity: 'error', code: 'PORT_MISMATCH' }] },
    });

    writeFixture('curve-loop-valid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Circle of sixteen 22.5° curves',
      placements: curveLoopLayout.placements,
      expect: {
        valid: true,
        issues: [],
        routeGraph: { closedComponentCount: 1, openEndCount: 0 },
      },
    });

    writeFixture('quarter-turn-valid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Straight, four curves, straight (90° turn)',
      placements: quarterTurnLayout.placements,
      expect: {
        valid: true,
        issues: [
          { severity: 'info', code: 'OPEN_END' },
          { severity: 'info', code: 'OPEN_END' },
        ],
      },
    });

    writeFixture('switch-siding-valid', {
      schemaVersion: 1,
      catalogueVersion: 1,
      description: 'Switch with siding straight on branch port',
      placements: switchSidingLayout.placements,
      expect: {
        valid: true,
        issues: [{ severity: 'info', code: 'OPEN_END' }],
        routeGraph: { closedComponentCount: 0, openEndCount: 3 },
      },
    });
  });
});
