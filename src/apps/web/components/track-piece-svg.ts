import type { Placement } from '@track-layout/connection-engine';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getPieceSprite } from '../rendering/piece-sprites.ts';

@customElement('track-piece-svg')
export class TrackPieceSvg extends LitElement {
  @property({ attribute: false })
  placement!: Placement;

  @property({ type: Boolean })
  ghost = false;

  @property({ type: Boolean })
  selected = false;

  @property({ type: Boolean })
  invalid = false;

  static override styles = css`
    :host {
      display: contents;
    }

    .footprint {
      fill: rgba(74, 74, 74, 0.12);
      stroke: none;
    }

    .footprint.ghost {
      fill: rgba(46, 125, 50, 0.15);
    }

    .footprint.invalid {
      fill: rgba(198, 40, 40, 0.12);
    }

    .rail {
      fill: none;
      stroke: var(--color-rail, #4a4a4a);
      stroke-width: 1.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .rail.ghost {
      stroke: var(--color-valid, #2e7d32);
      opacity: 0.7;
    }

    .rail.invalid {
      stroke: var(--color-invalid, #c62828);
    }

    .sleeper {
      stroke: var(--color-rail, #4a4a4a);
      stroke-width: 0.6;
      opacity: 0.5;
    }

    .selection-ring {
      fill: none;
      stroke: #1565c0;
      stroke-width: 0.3;
      stroke-dasharray: 1 0.5;
    }

    .invalid-ring {
      fill: none;
      stroke: var(--color-invalid, #c62828);
      stroke-width: 0.4;
    }
  `;

  override render() {
    const piece = CATALOGUE_V1.getById(this.placement.pieceId);
    const sprite = getPieceSprite(this.placement.pieceId);
    if (!piece || !sprite) {
      return nothing;
    }

    const { x, y, rotation } = this.placement;
    const transform = `translate(${x} ${y}) rotate(${rotation * 22.5})`;

    const sleeperLines = sprite.sleepers.map(
      (s) => html`
        <line
          class="sleeper"
          x1=${s.x - 2}
          y1=${s.y}
          x2=${s.x + 2}
          y2=${s.y}
          transform=${`rotate(${s.angle} ${s.x} ${s.y})`}
        />
      `,
    );

    const outlinePath = sprite.footprintPath;

    return html`
      <g class="piece" transform=${transform} data-instance-id=${this.placement.instanceId}>
        <path
          class="footprint ${this.ghost ? 'ghost' : ''} ${this.invalid ? 'invalid' : ''}"
          d=${outlinePath}
        />
        ${sleeperLines}
        <path
          class="rail ${this.ghost ? 'ghost' : ''} ${this.invalid ? 'invalid' : ''}"
          d=${sprite.railPath}
        />
        ${this.selected && !this.ghost
          ? html`<path class="selection-ring" d=${outlinePath} />`
          : nothing}
        ${this.invalid ? html`<path class="invalid-ring" d=${outlinePath} />` : nothing}
      </g>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'track-piece-svg': TrackPieceSvg;
  }
}
