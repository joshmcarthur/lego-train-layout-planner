import type { Placement } from '@track-layout/connection-engine';
import type { WorldPort } from '@track-layout/connection-engine';
import {
  connectorsCompatible,
  getTransformedGeometry,
  oppositeHeading,
  type Heading,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

export function attachToFrontier(
  frontier: WorldPort,
  pieceId: string,
  candidatePortId: string,
  rotation: Heading,
  instanceId: string,
  catalogue: PieceCatalogue,
): Placement | null {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return null;
  }

  if (!piece.allowedRotations.includes(rotation)) {
    return null;
  }

  const geometry = getTransformedGeometry(piece, rotation);
  const candidatePort = geometry.ports.find((port) => port.id === candidatePortId);
  if (!candidatePort) {
    return null;
  }

  if (candidatePort.facing !== oppositeHeading(frontier.facing)) {
    return null;
  }

  if (!connectorsCompatible(candidatePort.connector, frontier.connector)) {
    return null;
  }

  return {
    instanceId,
    pieceId,
    x: frontier.position.x - candidatePort.position.x,
    y: frontier.position.y - candidatePort.position.y,
    rotation,
  };
}

export function enumerateAttachments(
  frontier: WorldPort,
  pieceId: string,
  catalogue: PieceCatalogue,
): Placement[] {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return [];
  }

  const attachments: Placement[] = [];

  for (const rotation of piece.allowedRotations) {
    const geometry = getTransformedGeometry(piece, rotation);
    for (const localPort of geometry.ports) {
      if (localPort.facing !== oppositeHeading(frontier.facing)) {
        continue;
      }
      if (!connectorsCompatible(localPort.connector, frontier.connector)) {
        continue;
      }

      attachments.push({
        instanceId: '',
        pieceId,
        x: frontier.position.x - localPort.position.x,
        y: frontier.position.y - localPort.position.y,
        rotation,
      });
    }
  }

  return attachments;
}
