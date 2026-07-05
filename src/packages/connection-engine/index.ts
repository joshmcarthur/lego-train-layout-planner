export const PACKAGE_VERSION = '0.1.0';

export { NEAR_MISS_RADIUS, classifyPorts, portsConnect } from './adjacency.ts';
export { detectOverlaps } from './collision.ts';
export {
  getAllWorldPorts,
  getWorldOccupancy,
  getWorldPorts,
  portNodeId,
} from './placement.ts';
export { buildRouteGraph } from './route-graph.ts';
export { LAYOUT_SCHEMA_VERSION } from './types.ts';
export type {
  ConnectionEdge,
  Layout,
  Placement,
  RouteGraph,
  RouteGraphEdge,
  RouteGraphNode,
  ValidationIssue,
  ValidationResult,
  WorldPort,
} from './types.ts';
export { canPlace, validateLayout } from './validate.ts';
