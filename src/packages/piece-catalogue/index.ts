export const PACKAGE_VERSION = '0.1.0';

export { connectorsCompatible, TRIG_TABLE } from './constants.ts';
export {
  CATALOGUE_V1,
  CATALOGUE_VERSION,
} from './catalogue.ts';
export {
  buildCurveOutline,
  buildSwitchOutline,
  CURVE_EXIT_X,
  CURVE_EXIT_Y,
  SWITCH_BRANCH_X,
  SWITCH_BRANCH_Y,
} from './geometry.ts';
export {
  CURVE_R40,
  MVP_PIECES,
  STRAIGHT_16,
  SWITCH_LEFT,
  SWITCH_RIGHT,
} from './pieces/index.ts';
export {
  assertHeading,
  ALL_HEADINGS,
  HEADING_COUNT,
  POSITION_TOLERANCE,
} from './types.ts';
export type {
  ConnectorType,
  FootprintCell,
  Heading,
  PieceCatalogue,
  PieceCategory,
  PieceDefinition,
  Point,
  PortDefinition,
  TransformedGeometry,
  TransformedPort,
} from './types.ts';
export {
  clearGeometryCache,
  getTransformedGeometry,
  headingToUnitVector,
  oppositeHeading,
  pointsCoincide,
  rasterizeOutline,
  rotateHeading,
  rotatePoint,
} from './transform.ts';
