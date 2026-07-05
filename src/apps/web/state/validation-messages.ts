export const VALIDATION_MESSAGES: Record<string, string> = {
  OVERLAP: 'Pieces overlap',
  PORT_MISMATCH: "Rails don't align",
  PORT_NEAR_MISS: 'Almost connects — nudge to snap',
  UNKNOWN_PIECE: 'Unknown piece type',
};

export const INVENTORY_EXHAUSTED_MESSAGE = 'No more of this piece';

export function issueMessage(code: string): string {
  return VALIDATION_MESSAGES[code] ?? 'Invalid placement';
}
