import type { ConnectorType, FootprintCell, Heading, Point } from '@track-layout/piece-catalogue';

export const LAYOUT_SCHEMA_VERSION = 1;

export interface Placement {
  instanceId: string;
  pieceId: string;
  x: number;
  y: number;
  rotation: Heading;
}

export interface Layout {
  schemaVersion: number;
  catalogueVersion: number;
  placements: Placement[];
}

export type ValidationIssue =
  | { severity: 'error'; code: 'OVERLAP'; a: string; b: string }
  | { severity: 'error'; code: 'PORT_MISMATCH'; instanceId: string; portId: string }
  | { severity: 'error'; code: 'PORT_NEAR_MISS'; instanceId: string; portId: string }
  | { severity: 'error'; code: 'UNKNOWN_PIECE'; instanceId: string; pieceId: string }
  | { severity: 'info'; code: 'OPEN_END'; instanceId: string; portId: string };

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface RouteGraphNode {
  instanceId: string;
  portId: string;
  x: number;
  y: number;
}

export interface RouteGraphEdge {
  from: string;
  to: string;
  kind: 'connection' | 'internal';
}

export interface RouteGraph {
  nodes: Map<string, RouteGraphNode>;
  edges: RouteGraphEdge[];
  components: string[][];
  closedComponents: string[][];
  openEnds: string[];
}

export interface WorldPort {
  instanceId: string;
  portId: string;
  pieceId: string;
  position: Point;
  facing: Heading;
  connector: ConnectorType;
}

export interface ConnectionEdge {
  from: string;
  to: string;
}

export type { FootprintCell };
