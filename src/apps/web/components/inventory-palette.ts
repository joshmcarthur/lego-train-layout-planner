import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('inventory-palette')
export class InventoryPalette extends LitElement {
  @property({ attribute: false })
  remaining: Record<string, number> = {};

  @property({ type: String })
  selectedPieceId: string | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    .palette {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .palette-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border: 2px solid #ddd;
      border-radius: 0.5rem;
      background: #fff;
      cursor: pointer;
      text-align: left;
      font: inherit;
      color: inherit;
      width: 100%;
    }

    .palette-item:hover:not(:disabled) {
      border-color: #90caf9;
      background: #f5f9ff;
    }

    .palette-item.selected {
      border-color: #1565c0;
      background: #e3f2fd;
    }

    .palette-item:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .badge {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      min-width: 1.75rem;
      text-align: center;
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      background: #eee;
      font-size: 0.85rem;
    }

    .palette-item.selected .badge {
      background: #1565c0;
      color: #fff;
    }

    h2 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
    }
  `;

  private handleSelect(pieceId: string): void {
    this.dispatchEvent(
      new CustomEvent('piece-select', {
        detail: { pieceId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const pieces = CATALOGUE_V1.all();

    return html`
      <h2>Pieces</h2>
      <ul class="palette">
        ${pieces.map((piece) => {
          const count = this.remaining[piece.inventoryKey] ?? 0;
          const selected = this.selectedPieceId === piece.id;
          return html`
            <li>
              <button
                type="button"
                class="palette-item ${selected ? 'selected' : ''}"
                data-testid="palette-${piece.id}"
                ?disabled=${count === 0}
                aria-pressed=${selected}
                @click=${() => this.handleSelect(piece.id)}
              >
                <span>${piece.name}</span>
                <span class="badge">${count}</span>
              </button>
            </li>
          `;
        })}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inventory-palette': InventoryPalette;
  }
}
