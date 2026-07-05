import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import {
  deleteLayout,
  forkLayout,
  listLayouts,
  loadLayout,
  saveLayout,
  type SavedLayoutIndex,
} from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { loadEditorSession } from '../state/app-store.ts';

@customElement('layout-library')
export class LayoutLibrary extends LitElement {
  @state()
  private open = false;

  @state()
  private entries: SavedLayoutIndex[] = [];

  static override styles = css`
    :host {
      display: block;
    }

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

    dialog {
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      padding: 0;
      max-width: 28rem;
      width: calc(100% - 2rem);
      overflow: hidden;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.35);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #eee;
    }

    h2 {
      margin: 0;
      font-size: 1.125rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 24rem;
      overflow: auto;
    }

    li {
      display: grid;
      gap: 0.35rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #eee;
    }

    li:last-child {
      border-bottom: none;
    }

    .meta {
      font-size: 0.8rem;
      color: #666;
    }

    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .empty {
      padding: 1.25rem;
      color: #666;
      font-size: 0.875rem;
    }
  `;

  private refresh(): void {
    this.entries = listLayouts();
  }

  private openDialog(): void {
    this.open = true;
    this.refresh();
  }

  private closeDialog(): void {
    this.open = false;
  }

  private handleDialogToggle(event: Event): void {
    const dialog = event.target as HTMLDialogElement;
    this.open = dialog.open;
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      const dialog = this.renderRoot.querySelector('dialog');
      if (!dialog) {
        return;
      }
      if (this.open && !dialog.open) {
        dialog.showModal();
      } else if (!this.open && dialog.open) {
        dialog.close();
      }
    }
  }

  private openLayout(id: string): void {
    const saved = loadLayout(id);
    if (!saved) {
      return;
    }
    loadEditorSession(saved.layout, {
      catalogueMismatch: saved.catalogueVersion !== CATALOGUE_VERSION,
    });
    this.closeDialog();
    this.dispatchEvent(new CustomEvent('layout-opened', { bubbles: true, composed: true }));
  }

  private duplicateLayout(id: string): void {
    const saved = loadLayout(id);
    if (!saved) {
      return;
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const name = saved.meta?.name ? `${saved.meta.name} (copy)` : `Copy ${now}`;
    const index: SavedLayoutIndex = { id: newId, name, updatedAt: now };
    const forked = {
      ...saved,
      layout: forkLayout(saved.layout),
      meta: { name, createdAt: now },
    };

    saveLayout(index, forked);
    this.refresh();
  }

  private removeLayout(id: string): void {
    deleteLayout(id);
    this.refresh();
  }

  override render() {
    return html`
      <button type="button" @click=${this.openDialog}>Library</button>
      <dialog @toggle=${this.handleDialogToggle}>
        <div class="dialog-header">
          <h2>Saved layouts</h2>
          <button type="button" @click=${this.closeDialog}>Close</button>
        </div>
        ${this.entries.length === 0
          ? html`<div class="empty">No saved layouts yet.</div>`
          : html`<ul>
              ${this.entries.map(
                (entry) => html`<li>
                  <strong>${entry.name}</strong>
                  <div class="meta">${new Date(entry.updatedAt).toLocaleString()}</div>
                  <div class="row-actions">
                    <button type="button" @click=${() => this.openLayout(entry.id)}>Open</button>
                    <button type="button" @click=${() => this.duplicateLayout(entry.id)}>Duplicate</button>
                    <button type="button" @click=${() => this.removeLayout(entry.id)}>Delete</button>
                  </div>
                </li>`,
              )}
            </ul>`}
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-library': LayoutLibrary;
  }
}
