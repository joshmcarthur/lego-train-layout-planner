import { describe, expect, it } from 'vitest';

import { PACKAGE_VERSION as connectionEngineVersion } from '@lego/connection-engine';
import { PACKAGE_VERSION as inventoryVersion } from '@lego/inventory';
import { PACKAGE_VERSION as layoutGeneratorVersion } from '@lego/layout-generator';
import { PACKAGE_VERSION as persistenceVersion } from '@lego/persistence';
import { PACKAGE_VERSION as pieceCatalogueVersion } from '@lego/piece-catalogue';

describe('toolchain smoke', () => {
  it('runs vitest', () => {
    expect(true).toBe(true);
  });

  it('imports domain package barrels', () => {
    expect(pieceCatalogueVersion).toBe('0.0.0');
    expect(connectionEngineVersion).toBe('0.0.0');
    expect(layoutGeneratorVersion).toBe('0.0.0');
    expect(inventoryVersion).toBe('0.0.0');
    expect(persistenceVersion).toBe('0.0.0');
  });
});
