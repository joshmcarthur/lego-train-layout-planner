import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-toolbar')
export class EditorToolbar extends LitElement {
  @property({ type: Boolean })
  canUndo = false;

  @property({ type: Boolean })
  canRedo = false;

  @property({ type: Number })
  zoom = 1;

  static override styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    button {
      padding: 0.4rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      background: #fff;
      font: inherit;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: #f5f5f5;
    }

    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    button:focus-visible {
      outline: 2px solid #1565c0;
      outline-offset: 2px;
    }

    .zoom-label {
      font-variant-numeric: tabular-nums;
      font-size: 0.875rem;
      color: #555;
      min-width: 3.5rem;
      text-align: center;
    }
  `;

  private dispatchAction(type: string): void {
    this.dispatchEvent(
      new CustomEvent('toolbar-action', {
        detail: { type },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const zoomPercent = Math.round(this.zoom * 100);

    return html`
      <button type="button" ?disabled=${!this.canUndo} @click=${() => this.dispatchAction('undo')}>
        Undo
      </button>
      <button type="button" ?disabled=${!this.canRedo} @click=${() => this.dispatchAction('redo')}>
        Redo
      </button>
      <span class="zoom-label">${zoomPercent}%</span>
      <button type="button" @click=${() => this.dispatchAction('zoom-out')} aria-label="Zoom out">
        −
      </button>
      <button type="button" @click=${() => this.dispatchAction('zoom-in')} aria-label="Zoom in">
        +
      </button>
      <button type="button" @click=${() => this.dispatchAction('zoom-reset')}>Reset zoom</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-toolbar': EditorToolbar;
  }
}
