import { describe, expect, it } from 'vitest';

import {
  buildRouteGraph,
  PACKAGE_VERSION as connectionEngineVersion,
  validateLayout,
} from '@track-layout/connection-engine';
import { PACKAGE_VERSION as inventoryVersion } from '@track-layout/inventory';
import { PACKAGE_VERSION as layoutGeneratorVersion } from '@track-layout/layout-generator';
import { PACKAGE_VERSION as persistenceVersion } from '@track-layout/persistence';
import {
  CATALOGUE_V1,
  PACKAGE_VERSION as pieceCatalogueVersion,
} from '@track-layout/piece-catalogue';

describe('toolchain smoke', () => {
  it('runs vitest', () => {
    expect(true).toBe(true);
  });

  it('imports domain package barrels', () => {
    expect(pieceCatalogueVersion).toBe('0.1.0');
    expect(CATALOGUE_V1.version).toBe(1);
    expect(connectionEngineVersion).toBe('0.1.0');
    expect(typeof validateLayout).toBe('function');
    expect(typeof buildRouteGraph).toBe('function');
    expect(layoutGeneratorVersion).toBe('0.0.0');
    expect(inventoryVersion).toBe('0.1.0');
    expect(persistenceVersion).toBe('0.1.0');
  });
});
