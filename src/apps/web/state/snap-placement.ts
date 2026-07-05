import {
  getWorldPorts,
  validateLayout,
  type Layout,
  type Placement,
} from '@track-layout/connection-engine';
import {
  connectorsCompatible,
  getTransformedGeometry,
  oppositeHeading,
  type Heading,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

/** Port-driven snap activates when a mating port is within this distance (studs). */
export const PORT_SNAP_RADIUS = 2;

export interface SnapCandidate {
  placement: Omit<Placement, 'instanceId'>;
  distance: number;
}

function portDistance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(ax - bx, ay - by);
}

function getOpenPorts(layout: Layout, catalogue: PieceCatalogue) {
  const result = validateLayout(layout, catalogue);
  const openEnds = result.issues.filter((issue) => issue.code === 'OPEN_END');
  const ports = [];

  for (const issue of openEnds) {
    const placement = layout.placements.find((p) => p.instanceId === issue.instanceId);
    if (!placement) {
      continue;
    }
    const worldPort = getWorldPorts(placement, catalogue).find(
      (port) => port.portId === issue.portId,
    );
    if (worldPort) {
      ports.push(worldPort);
    }
  }

  return ports;
}

function findBestPortSnap(
  pointerX: number,
  pointerY: number,
  pieceId: string,
  rotation: Heading,
  layout: Layout,
  catalogue: PieceCatalogue,
): SnapCandidate | null {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return null;
  }

  const geometry = getTransformedGeometry(piece, rotation);
  const openPorts = getOpenPorts(layout, catalogue);
  let best: SnapCandidate | null = null;

  for (const openPort of openPorts) {
    for (const localPort of geometry.ports) {
      if (localPort.facing !== oppositeHeading(openPort.facing)) {
        continue;
      }
      if (!connectorsCompatible(localPort.connector, openPort.connector)) {
        continue;
      }

      const anchorX = openPort.position.x - localPort.position.x;
      const anchorY = openPort.position.y - localPort.position.y;

      const gridAnchorX = Math.round(pointerX);
      const gridAnchorY = Math.round(pointerY);
      const ghostPortX = gridAnchorX + localPort.position.x;
      const ghostPortY = gridAnchorY + localPort.position.y;
      const portDist = portDistance(
        ghostPortX,
        ghostPortY,
        openPort.position.x,
        openPort.position.y,
      );

      if (portDist > PORT_SNAP_RADIUS) {
        continue;
      }

      const placement: Omit<Placement, 'instanceId'> = {
        pieceId,
        x: anchorX,
        y: anchorY,
        rotation,
      };

      const candidate: SnapCandidate = { placement, distance: portDist };
      if (!best || portDist < best.distance) {
        best = candidate;
      }
    }
  }

  return best;
}

export function resolvePlacement(
  pointerStudX: number,
  pointerStudY: number,
  pieceId: string,
  rotation: Heading,
  layout: Layout,
  catalogue: PieceCatalogue,
): Omit<Placement, 'instanceId'> | null {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return null;
  }

  const portSnap = findBestPortSnap(
    pointerStudX,
    pointerStudY,
    pieceId,
    rotation,
    layout,
    catalogue,
  );
  if (portSnap) {
    return portSnap.placement;
  }

  return {
    pieceId,
    x: Math.round(pointerStudX),
    y: Math.round(pointerStudY),
    rotation,
  };
}

export function screenToStud(
  screenX: number,
  screenY: number,
  viewport: { panX: number; panY: number; zoom: number },
): { x: number; y: number } {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom,
  };
}
