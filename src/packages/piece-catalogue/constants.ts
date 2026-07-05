import type { ConnectorType } from './types.ts';

const DEGREES_PER_HEADING = 22.5;

/** Precomputed sin/cos for headings 0–15 (clockwise from east, +Y south). */
export const TRIG_TABLE: ReadonlyArray<{ cos: number; sin: number }> = Array.from(
  { length: 16 },
  (_, heading) => {
    const radians = (heading * DEGREES_PER_HEADING * Math.PI) / 180;
    return { cos: Math.cos(radians), sin: Math.sin(radians) };
  },
);

/** MVP: single symmetric rail connector — any end mates with any end. */
export function connectorsCompatible(a: ConnectorType, b: ConnectorType): boolean {
  return a === 'rail' && b === 'rail';
}
