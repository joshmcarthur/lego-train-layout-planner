import {
  CATALOGUE_V1,
  getTransformedGeometry,
  oppositeHeading,
  type Heading,
  type PieceCatalogue,
} from '../../../src/packages/piece-catalogue/index.ts';
import { getWorldPorts } from '../../../src/packages/connection-engine/placement.ts';
import type { Layout, Placement } from '../../../src/packages/connection-engine/types.ts';

let instanceCounter = 0;

export function resetInstanceCounter(): void {
  instanceCounter = 0;
}

export function nextInstanceId(prefix: string): string {
  instanceCounter += 1;
  return `${prefix}-${instanceCounter}`;
}

export function createLayout(placements: Placement[]): Layout {
  return {
    schemaVersion: 1,
    catalogueVersion: CATALOGUE_V1.version,
    placements,
  };
}

export function placePiece(
  pieceId: string,
  x: number,
  y: number,
  rotation: Heading,
  instanceId?: string,
): Placement {
  return {
    instanceId: instanceId ?? nextInstanceId(pieceId),
    pieceId,
    x,
    y,
    rotation,
  };
}

function resolveRotation(
  piece: NonNullable<ReturnType<PieceCatalogue['getById']>>,
  candidatePortId: string,
  requiredFacing: Heading,
  rotationOverride?: Heading,
): Heading {
  if (rotationOverride !== undefined) {
    return rotationOverride;
  }

  for (const heading of piece.allowedRotations) {
    const geometry = getTransformedGeometry(piece, heading);
    const port = geometry.ports.find((candidate) => candidate.id === candidatePortId);
    if (port?.facing === requiredFacing) {
      return heading;
    }
  }

  throw new Error(
    `No rotation aligns port ${candidatePortId} on ${piece.id} to face ${requiredFacing}`,
  );
}

export function connectToPort(
  layout: Layout,
  target: { instanceId: string; portId: string },
  pieceId: string,
  candidatePortId: string,
  catalogue: PieceCatalogue = CATALOGUE_V1,
  instanceId?: string,
  rotationOverride?: Heading,
): Placement {
  const placement = layout.placements.find((item) => item.instanceId === target.instanceId);
  if (!placement) {
    throw new Error(`Target placement not found: ${target.instanceId}`);
  }

  const targetPort = getWorldPorts(placement, catalogue).find((port) => port.portId === target.portId);

  if (!targetPort) {
    throw new Error(`Target port not found: ${target.instanceId}:${target.portId}`);
  }

  const piece = catalogue.getById(pieceId);
  if (!piece) {
    throw new Error(`Unknown piece: ${pieceId}`);
  }

  const rotation = resolveRotation(
    piece,
    candidatePortId,
    oppositeHeading(targetPort.facing),
    rotationOverride,
  );
  const geometry = getTransformedGeometry(piece, rotation);
  const candidatePort = geometry.ports.find((port) => port.id === candidatePortId);
  if (!candidatePort) {
    throw new Error(`Candidate port not found: ${candidatePortId}`);
  }

  return {
    instanceId: instanceId ?? nextInstanceId(pieceId),
    pieceId,
    x: targetPort.position.x - candidatePort.position.x,
    y: targetPort.position.y - candidatePort.position.y,
    rotation,
  };
}

export function buildCurveLoop(instancePrefix = 'curve'): Placement[] {
  const placements: Placement[] = [];
  let x = 0;
  let y = 0;
  let heading: Heading = 0;

  for (let index = 0; index < 16; index++) {
    const placement = placePiece('curve-r40', x, y, heading, `${instancePrefix}-${index + 1}`);
    placements.push(placement);

    const geometry = getTransformedGeometry(CATALOGUE_V1.getById('curve-r40')!, heading);
    const exit = geometry.ports.find((port) => port.id === 'b');
    if (!exit) {
      throw new Error('curve missing exit port');
    }

    x += exit.position.x;
    y += exit.position.y;
    heading = ((heading + 1) % 16) as Heading;
  }

  return placements;
}

export function buildQuarterTurn(instancePrefix = 'qt'): Placement[] {
  resetInstanceCounter();
  let layout = createLayout([
    placePiece('straight-16', 0, 0, 0, `${instancePrefix}-straight-1`),
  ]);

  const straightExit = { instanceId: `${instancePrefix}-straight-1`, portId: 'b' };
  let current = connectToPort(
    layout,
    straightExit,
    'curve-r40',
    'a',
    CATALOGUE_V1,
    `${instancePrefix}-curve-1`,
  );
  layout = createLayout([...layout.placements, current]);

  for (let index = 2; index <= 4; index++) {
    const previous = current;
    current = connectToPort(
      layout,
      { instanceId: previous.instanceId, portId: 'b' },
      'curve-r40',
      'a',
      CATALOGUE_V1,
      `${instancePrefix}-curve-${index}`,
    );
    layout = createLayout([...layout.placements, current]);
  }

  const finalStraight = connectToPort(
    layout,
    { instanceId: current.instanceId, portId: 'b' },
    'straight-16',
    'a',
    CATALOGUE_V1,
    `${instancePrefix}-straight-2`,
  );

  return [...layout.placements, finalStraight];
}

export function buildSwitchSiding(instancePrefix = 'sw'): Placement[] {
  resetInstanceCounter();
  const sw = placePiece('switch-left', 0, 0, 0, `${instancePrefix}-switch`);
  const siding = connectToPort(
    createLayout([sw]),
    { instanceId: sw.instanceId, portId: 'c' },
    'straight-16',
    'a',
    CATALOGUE_V1,
    `${instancePrefix}-siding`,
  );
  return [sw, siding];
}
