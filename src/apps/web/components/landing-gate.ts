import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { resolveEntryRoute } from '../state/bootstrap.ts';
import './resume-prompt.ts';

@customElement('landing-gate')
export class LandingGate extends LitElement {
  @state()
  private mode: 'loading' | 'resume' | 'landing' = 'loading';

  @state()
  private autosave: import('@track-layout/persistence').SerializedAppState | null =
    null;

  static override styles = css`
    :host {
      display: block;
    }

    .hero {
      margin-bottom: var(--space-4, 2rem);
    }

    h1 {
      margin-top: 0;
    }

    .intro {
      color: #444;
      max-width: 36rem;
    }

    .cta {
      margin-top: var(--space-3, 1.5rem);
    }

    .cta a {
      display: inline-flex;
      align-items: center;
      padding: 0.6rem 1.25rem;
      border-radius: 0.375rem;
      background: #1565c0;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
    }

    .cta a:hover {
      background: #0d47a1;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    const route = resolveEntryRoute();

    switch (route.kind) {
      case 'share':
        window.location.href = route.href;
        return;
      case 'onboarding': {
        const base = import.meta.env.BASE_URL;
        window.location.href = `${base}onboarding/`;
        return;
      }
      case 'editor': {
        const base = import.meta.env.BASE_URL;
        window.location.href = `${base}editor/`;
        return;
      }
      case 'resume':
        this.autosave = route.autosave;
        this.mode = 'resume';
        return;
      default: {
        const _exhaustive: never = route;
        return _exhaustive;
      }
    }
  }

  override render() {
    if (this.mode === 'loading') {
      return html`<p>Loading…</p>`;
    }

    const base = import.meta.env.BASE_URL;

    return html`
      <div class="hero">
        <h1>Plan your Lego train layout</h1>
        <p class="intro">
          Enter your track inventory, generate valid layouts automatically, or build
          them piece by piece in the editor. Save locally and share layouts with a
          link.
        </p>
      </div>
      ${this.mode === 'resume' && this.autosave
        ? html`<resume-prompt .autosave=${this.autosave}></resume-prompt>`
        : html`
            <div class="cta">
              <a href="${base}onboarding/">Get started</a>
            </div>
          `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'landing-gate': LandingGate;
  }
}
