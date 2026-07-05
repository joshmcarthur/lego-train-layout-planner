import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { bootstrapEditor } from '../state/bootstrap.ts';
import { getState, initAppStore } from '../state/app-store.ts';
import './layout-editor.ts';

@customElement('editor-gate')
export class EditorGate extends LitElement {
  private ready = false;

  static override styles = css`
    :host {
      display: block;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    initAppStore(bootstrapEditor());

    const { inventory } = getState();
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

    return html`<layout-editor></layout-editor>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-gate': EditorGate;
  }
}
