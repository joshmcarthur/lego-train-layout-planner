import type { PieceCatalogue } from '@track-layout/piece-catalogue';

import { classifyPorts } from './adjacency.ts';
import { getAllWorldPorts, portNodeId } from './placement.ts';
import type {
  ConnectionEdge,
  Layout,
  RouteGraph,
  RouteGraphEdge,
  RouteGraphNode,
} from './types.ts';

class UnionFind {
  private parent: number[];
  private hasCycle: boolean[] = [];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.hasCycle = Array.from({ length: size }, () => false);
  }

  find(index: number): number {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }
    return this.parent[index];
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) {
      this.hasCycle[rootA] = true;
      return;
    }
    this.parent[rootB] = rootA;
    this.hasCycle[rootA] = this.hasCycle[rootA] || this.hasCycle[rootB];
  }

  componentHasCycle(root: number): boolean {
    return this.hasCycle[root];
  }
}

function addUndirectedEdge(edges: RouteGraphEdge[], from: string, to: string, kind: RouteGraphEdge['kind']): void {
  if (from === to) {
    return;
  }
  edges.push({ from, to, kind });
  edges.push({ from: to, to: from, kind });
}

function internalEdgesForPiece(
  instanceId: string,
  pieceId: string,
  catalogue: PieceCatalogue,
): ConnectionEdge[] {
  const piece = catalogue.getById(pieceId);
  if (!piece || piece.ports.length < 2) {
    return [];
  }

  const portIds = piece.ports.map((port) => port.id);
  const node = (portId: string): string => portNodeId(instanceId, portId);

  switch (piece.category) {
    case 'straight':
    case 'curve':
      return [{ from: node(portIds[0]), to: node(portIds[1]) }];
    case 'switch-left':
    case 'switch-right':
      return [
        { from: node(portIds[0]), to: node(portIds[1]) },
        { from: node(portIds[0]), to: node(portIds[2]) },
      ];
    case 'crossing':
      return [
        { from: node(portIds[0]), to: node(portIds[2]) },
        { from: node(portIds[1]), to: node(portIds[3]) },
      ];
    default: {
      const exhaustive: never = piece.category;
      throw new Error(`Unhandled piece category: ${exhaustive}`);
    }
  }
}

export function buildRouteGraph(layout: Layout, catalogue: PieceCatalogue): RouteGraph {
  const worldPorts = getAllWorldPorts(layout, catalogue);
  const { connectionEdges } = classifyPorts(layout, catalogue);

  const nodes = new Map<string, RouteGraphNode>();
  for (const port of worldPorts) {
    const id = portNodeId(port.instanceId, port.portId);
    nodes.set(id, {
      instanceId: port.instanceId,
      portId: port.portId,
      x: port.position.x,
      y: port.position.y,
    });
  }

  const edges: RouteGraphEdge[] = [];
  const seenConnection = new Set<string>();

  for (const edge of connectionEdges) {
    const key = edge.from < edge.to ? `${edge.from}|${edge.to}` : `${edge.to}|${edge.from}`;
    if (seenConnection.has(key)) {
      continue;
    }
    seenConnection.add(key);
    addUndirectedEdge(edges, edge.from, edge.to, 'connection');
  }

  for (const placement of layout.placements) {
    const internal = internalEdgesForPiece(placement.instanceId, placement.pieceId, catalogue);
    for (const edge of internal) {
      addUndirectedEdge(edges, edge.from, edge.to, 'internal');
    }
  }

  const nodeIds = [...nodes.keys()];
  const nodeIndex = new Map(nodeIds.map((id, index) => [id, index]));
  const uf = new UnionFind(nodeIds.length);
  const unionedEdges = new Set<string>();

  for (const edge of edges) {
    const edgeKey = edge.from < edge.to ? `${edge.from}|${edge.to}` : `${edge.to}|${edge.from}`;
    if (unionedEdges.has(edgeKey)) {
      continue;
    }
    unionedEdges.add(edgeKey);

    const fromIndex = nodeIndex.get(edge.from);
    const toIndex = nodeIndex.get(edge.to);
    if (fromIndex === undefined || toIndex === undefined) {
      continue;
    }
    uf.union(fromIndex, toIndex);
  }

  const componentsByRoot = new Map<number, string[]>();
  for (const nodeId of nodeIds) {
    const index = nodeIndex.get(nodeId);
    if (index === undefined) {
      continue;
    }
    const root = uf.find(index);
    const group = componentsByRoot.get(root);
    if (group) {
      group.push(nodeId);
    } else {
      componentsByRoot.set(root, [nodeId]);
    }
  }

  const components = [...componentsByRoot.values()].map((group) => [...group].sort());
  const closedComponents = components.filter((group) => {
    const first = group[0];
    const index = nodeIndex.get(first);
    if (index === undefined) {
      return false;
    }
    return uf.componentHasCycle(uf.find(index));
  });

  const connectionEdgeCount = new Map<string, number>();
  for (const edge of connectionEdges) {
    connectionEdgeCount.set(edge.from, (connectionEdgeCount.get(edge.from) ?? 0) + 1);
    connectionEdgeCount.set(edge.to, (connectionEdgeCount.get(edge.to) ?? 0) + 1);
  }

  const openEnds = nodeIds
    .filter((nodeId) => (connectionEdgeCount.get(nodeId) ?? 0) === 0)
    .sort();

  return {
    nodes,
    edges,
    components,
    closedComponents,
    openEnds,
  };
}
