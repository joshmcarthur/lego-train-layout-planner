import type { Placement } from '@track-layout/connection-engine';
import type { WorldPort } from '@track-layout/connection-engine';
import {
  connectorsCompatible,
  getTransformedGeometry,
  oppositeHeading,
  type Heading,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

function resolveRotation(
  piece: NonNullable<ReturnType<PieceCatalogue['getById']>>,
  candidatePortId: string,
  requiredFacing: Heading,
): Heading | null {
  for (const heading of piece.allowedRotations) {
    const geometry = getTransformedGeometry(piece, heading);
    const port = geometry.ports.find((candidate) => candidate.id === candidatePortId);
    if (port?.facing === requiredFacing) {
      return heading;
    }
  }
  return null;
}

export function attachToFrontier(
  frontier: WorldPort,
  pieceId: string,
  candidatePortId: string,
  instanceId: string,
  catalogue: PieceCatalogue,
): Placement | null {
  const piece = catalogue.getById(pieceId);
  if (!piece) {
    return null;
  }

  const rotation = resolveRotation(piece, candidatePortId, oppositeHeading(frontier.facing));
  if (rotation === null) {
    return null;
  }

  const geometry = getTransformedGeometry(piece, rotation);
  const candidatePort = geometry.ports.find((port) => port.id === candidatePortId);
  if (!candidatePort) {
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

  const portOrder = ['a', 'b', 'c', 'd'];
  const attachments: Placement[] = [];

  for (const portId of portOrder) {
    if (!piece.ports.some((port) => port.id === portId)) {
      continue;
    }

    const rotation = resolveRotation(piece, portId, oppositeHeading(frontier.facing));
    if (rotation === null) {
      continue;
    }

    const geometry = getTransformedGeometry(piece, rotation);
    const localPort = geometry.ports.find((port) => port.id === portId);
    if (!localPort || !connectorsCompatible(localPort.connector, frontier.connector)) {
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

  return attachments;
}
