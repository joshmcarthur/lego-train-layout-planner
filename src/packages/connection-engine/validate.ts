import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import { classifyPorts } from './adjacency.ts';
import { detectOverlaps } from './collision.ts';
import type { Layout, Placement, ValidationIssue, ValidationResult } from './types.ts';

function instancePairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function connectedInstancePairs(connectionEdges: Array<{ from: string; to: string }>): Set<string> {
  const pairs = new Set<string>();
  for (const edge of connectionEdges) {
    const [fromInstanceId] = edge.from.split(':');
    const [toInstanceId] = edge.to.split(':');
    pairs.add(instancePairKey(fromInstanceId, toInstanceId));
  }
  return pairs;
}

function severityRank(severity: ValidationIssue['severity']): number {
  return severity === 'error' ? 0 : 1;
}

function compareIssues(a: ValidationIssue, b: ValidationIssue): number {
  const severityDiff = severityRank(a.severity) - severityRank(b.severity);
  if (severityDiff !== 0) {
    return severityDiff;
  }

  const codeDiff = a.code.localeCompare(b.code);
  if (codeDiff !== 0) {
    return codeDiff;
  }

  if (a.code === 'OVERLAP' && b.code === 'OVERLAP') {
    const aPair = a.a < a.b ? `${a.a}|${a.b}` : `${a.b}|${a.a}`;
    const bPair = b.a < b.b ? `${b.a}|${b.b}` : `${b.b}|${b.a}`;
    return aPair.localeCompare(bPair);
  }

  if ('instanceId' in a && 'instanceId' in b) {
    const instanceDiff = a.instanceId.localeCompare(b.instanceId);
    if (instanceDiff !== 0) {
      return instanceDiff;
    }
  }

  if ('portId' in a && 'portId' in b) {
    return a.portId.localeCompare(b.portId);
  }

  return 0;
}

function detectUnknownPieces(layout: Layout, catalogue: PieceCatalogue): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const placement of layout.placements) {
    if (!catalogue.getById(placement.pieceId)) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_PIECE',
        instanceId: placement.instanceId,
        pieceId: placement.pieceId,
      });
    }
  }

  return issues;
}

export function validateLayout(layout: Layout, catalogue: PieceCatalogue): ValidationResult {
  const unknownPieceIssues = detectUnknownPieces(layout, catalogue);
  if (unknownPieceIssues.length > 0) {
    const issues = [...unknownPieceIssues].sort(compareIssues);
    return { valid: false, issues };
  }

  const { issues: adjacencyIssues, connectionEdges } = classifyPorts(layout, catalogue);
  const overlapIssues = detectOverlaps(
    layout,
    catalogue,
    connectedInstancePairs(connectionEdges),
  );
  const issues = [...overlapIssues, ...adjacencyIssues].sort(compareIssues);
  const valid = issues.every((issue) => issue.severity !== 'error');

  return { valid, issues };
}

export function canPlace(
  layout: Layout,
  candidate: Placement,
  catalogue: PieceCatalogue,
): ValidationResult {
  return validateLayout(
    {
      ...layout,
      placements: [...layout.placements, candidate],
    },
    catalogue,
  );
}
