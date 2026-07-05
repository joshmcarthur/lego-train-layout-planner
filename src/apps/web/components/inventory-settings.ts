import { createInventory } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  getState,
  hasLayoutInProgress,
  isAppStoreInitialized,
  setInventory,
  subscribe,
} from '../state/app-store.ts';
import { loadInventory } from '@track-layout/persistence';
import { focusFirstElement, trapFocus } from '../utils/focus-trap.ts';
import './inventory-form.ts';

@customElement('inventory-settings')
export class InventorySettings extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private counts: Record<string, number> = {};

  @state()
  private showWarning = false;

  @state()
  private saveWarning = '';

  private unsubscribe: (() => void) | null = null;
  private triggerElement: HTMLElement | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    dialog {
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      padding: 1.5rem;
      max-width: 36rem;
      width: calc(100% - 2rem);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.35);
    }

    .trigger {
      font: inherit;
      padding: 0.35rem 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
    }

    .warning {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      color: #5d4037;
    }

    .banner {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      color: #5d4037;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncFromStore();
    this.unsubscribe = subscribe(() => {
      this.syncFromStore();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private syncFromStore(): void {
    const stored = loadInventory();
    if (stored) {
      this.counts = { ...stored.counts };
    } else {
      const { inventory } = getState();
      if (inventory) {
        this.counts = { ...inventory.counts };
      }
    }
    this.showWarning = isAppStoreInitialized() && hasLayoutInProgress();
  }

  private openDialog(): void {
    this.triggerElement = this.renderRoot.querySelector('.trigger');
    this.open = true;
    this.saveWarning = '';
    this.syncFromStore();
  }

  private closeDialog(): void {
    this.open = false;
    this.triggerElement?.focus();
  }

  private handleDialogKeyDown = (event: KeyboardEvent): void => {
    const dialog = this.renderRoot.querySelector('dialog');
    if (dialog) {
      trapFocus(dialog, event);
    }
  };

  private handleDialogToggle(event: Event): void {
    const dialog = event.target as HTMLDialogElement;
    this.open = dialog.open;
  }

  private handleChange(event: CustomEvent<{ counts: Record<string, number> }>): void {
    this.counts = event.detail.counts;
  }

  private handleSubmit(event: CustomEvent<{ counts: Record<string, number> }>): void {
    const inventory = createInventory(event.detail.counts, CATALOGUE_V1);
    const result = setInventory(inventory);

    if (!result.ok) {
      this.saveWarning = 'Could not save; session only.';
    } else {
      this.saveWarning = '';
      this.closeDialog();
    }
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      const dialog = this.renderRoot.querySelector('dialog');
      if (!dialog) {
        return;
      }
      if (this.open && !dialog.open) {
        dialog.showModal();
        focusFirstElement(dialog);
      } else if (!this.open && dialog.open) {
        dialog.close();
      }
    }
  }

  override render() {
    return html`
      <button class="trigger" type="button" @click=${this.openDialog}>
        Inventory settings
      </button>
      <dialog @toggle=${this.handleDialogToggle} @keydown=${this.handleDialogKeyDown}>
        <div class="dialog-header">
          <h2>Edit inventory</h2>
          <button type="button" @click=${this.closeDialog}>Close</button>
        </div>
        ${this.showWarning
          ? html`
              <p class="warning" role="status">
                Changing inventory may make your current layout invalid.
              </p>
            `
          : nothing}
        ${this.saveWarning
          ? html`<p class="banner" role="status">${this.saveWarning}</p>`
          : nothing}
        <inventory-form
          .counts=${this.counts}
          submitLabel="Save"
          @inventory-change=${this.handleChange}
          @inventory-submit=${this.handleSubmit}
        ></inventory-form>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inventory-settings': InventorySettings;
  }
}
