import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { redirectIfShareUrl } from '../state/bootstrap.ts';

@customElement('share-redirect-gate')
export class ShareRedirectGate extends LitElement {
  @state()
  private redirecting = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.redirecting = redirectIfShareUrl();
  }

  override render() {
    return this.redirecting ? html`<p>Loading shared layout…</p>` : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'share-redirect-gate': ShareRedirectGate;
  }
}
