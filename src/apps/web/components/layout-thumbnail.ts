import { getWorldOccupancy, type Layout } from '@track-layout/connection-engine';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './track-piece-svg.ts';

const PADDING = 4;

function layoutBounds(layout: Layout): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const placement of layout.placements) {
    const cells = getWorldOccupancy(placement, CATALOGUE_V1);
    for (const cell of cells) {
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x + 1);
      maxY = Math.max(maxY, cell.y + 1);
    }
  }

  if (!Number.isFinite(minX)) {
    return { minX: -8, minY: -8, maxX: 24, maxY: 24 };
  }

  return {
    minX: minX - PADDING,
    minY: minY - PADDING,
    maxX: maxX + PADDING,
    maxY: maxY + PADDING,
  };
}

@customElement('layout-thumbnail')
export class LayoutThumbnail extends LitElement {
  @property({ attribute: false })
  layout!: Layout;

  static override styles = css`
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      background: #fafafa;
      border-radius: 0.375rem;
    }
  `;

  override render() {
    const { minX, minY, maxX, maxY } = layoutBounds(this.layout);
    const width = maxX - minX;
    const height = maxY - minY;

    return html`
      <svg
        viewBox="${minX} ${minY} ${width} ${height}"
        role="img"
        aria-label="Layout thumbnail, ${this.layout.placements.length} pieces"
      >
        <g transform="translate(0 0)">
          ${this.layout.placements.map(
            (placement) => html`
              <track-piece-svg .placement=${placement}></track-piece-svg>
            `,
          )}
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-thumbnail': LayoutThumbnail;
  }
}
