import { loadInventory } from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import './layout-generator-panel.ts';

@customElement('generator-gate')
export class GeneratorGate extends LitElement {
  private ready = false;

  static override styles = css`
    :host {
      display: block;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();

    const inventory = loadInventory();
    if (!inventory) {
      const base = import.meta.env.BASE_URL;
      window.location.href = `${base}onboarding/`;
      return;
    }

    this.ready = true;
    this.requestUpdate();
  }

  override render() {
    if (!this.ready) {
      return html`<p>Loading…</p>`;
    }

    return html`<layout-generator-panel></layout-generator-panel>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'generator-gate': GeneratorGate;
  }
}
