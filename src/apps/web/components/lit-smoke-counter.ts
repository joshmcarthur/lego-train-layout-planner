import { LitElement, css, html } from 'lit';

export class LitSmokeCounter extends LitElement {
  private count = 0;

  static override styles = css`
    :host {
      display: block;
      margin-top: 1rem;
    }

    button {
      margin-left: 0.5rem;
      padding: 0.25rem 0.75rem;
      cursor: pointer;
    }
  `;

  private increment = (): void => {
    this.count += 1;
    this.requestUpdate();
  };

  override render() {
    return html`
      <p>Count: ${this.count}</p>
      <button type="button" @click=${this.increment}>Increment</button>
    `;
  }
}

customElements.define('lit-smoke-counter', LitSmokeCounter);

declare global {
  interface HTMLElementTagNameMap {
    'lit-smoke-counter': LitSmokeCounter;
  }
}
