import type { Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface InventoryShortfall {
  label: string;
  shortfall: number;
}

export function getInventoryShortfall(
  inventory: Inventory,
  layout: Layout,
): InventoryShortfall[] {
  const used: Record<string, number> = {};

  for (const placement of layout.placements) {
    const piece = CATALOGUE_V1.getById(placement.pieceId);
    if (!piece) {
      continue;
    }
    used[piece.inventoryKey] = (used[piece.inventoryKey] ?? 0) + 1;
  }

  const shortfalls: InventoryShortfall[] = [];
  for (const piece of CATALOGUE_V1.all()) {
    const have = inventory.counts[piece.inventoryKey] ?? 0;
    const need = used[piece.inventoryKey] ?? 0;
    if (need > have) {
      shortfalls.push({ label: piece.name, shortfall: need - have });
    }
  }

  return shortfalls;
}

@customElement('fork-banner')
export class ForkBanner extends LitElement {
  @property({ type: Boolean })
  forkMode = false;

  @property({ type: Boolean })
  catalogueMismatch = false;

  @property({ attribute: false })
  shortfalls: InventoryShortfall[] = [];

  static override styles = css`
    :host {
      display: block;
    }

    .banner {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #90caf9;
      background: #e3f2fd;
      color: #0d47a1;
    }

    .banner.warn {
      border-color: #ffcc80;
      background: #fff3e0;
      color: #e65100;
    }

    ul {
      margin: 0.5rem 0 0;
      padding-left: 1.25rem;
    }
  `;

  override render() {
    if (!this.forkMode && !this.catalogueMismatch) {
      return null;
    }

    return html`
      ${this.forkMode
        ? html`<div class="banner">Viewing a shared layout. Edit freely; save locally when ready.</div>`
        : null}
      ${this.catalogueMismatch
        ? html`<div class="banner warn">Layout saved with older track definitions.</div>`
        : null}
      ${this.shortfalls.length > 0
        ? html`<div class="banner warn">
            <strong>This layout uses more pieces than your inventory.</strong>
            <ul>
              ${this.shortfalls.map(
                (item) => html`<li>${item.label}: need ${item.shortfall} more</li>`,
              )}
            </ul>
          </div>`
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fork-banner': ForkBanner;
  }
}
