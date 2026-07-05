import { clearAutosave } from '@track-layout/persistence';
import type { SerializedAppState } from '@track-layout/persistence';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('resume-prompt')
export class ResumePrompt extends LitElement {
  @property({ attribute: false })
  autosave!: SerializedAppState;

  static override styles = css`
    :host {
      display: block;
    }

    .card {
      padding: var(--space-3, 1.5rem);
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 28rem;
    }

    h2 {
      margin: 0 0 var(--space-2, 1rem);
      font-size: 1.25rem;
    }

    p {
      margin: 0 0 var(--space-3, 1.5rem);
      color: #444;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 0.5rem);
    }

    button,
    a.button {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font: inherit;
      cursor: pointer;
      text-decoration: none;
    }

    .primary {
      border: 1px solid #1565c0;
      background: #1565c0;
      color: #fff;
    }

    .primary:hover {
      background: #0d47a1;
    }

    .secondary {
      border: 1px solid #ccc;
      background: #fff;
      color: inherit;
    }

    .secondary:hover {
      background: #f5f5f5;
    }
  `;

  private base(): string {
    return import.meta.env.BASE_URL;
  }

  private handleStartFresh(): void {
    clearAutosave();
    window.location.href = `${this.base()}editor/`;
  }

  override render() {
    const pieceCount = this.autosave.layout.placements.length;
    const base = this.base();

    return html`
      <div class="card" data-testid="resume-prompt">
        <h2>Continue last session?</h2>
        <p>
          You have an autosaved layout with ${pieceCount}
          ${pieceCount === 1 ? 'piece' : 'pieces'} from your last visit.
        </p>
        <div class="actions">
          <a
            class="button primary"
            data-testid="resume-continue"
            href="${base}editor/"
          >
            Continue
          </a>
          <button
            type="button"
            class="secondary"
            data-testid="resume-start-fresh"
            @click=${this.handleStartFresh}
          >
            Start fresh
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'resume-prompt': ResumePrompt;
  }
}
