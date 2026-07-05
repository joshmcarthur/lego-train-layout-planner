import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import type { Inventory } from '@track-layout/inventory';
import { createSerializedAppState, saveLayout, type SavedLayoutIndex } from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { adoptForkInventory, clearForkMode, getState } from '../state/app-store.ts';

@customElement('save-load-menu')
export class SaveLoadMenu extends LitElement {
  @state()
  private open = false;

  @state()
  private name = '';

  @state()
  private message = '';

  @state()
  private showInventoryPrompt = false;

  private pendingName = '';

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

    .dialog {
      margin-top: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      background: #fafafa;
      display: grid;
      gap: 0.5rem;
      max-width: 20rem;
    }

    label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    input {
      font: inherit;
      padding: 0.35rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .message {
      font-size: 0.875rem;
      color: #2e7d32;
    }

    .prompt {
      margin-top: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      background: #fff;
    }
  `;

  private defaultName(): string {
    return new Date().toISOString();
  }

  private openDialog(): void {
    this.name = this.defaultName();
    this.open = true;
    this.message = '';
    this.showInventoryPrompt = false;
  }

  private handleSave(): void {
    const { storedInventory, forkMode, forkSourceInventory } = getState();
    if (!storedInventory) {
      return;
    }

    if (forkMode && forkSourceInventory) {
      this.showInventoryPrompt = true;
      this.pendingName = this.name.trim() || this.defaultName();
      return;
    }

    this.persistSave(this.name.trim() || this.defaultName(), storedInventory);
  }

  private persistSave(name: string, inventory: Inventory): void {
    const { layout } = getState();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const index: SavedLayoutIndex = { id, name, updatedAt: now };
    const state = createSerializedAppState(layout, {
      catalogueVersion: CATALOGUE_VERSION,
      inventory,
      meta: { name, createdAt: now },
    });

    const result = saveLayout(index, state);
    if (!result.ok) {
      this.message = result.reason === 'quota' ? 'Storage full' : 'Could not save';
      return;
    }

    clearForkMode();
    this.message = 'Layout saved';
    this.open = false;
    this.showInventoryPrompt = false;
    this.dispatchEvent(new CustomEvent('layout-saved', { bubbles: true, composed: true }));
  }

  private handleKeepInventory(): void {
    const stored = getState().storedInventory;
    if (!stored) {
      return;
    }
    clearForkMode();
    this.persistSave(this.pendingName, stored);
  }

  private handleAdoptInventory(): void {
    adoptForkInventory();
    const stored = getState().storedInventory;
    if (!stored) {
      return;
    }
    this.persistSave(this.pendingName, stored);
  }

  override render() {
    return html`
      <button type="button" @click=${this.openDialog}>Save layout</button>
      ${this.open
        ? html`<div class="dialog">
            <label>
              Name
              <input
                .value=${this.name}
                @input=${(event: Event) => {
                  this.name = (event.target as HTMLInputElement).value;
                }}
              />
            </label>
            <div class="actions">
              <button type="button" @click=${this.handleSave}>Save</button>
              <button
                type="button"
                @click=${() => {
                  this.open = false;
                }}
              >
                Cancel
              </button>
            </div>
          </div>`
        : null}
      ${this.showInventoryPrompt
        ? html`<div class="prompt">
            <p>Keep your inventory or adopt this layout's inventory?</p>
            <div class="actions">
              <button type="button" @click=${this.handleKeepInventory}>Keep yours</button>
              <button type="button" @click=${this.handleAdoptInventory}>Adopt layout inventory</button>
            </div>
          </div>`
        : null}
      ${this.message ? html`<div class="message">${this.message}</div>` : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'save-load-menu': SaveLoadMenu;
  }
}
