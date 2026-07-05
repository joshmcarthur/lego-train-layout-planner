import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { buildRouteGraph } from '@track-layout/connection-engine';
import type { Layout } from '@track-layout/connection-engine';

import { buildCurveLoop, createLayout, placePiece } from './layout-builder.ts';

interface LayoutFixture {
  schemaVersion: number;
  catalogueVersion: number;
  placements: Layout['placements'];
  expect: {
    routeGraph?: {
      closedComponentCount?: number;
      openEndCount?: number;
    };
  };
}

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/layouts',
);

function loadFixture(name: string): LayoutFixture {
  return JSON.parse(
    readFileSync(path.join(fixtureDir, `${name}.json`), 'utf8'),
  ) as LayoutFixture;
}

function toLayout(fixture: LayoutFixture): Layout {
  return {
    schemaVersion: fixture.schemaVersion,
    catalogueVersion: fixture.catalogueVersion,
    placements: fixture.placements,
  };
}

describe('buildRouteGraph', () => {
  it('classifies curve-loop-valid as one closed component with no open ends', () => {
    const fixture = loadFixture('curve-loop-valid');
    const graph = buildRouteGraph(toLayout(fixture), CATALOGUE_V1);

    expect(graph.closedComponents).toHaveLength(1);
    expect(graph.openEnds).toHaveLength(0);
  });

  it('classifies switch-siding-valid open ends on unconnected ports', () => {
    const fixture = loadFixture('switch-siding-valid');
    const graph = buildRouteGraph(toLayout(fixture), CATALOGUE_V1);

    expect(graph.openEnds).toHaveLength(fixture.expect.routeGraph?.openEndCount ?? 0);
    expect(graph.closedComponents).toHaveLength(fixture.expect.routeGraph?.closedComponentCount ?? 0);
  });

  it('reports open ends for a single straight terminator', () => {
    const layout = createLayout([placePiece('straight-16', 0, 0, 0, 'solo')]);
    const graph = buildRouteGraph(layout, CATALOGUE_V1);

    expect(graph.openEnds).toHaveLength(2);
    expect(graph.closedComponents).toHaveLength(0);
  });

  it('keeps closed-loop classification independent of open siding stubs', () => {
    const loopLayout = createLayout(buildCurveLoop());
    const loopGraph = buildRouteGraph(loopLayout, CATALOGUE_V1);

    expect(loopGraph.closedComponents).toHaveLength(1);
    expect(loopGraph.openEnds).toHaveLength(0);
  });

  it('loads route graph expectations from fixtures that define them', () => {
    const fixtures = readdirSync(fixtureDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => loadFixture(file.replace(/\.json$/, '')))
      .filter((fixture) => fixture.expect.routeGraph !== undefined);

    expect(fixtures.length).toBeGreaterThan(0);

    for (const fixture of fixtures) {
      const graph = buildRouteGraph(toLayout(fixture), CATALOGUE_V1);
      if (fixture.expect.routeGraph?.closedComponentCount !== undefined) {
        expect(graph.closedComponents).toHaveLength(fixture.expect.routeGraph.closedComponentCount);
      }
      if (fixture.expect.routeGraph?.openEndCount !== undefined) {
        expect(graph.openEnds).toHaveLength(fixture.expect.routeGraph.openEndCount);
      }
    }
  });
});
