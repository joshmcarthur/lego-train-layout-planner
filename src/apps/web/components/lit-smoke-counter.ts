import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('lit-smoke-counter')
export class LitSmokeCounter extends LitElement {
  @state()
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

  private increment(): void {
    this.count += 1;
  }

  override render() {
    return html`
      <p>Count: ${this.count}</p>
      <button type="button" @click=${this.increment}>Increment</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-smoke-counter': LitSmokeCounter;
  }
}
