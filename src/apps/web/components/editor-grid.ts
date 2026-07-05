import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const STUD = 1;
const MAJOR_INTERVAL = 16;

@customElement('editor-grid')
export class EditorGrid extends LitElement {
  @property({ type: Number })
  minX = -32;

  @property({ type: Number })
  minY = -32;

  @property({ type: Number })
  maxX = 128;

  @property({ type: Number })
  maxY = 128;

  static override styles = css`
    :host {
      display: contents;
    }

    .grid-minor {
      stroke: var(--color-grid, #e8e8e8);
      stroke-width: 0.05;
    }

    .grid-major {
      stroke: #d0d0d0;
      stroke-width: 0.1;
    }
  `;

  override render() {
    const minorLines: unknown[] = [];
    const majorLines: unknown[] = [];

    for (let x = this.minX; x <= this.maxX; x++) {
      const isMajor = x % MAJOR_INTERVAL === 0;
      const line = html`<line
        class=${isMajor ? 'grid-major' : 'grid-minor'}
        x1=${x * STUD}
        y1=${this.minY * STUD}
        x2=${x * STUD}
        y2=${this.maxY * STUD}
      />`;
      if (isMajor) {
        majorLines.push(line);
      } else {
        minorLines.push(line);
      }
    }

    for (let y = this.minY; y <= this.maxY; y++) {
      const isMajor = y % MAJOR_INTERVAL === 0;
      const line = html`<line
        class=${isMajor ? 'grid-major' : 'grid-minor'}
        x1=${this.minX * STUD}
        y1=${y * STUD}
        x2=${this.maxX * STUD}
        y2=${y * STUD}
      />`;
      if (isMajor) {
        majorLines.push(line);
      } else {
        minorLines.push(line);
      }
    }

    return html`${minorLines} ${majorLines}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-grid': EditorGrid;
  }
}
