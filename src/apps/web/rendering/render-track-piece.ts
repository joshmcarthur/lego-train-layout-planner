import type { Placement } from '@track-layout/connection-engine';
import { nothing, svg } from 'lit';

import { getPieceSprite } from './piece-sprites.ts';

export interface RenderPieceOptions {
  ghost?: boolean;
  selected?: boolean;
  invalid?: boolean;
}

export function renderTrackPiece(placement: Placement, options: RenderPieceOptions = {}) {
  const sprite = getPieceSprite(placement.pieceId);
  if (!sprite) {
    return nothing;
  }

  const { ghost = false, selected = false, invalid = false } = options;
  const { x, y, rotation } = placement;
  const transform = `translate(${x} ${y}) rotate(${rotation * 22.5})`;
  const outlinePath = sprite.footprintPath;

  const footprintClass = [
    'footprint',
    ghost ? 'ghost' : '',
    invalid ? 'invalid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const railClass = ['rail', ghost ? 'ghost' : '', invalid ? 'invalid' : '']
    .filter(Boolean)
    .join(' ');

  return svg`
    <g class="piece" transform=${transform} data-instance-id=${placement.instanceId}>
      <path class=${footprintClass} d=${outlinePath} />
      ${sprite.sleepers.map(
        (s) => svg`
          <line
            class="sleeper"
            x1=${s.x - 2}
            y1=${s.y}
            x2=${s.x + 2}
            y2=${s.y}
            transform=${`rotate(${s.angle} ${s.x} ${s.y})`}
          />
        `,
      )}
      <path class=${railClass} d=${sprite.railPath} />
      ${selected && !ghost ? svg`<path class="selection-ring" d=${outlinePath} />` : nothing}
      ${invalid ? svg`<path class="invalid-ring" d=${outlinePath} />` : nothing}
    </g>
  `;
}
