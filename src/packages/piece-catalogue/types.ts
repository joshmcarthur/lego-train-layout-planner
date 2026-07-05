/** Stud units; floating point — curve endpoints are irrational (ADR 003). */
export interface Point {
  x: number;
  y: number;
}

/**
 * Piece orientation and port facing as integer steps of 22.5° (ADR 003).
 * 0 = east, 4 = south (90°), 8 = west (180°), 12 = north (270°).
 */
export type Heading = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/** MVP has a single symmetric rail end; extend if research finds keyed ends. */
export type ConnectorType = 'rail';

export interface PortDefinition {
  id: string;
  /** Relative to anchor (= ports[0] position; ports[0].localPosition is {0,0}). */
  localPosition: Point;
  /** Direction the port points outward from the piece. */
  facing: Heading;
  connector: ConnectorType;
}

/** Integer occupancy cell used for collision rasterization. */
export interface FootprintCell {
  x: number;
  y: number;
}

export type PieceCategory =
  | 'straight'
  | 'curve'
  | 'switch-left'
  | 'switch-right'
  | 'crossing';

export interface PieceDefinition {
  id: string;
  name: string;
  category: PieceCategory;
  inventoryKey: string;
  /** Outline polygon in local coords; rasterized per heading for collision. */
  outline: Point[];
  ports: PortDefinition[];
  allowedRotations: Heading[];
  /** Heading steps turned when traversing curve from entry to exit (1 = 22.5°). */
  curveDelta?: 1;
}

export interface TransformedPort {
  id: string;
  position: Point;
  facing: Heading;
  connector: ConnectorType;
}

/** Precomputed by the catalogue for each (piece, heading) pair. */
export interface TransformedGeometry {
  ports: TransformedPort[];
  occupancy: FootprintCell[];
}

export interface PieceCatalogue {
  version: number;
  pieces: PieceDefinition[];
  getById(id: string): PieceDefinition | undefined;
  getByInventoryKey(key: string): PieceDefinition | undefined;
  all(): PieceDefinition[];
}

export const POSITION_TOLERANCE = 0.01;
export const HEADING_COUNT = 16;

const HEADING_VALUES: Heading[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

/** All 16 heading steps — used for allowedRotations on MVP pieces. */
export const ALL_HEADINGS: readonly Heading[] = HEADING_VALUES;

export function isHeading(value: number): value is Heading {
  return Number.isInteger(value) && value >= 0 && value < HEADING_COUNT;
}

export function assertHeading(value: number): Heading {
  if (!isHeading(value)) {
    throw new RangeError(`Invalid heading: ${value}`);
  }
  return value;
}
