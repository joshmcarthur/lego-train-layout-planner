import { buildRouteGraph, type Layout } from '@track-layout/connection-engine';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './layout-thumbnail.ts';

export interface CandidateCard {
  layout: Layout;
  index: number;
}

@customElement('layout-candidate-carousel')
export class LayoutCandidateCarousel extends LitElement {
  @property({ attribute: false })
  candidates: Layout[] = [];

  @property({ type: Number })
  selectedIndex: number | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    .carousel {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scroll-snap-type: x mandatory;
    }

    .card {
      flex: 0 0 min(16rem, 80vw);
      scroll-snap-align: start;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      padding: 0.75rem;
      background: #fff;
      display: grid;
      gap: 0.75rem;
    }

    .card.selected {
      border-color: #1565c0;
      box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.15);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;
      color: #444;
    }

    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 0.75rem;
      font-weight: 600;
    }

    button {
      padding: 0.45rem 0.75rem;
      border: 1px solid #1565c0;
      border-radius: 0.375rem;
      background: #1565c0;
      color: #fff;
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      background: #0d47a1;
    }

    button:focus-visible {
      outline: 2px solid #1565c0;
      outline-offset: 2px;
    }
  `;

  private isClosedLoop(layout: Layout): boolean {
    const graph = buildRouteGraph(layout, CATALOGUE_V1);
    return graph.closedComponents.length > 0;
  }

  private selectCandidate(index: number): void {
    this.dispatchEvent(
      new CustomEvent('candidate-select', {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private openInEditor(index: number): void {
    this.dispatchEvent(
      new CustomEvent('candidate-open', {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    if (this.candidates.length === 0) {
      return nothing;
    }

    return html`
      <div class="carousel" role="list">
        ${this.candidates.map((layout, index) => {
          const closed = this.isClosedLoop(layout);
          const selected = this.selectedIndex === index;

          return html`
            <article
              class="card ${selected ? 'selected' : ''}"
              role="listitem"
              @click=${() => this.selectCandidate(index)}
            >
              <layout-thumbnail .layout=${layout}></layout-thumbnail>
              <div class="meta">
                <span>${layout.placements.length} pieces</span>
                ${closed ? html`<span class="badge">Closed loop</span>` : nothing}
              </div>
              <button type="button" @click=${(e: Event) => {
                e.stopPropagation();
                this.openInEditor(index);
              }}>
                Open in editor
              </button>
            </article>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-candidate-carousel': LayoutCandidateCarousel;
  }
}
