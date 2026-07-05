import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { validateLayout } from '@track-layout/connection-engine';
import type { Layout, ValidationIssue } from '@track-layout/connection-engine';

interface LayoutFixture {
  schemaVersion: number;
  catalogueVersion: number;
  description: string;
  placements: Layout['placements'];
  expect: {
    valid: boolean;
    issues: Array<Pick<ValidationIssue, 'severity' | 'code'>>;
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

function loadFixtures(): Array<{ name: string; fixture: LayoutFixture }> {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      name: file.replace(/\.json$/, ''),
      fixture: JSON.parse(readFileSync(path.join(fixtureDir, file), 'utf8')) as LayoutFixture,
    }));
}

function toLayout(fixture: LayoutFixture): Layout {
  return {
    schemaVersion: fixture.schemaVersion,
    catalogueVersion: fixture.catalogueVersion,
    placements: fixture.placements,
  };
}

function issueMatches(actual: ValidationIssue, expected: Pick<ValidationIssue, 'severity' | 'code'>): boolean {
  return actual.severity === expected.severity && actual.code === expected.code;
}

describe('validateLayout fixtures', () => {
  const fixtures = loadFixtures();

  it.each(fixtures)('$name matches expected validity and issue codes', ({ fixture }) => {
    const result = validateLayout(toLayout(fixture), CATALOGUE_V1);

    expect(result.valid).toBe(fixture.expect.valid);

    for (const expectedIssue of fixture.expect.issues) {
      expect(result.issues.some((issue) => issueMatches(issue, expectedIssue))).toBe(true);
    }

    if (fixture.expect.valid) {
      expect(result.issues.every((issue) => issue.severity !== 'error')).toBe(true);
    } else {
      expect(result.issues.some((issue) => issue.severity === 'error')).toBe(true);
    }
  });
});
