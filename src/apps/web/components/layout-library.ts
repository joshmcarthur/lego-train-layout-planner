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

    .panel {
      margin-top: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      overflow: hidden;
      min-width: 16rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: grid;
      gap: 0.35rem;
      padding: 0.75rem 1rem;
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
      padding: 0.75rem 1rem;
      color: #666;
      font-size: 0.875rem;
    }
  `;

  private refresh(): void {
    this.entries = listLayouts();
  }

  private toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.refresh();
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
    this.open = false;
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
      <button type="button" @click=${this.toggle}>Library</button>
      ${this.open
        ? html`<div class="panel">
            ${this.entries.length === 0
              ? html`<div class="empty">No saved layouts yet.</div>`
              : html`<ul>
                  ${this.entries.map(
                    (entry) => html`<li>
                      <strong>${entry.name}</strong>
                      <div class="meta">${new Date(entry.updatedAt).toLocaleString()}</div>
                      <div class="row-actions">
                        <button type="button" @click=${() => this.openLayout(entry.id)}>Open</button>
                        <button type="button" @click=${() => this.duplicateLayout(entry.id)}>
                          Duplicate
                        </button>
                        <button type="button" @click=${() => this.removeLayout(entry.id)}>Delete</button>
                      </div>
                    </li>`,
                  )}
                </ul>`}
          </div>`
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-library': LayoutLibrary;
  }
}
