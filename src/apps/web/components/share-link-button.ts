import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import {
  copyJsonToClipboard,
  createSerializedAppState,
  encodeShareUrl,
  exportJsonFile,
} from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getState } from '../state/app-store.ts';

@customElement('share-link-button')
export class ShareLinkButton extends LitElement {
  @state()
  private message = '';

  @state()
  private showModal = false;

  static override styles = css`
    button {
      padding: 0.4rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      background: #fff;
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      background: #f5f5f5;
    }

    .toast {
      position: fixed;
      right: 1.5rem;
      bottom: 1.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: #1b5e20;
      color: #fff;
      font-size: 0.875rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 1001;
    }

    .toast.error {
      background: #b71c1c;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      padding: 1.25rem;
      border-radius: 0.5rem;
      max-width: 24rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `;

  private buildShareState() {
    const { layout, storedInventory } = getState();
    return createSerializedAppState(layout, {
      catalogueVersion: CATALOGUE_VERSION,
      inventory: storedInventory ?? undefined,
    });
  }

  private async handleShare(): Promise<void> {
    const state = this.buildShareState();
    const base = import.meta.env.BASE_URL;
    const editorPath = `${window.location.origin}${base}editor/`;
    const result = encodeShareUrl(state, editorPath);

    if (result.tooLong) {
      this.showModal = true;
      return;
    }

    try {
      await navigator.clipboard.writeText(result.url);
      this.message = 'Link copied';
    } catch {
      this.message = 'Could not copy link';
    }
    window.setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  private async handleExportFromModal(): Promise<void> {
    const state = this.buildShareState();
    try {
      await copyJsonToClipboard(state);
      exportJsonFile(state, 'layout.json');
      this.message = 'JSON copied and download started';
    } catch {
      exportJsonFile(state, 'layout.json');
      this.message = 'Download started';
    }
    this.showModal = false;
  }

  override render() {
    return html`
      <button type="button" @click=${this.handleShare}>Share link</button>
      ${this.message
        ? html`<div class="toast ${this.message === 'Could not copy link' ? 'error' : ''}" role="status">
            ${this.message}
          </div>`
        : null}
      ${this.showModal
        ? html`<div class="modal-backdrop" @click=${() => {
            this.showModal = false;
          }}>
            <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
              <p>URL too long; share file instead.</p>
              <div class="modal-actions">
                <button type="button" @click=${this.handleExportFromModal}>Export JSON</button>
                <button type="button" @click=${() => {
                  this.showModal = false;
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>`
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'share-link-button': ShareLinkButton;
  }
}
