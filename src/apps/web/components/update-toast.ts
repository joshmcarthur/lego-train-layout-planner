import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { registerSW } from 'virtual:pwa-register';

@customElement('update-toast')
export class UpdateToast extends LitElement {
  @state()
  private show = false;

  private updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

  static override styles = css`
    :host {
      display: contents;
    }

    .toast {
      position: fixed;
      right: var(--space-3, 1.5rem);
      bottom: var(--space-3, 1.5rem);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2, 1rem);
      padding: var(--space-2, 1rem) var(--space-3, 1.5rem);
      border-radius: 0.5rem;
      background: #1a1a1a;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 1100;
      max-width: calc(100vw - 3rem);
    }

    button {
      font: inherit;
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #fff;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }

    button:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateSW = registerSW({
      onNeedRefresh: () => {
        this.show = true;
      },
    });
  }

  private handleRefresh(): void {
    void this.updateSW?.(true);
  }

  private handleDismiss(): void {
    this.show = false;
  }

  override render() {
    if (!this.show) {
      return null;
    }

    return html`
      <div class="toast" role="status" aria-live="polite" data-testid="update-toast">
        <span>Update available — refresh</span>
        <button type="button" @click=${this.handleRefresh}>Refresh</button>
        <button type="button" @click=${this.handleDismiss}>Dismiss</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'update-toast': UpdateToast;
  }
}
