import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { loadInventory } from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getState, initAppStore, subscribe } from '../state/app-store.ts';
import './inventory-settings.ts';

@customElement('editor-gate')
export class EditorGate extends LitElement {
  @state()
  private ready = false;

  @state()
  private counts: Record<string, number> = {};

  private unsubscribe: (() => void) | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    h1 {
      margin: 0;
    }

    .inventory-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .inventory-list li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #eee;
    }

    .inventory-list li:last-child {
      border-bottom: none;
    }

    .count {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    .stub-note {
      color: #555;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    initAppStore(loadInventory);

    const { inventory } = getState();
    if (!inventory) {
      const base = import.meta.env.BASE_URL;
      window.location.href = `${base}onboarding/`;
      return;
    }

    this.syncFromStore();
    this.ready = true;
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
    const { inventory } = getState();
    if (!inventory) {
      return;
    }
    this.counts = { ...inventory.counts };
  }

  override render() {
    if (!this.ready) {
      return html`<p>Loading…</p>`;
    }

    const pieces = CATALOGUE_V1.all();

    return html`
      <div class="header">
        <h1>Editor</h1>
        <inventory-settings></inventory-settings>
      </div>
      <p class="stub-note">Track editor coming in plan 05. Your inventory is loaded:</p>
      <ul class="inventory-list">
        ${pieces.map(
          (piece) => html`
            <li>
              <span>${piece.name}</span>
              <span class="count">${this.counts[piece.inventoryKey] ?? 0}</span>
            </li>
          `,
        )}
      </ul>
      <p><a href=${import.meta.env.BASE_URL}>Back to home</a></p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-gate': EditorGate;
  }
}
