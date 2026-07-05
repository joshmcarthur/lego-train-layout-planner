import {
  connectorsCompatible,
  oppositeHeading,
  pointsCoincide,
  POSITION_TOLERANCE,
  type PieceCatalogue,
} from '@track-layout/piece-catalogue';

import { getAllWorldPorts, portNodeId } from './placement.ts';
import type { ConnectionEdge, Layout, ValidationIssue, WorldPort } from './types.ts';

/** Ports closer than this but outside connection tolerance are near-miss errors. */
export const NEAR_MISS_RADIUS = 1;

export interface AdjacencyResult {
  issues: ValidationIssue[];
  connectionEdges: ConnectionEdge[];
}

function bucketKey(x: number, y: number): string {
  const bx = Math.round(x / POSITION_TOLERANCE);
  const by = Math.round(y / POSITION_TOLERANCE);
  return `${bx},${by}`;
}

function portDistance(a: WorldPort, b: WorldPort): number {
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
}

export function portsConnect(a: WorldPort, b: WorldPort): boolean {
  return (
    a.instanceId !== b.instanceId &&
    pointsCoincide(a.position, b.position) &&
    a.facing === oppositeHeading(b.facing) &&
    connectorsCompatible(a.connector, b.connector)
  );
}

function buildSpatialIndex(ports: WorldPort[]): Map<string, WorldPort[]> {
  const index = new Map<string, WorldPort[]>();

  for (const port of ports) {
    const key = bucketKey(port.position.x, port.position.y);
    const bucket = index.get(key);
    if (bucket) {
      bucket.push(port);
    } else {
      index.set(key, [port]);
    }
  }

  return index;
}

function neighbourBucketKeys(x: number, y: number): string[] {
  const bx = Math.round(x / POSITION_TOLERANCE);
  const by = Math.round(y / POSITION_TOLERANCE);
  const keys: string[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`${bx + dx},${by + dy}`);
    }
  }

  return keys;
}

function nearbyPorts(port: WorldPort, index: Map<string, WorldPort[]>): WorldPort[] {
  const seen = new Set<string>();
  const nearby: WorldPort[] = [];

  for (const key of neighbourBucketKeys(port.position.x, port.position.y)) {
    const bucket = index.get(key);
    if (!bucket) {
      continue;
    }

    for (const candidate of bucket) {
      if (candidate.instanceId === port.instanceId) {
        continue;
      }

      const id = portNodeId(candidate.instanceId, candidate.portId);
      if (seen.has(id)) {
        continue;
      }

      if (portDistance(port, candidate) < NEAR_MISS_RADIUS) {
        seen.add(id);
        nearby.push(candidate);
      }
    }
  }

  return nearby;
}

function connectionEdgeKey(from: string, to: string): string {
  return from < to ? `${from}|${to}` : `${to}|${from}`;
}

export function classifyPorts(layout: Layout, catalogue: PieceCatalogue): AdjacencyResult {
  const ports = getAllWorldPorts(layout, catalogue);
  const index = buildSpatialIndex(ports);
  const issues: ValidationIssue[] = [];
  const connectionEdges: ConnectionEdge[] = [];
  const seenConnectionEdges = new Set<string>();
  const reportedIssues = new Set<string>();

  function reportIssue(issue: ValidationIssue): void {
    let key: string;
    if (issue.code === 'OVERLAP') {
      key = `OVERLAP:${issue.a}:${issue.b}`;
    } else if (issue.code === 'OPEN_END') {
      key = `OPEN_END:${issue.instanceId}:${issue.portId}`;
    } else {
      key = `${issue.code}:${issue.instanceId}:${issue.portId}`;
    }

    if (!reportedIssues.has(key)) {
      reportedIssues.add(key);
      issues.push(issue);
    }
  }

  for (const port of ports) {
    const candidates = nearbyPorts(port, index);
    if (candidates.length === 0) {
      reportIssue({
        severity: 'info',
        code: 'OPEN_END',
        instanceId: port.instanceId,
        portId: port.portId,
      });
      continue;
    }

    let hasConnection = false;
    let hasMismatch = false;
    let hasNearMiss = false;

    for (const other of candidates) {
      if (portsConnect(port, other)) {
        hasConnection = true;
        const from = portNodeId(port.instanceId, port.portId);
        const to = portNodeId(other.instanceId, other.portId);
        const edgeKey = connectionEdgeKey(from, to);
        if (!seenConnectionEdges.has(edgeKey)) {
          seenConnectionEdges.add(edgeKey);
          connectionEdges.push({ from, to });
        }
        continue;
      }

      if (pointsCoincide(port.position, other.position)) {
        hasMismatch = true;
        reportIssue({
          severity: 'error',
          code: 'PORT_MISMATCH',
          instanceId: port.instanceId,
          portId: port.portId,
        });
        reportIssue({
          severity: 'error',
          code: 'PORT_MISMATCH',
          instanceId: other.instanceId,
          portId: other.portId,
        });
        continue;
      }

      hasNearMiss = true;
      reportIssue({
        severity: 'error',
        code: 'PORT_NEAR_MISS',
        instanceId: port.instanceId,
        portId: port.portId,
      });
      reportIssue({
        severity: 'error',
        code: 'PORT_NEAR_MISS',
        instanceId: other.instanceId,
        portId: other.portId,
      });
    }

    if (!hasConnection && !hasMismatch && !hasNearMiss) {
      reportIssue({
        severity: 'info',
        code: 'OPEN_END',
        instanceId: port.instanceId,
        portId: port.portId,
      });
    }
  }

  return { issues, connectionEdges };
}
