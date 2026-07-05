import { buildRouteGraph, type Layout } from '@track-layout/connection-engine';
import type { PieceCatalogue } from '@track-layout/piece-catalogue';

export interface LayoutScore {
  hasClosedLoop: boolean;
  pieceCount: number;
  openEndCount: number;
}

export function scoreLayout(layout: Layout, catalogue: PieceCatalogue): LayoutScore {
  const graph = buildRouteGraph(layout, catalogue);
  return {
    hasClosedLoop: graph.closedComponents.length > 0,
    pieceCount: layout.placements.length,
    openEndCount: graph.openEnds.length,
  };
}

export function compareScores(a: LayoutScore, b: LayoutScore): number {
  if (a.hasClosedLoop !== b.hasClosedLoop) {
    return a.hasClosedLoop ? -1 : 1;
  }

  if (a.pieceCount !== b.pieceCount) {
    return b.pieceCount - a.pieceCount;
  }

  return a.openEndCount - b.openEndCount;
}

export function sortCandidates(
  layouts: Layout[],
  catalogue: PieceCatalogue,
  preferClosedLoops: boolean,
): Layout[] {
  const scored = layouts.map((layout) => ({
    layout,
    score: scoreLayout(layout, catalogue),
  }));

  scored.sort((a, b) => {
    if (preferClosedLoops && a.score.hasClosedLoop !== b.score.hasClosedLoop) {
      return a.score.hasClosedLoop ? -1 : 1;
    }
    return compareScores(a.score, b.score);
  });

  return scored.map((entry) => entry.layout);
}
