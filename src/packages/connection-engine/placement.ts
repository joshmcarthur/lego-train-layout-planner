import {
  getTransformedGeometry,
  type FootprintCell,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

import type { Layout, Placement, WorldPort } from './types.ts';

export function portNodeId(instanceId: string, portId: string): string {
  return `${instanceId}:${portId}`;
}

export function getWorldPorts(placement: Placement, catalogue: PieceCatalogue): WorldPort[] {
  const piece = catalogue.getById(placement.pieceId);
  if (!piece) {
    return [];
  }

  const geometry = getTransformedGeometry(piece, placement.rotation);
  return geometry.ports.map((port) => ({
    instanceId: placement.instanceId,
    portId: port.id,
    pieceId: placement.pieceId,
    position: {
      x: port.position.x + placement.x,
      y: port.position.y + placement.y,
    },
    facing: port.facing,
    connector: port.connector,
  }));
}

export function getWorldOccupancy(
  placement: Placement,
  catalogue: PieceCatalogue,
): FootprintCell[] {
  const piece = catalogue.getById(placement.pieceId);
  if (!piece) {
    return [];
  }

  const geometry = getTransformedGeometry(piece, placement.rotation);
  const offsetX = Math.round(placement.x);
  const offsetY = Math.round(placement.y);

  return geometry.occupancy.map((cell) => ({
    x: cell.x + offsetX,
    y: cell.y + offsetY,
  }));
}

export function getAllWorldPorts(layout: Layout, catalogue: PieceCatalogue): WorldPort[] {
  return layout.placements.flatMap((placement) => getWorldPorts(placement, catalogue));
}
