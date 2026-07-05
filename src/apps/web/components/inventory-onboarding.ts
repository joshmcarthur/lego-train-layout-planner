import { createEmptyInventory, createInventory } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { initAppStoreFromInventory, setInventory } from '../state/app-store.ts';
import './inventory-form.ts';

@customElement('inventory-onboarding')
export class InventoryOnboarding extends LitElement {
  @state()
  private counts: Record<string, number> = createEmptyInventory(CATALOGUE_V1).counts;

  @state()
  private saveWarning = '';

  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      margin-top: 0;
    }

    .intro {
      margin-bottom: 1.5rem;
      color: #444;
    }

    .banner {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      color: #5d4037;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    initAppStoreFromInventory(() => null);
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
    }

    const base = import.meta.env.BASE_URL;
    window.location.href = `${base}editor/`;
  }

  override render() {
    return html`
      <h1>Your track inventory</h1>
      <p class="intro">
        Enter how many of each track piece you have. You can use a random preset and
        adjust the counts before continuing.
      </p>
      ${this.saveWarning
        ? html`<p class="banner" role="status">${this.saveWarning}</p>`
        : nothing}
      <inventory-form
        .counts=${this.counts}
        @inventory-change=${this.handleChange}
        @inventory-submit=${this.handleSubmit}
      ></inventory-form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inventory-onboarding': InventoryOnboarding;
  }
}
