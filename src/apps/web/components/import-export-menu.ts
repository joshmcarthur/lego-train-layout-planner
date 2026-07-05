import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import {
  createSerializedAppState,
  exportJsonFile,
  importJsonFile,
} from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getState, loadEditorSession } from '../state/app-store.ts';

@customElement('import-export-menu')
export class ImportExportMenu extends LitElement {
  @state()
  private message = '';

  static override styles = css`
    .group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    button,
    label.button {
      padding: 0.4rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      background: #fff;
      font: inherit;
      cursor: pointer;
      display: inline-block;
    }

    button:hover,
    label.button:hover {
      background: #f5f5f5;
    }

    input[type='file'] {
      display: none;
    }

    .message {
      font-size: 0.875rem;
      color: #2e7d32;
      margin-top: 0.35rem;
    }
  `;

  private handleExport(): void {
    const { layout, storedInventory } = getState();
    const state = createSerializedAppState(layout, {
      catalogueVersion: CATALOGUE_VERSION,
      inventory: storedInventory ?? undefined,
      meta: { name: 'export', createdAt: new Date().toISOString() },
    });
    exportJsonFile(state, 'layout.json');
    this.message = 'Download started';
  }

  private async handleImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const imported = await importJsonFile(file);
    if (!imported) {
      this.message = 'Invalid layout file';
      return;
    }

    loadEditorSession(imported.layout, {
      catalogueMismatch: imported.catalogueVersion !== CATALOGUE_VERSION,
    });
    this.message = 'Layout imported';
    this.dispatchEvent(new CustomEvent('layout-imported', { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="group">
        <button type="button" @click=${this.handleExport}>Export JSON</button>
        <label class="button">
          Import JSON
          <input type="file" accept="application/json,.json" @change=${this.handleImport} />
        </label>
      </div>
      ${this.message ? html`<div class="message">${this.message}</div>` : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'import-export-menu': ImportExportMenu;
  }
}
