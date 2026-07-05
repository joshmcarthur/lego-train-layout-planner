import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('mobile-editor-banner')
export class MobileEditorBanner extends LitElement {
  @property({ type: Boolean, reflect: true })
  visible = false;

  static override styles = css`
    :host {
      display: block;
    }

    :host(:not([visible])) {
      display: none;
    }

    .banner {
      margin: 0 0 var(--space-2, 1rem);
      padding: var(--space-2, 1rem);
      border-radius: 0.5rem;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      color: #0d47a1;
      font-size: 0.9375rem;
    }
  `;

  override render() {
    if (!this.visible) {
      return nothing;
    }

    return html`
      <div class="banner" role="status" data-testid="mobile-editor-banner">
        Editing is best on desktop. You can still view and share layouts.
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-editor-banner': MobileEditorBanner;
  }
}
