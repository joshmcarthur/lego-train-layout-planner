import { getWorldPorts, validateLayout, type Layout, type WorldPort } from '@track-layout/connection-engine';
import type { PieceCatalogue } from '@track-layout/piece-catalogue';

export function getOpenPorts(layout: Layout, catalogue: PieceCatalogue): WorldPort[] {
  const result = validateLayout(layout, catalogue);
  const openEnds = result.issues.filter((issue) => issue.code === 'OPEN_END');
  const ports: WorldPort[] = [];

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

export function frontierKey(port: WorldPort): string {
  const x = Math.round(port.position.x * 100) / 100;
  const y = Math.round(port.position.y * 100) / 100;
  return `${port.instanceId}:${port.portId}:${x}:${y}:${port.facing}`;
}

export function sortFrontier(ports: WorldPort[]): WorldPort[] {
  return [...ports].sort((a, b) => frontierKey(a).localeCompare(frontierKey(b)));
}
