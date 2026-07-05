import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface OpenEndMarker {
  x: number;
  y: number;
}

@customElement('validation-overlay')
export class ValidationOverlay extends LitElement {
  @property({ attribute: false })
  openEnds: OpenEndMarker[] = [];

  @property({ type: String })
  tooltipMessage = '';

  @property({ type: Number })
  tooltipX = 0;

  @property({ type: Number })
  tooltipY = 0;

  static override styles = css`
    :host {
      display: contents;
    }

    .open-end {
      fill: #9e9e9e;
      stroke: #fff;
      stroke-width: 0.15;
    }

    .tooltip {
      pointer-events: none;
    }

    .tooltip-bg {
      fill: #1a1a1a;
      opacity: 0.9;
      rx: 0.5;
    }

    .tooltip-text {
      fill: #fff;
      font-size: 2.5px;
      font-family: system-ui, sans-serif;
    }
  `;

  override render() {
    return html`
      ${this.openEnds.map(
        (marker) => html`
          <circle class="open-end" cx=${marker.x} cy=${marker.y} r=${0.6} />
        `,
      )}
      ${this.tooltipMessage
        ? html`
            <g class="tooltip" transform="translate(${this.tooltipX} ${this.tooltipY})">
              <rect
                class="tooltip-bg"
                x="-1"
                y="-4"
                width=${this.tooltipMessage.length * 1.4 + 2}
                height="5"
              />
              <text class="tooltip-text" x="0" y="-1">${this.tooltipMessage}</text>
            </g>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'validation-overlay': ValidationOverlay;
  }
}
