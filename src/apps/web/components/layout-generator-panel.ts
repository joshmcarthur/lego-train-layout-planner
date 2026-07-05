import type { Layout } from '@track-layout/connection-engine';
import type { Inventory } from '@track-layout/inventory';
import { CATALOGUE_VERSION } from '@track-layout/piece-catalogue';
import {
  createSerializedAppState,
  forkLayout,
  loadInventory,
  saveAutosave,
} from '@track-layout/persistence';
import {
  defaultGeneratorOptions,
  type WorkerDoneMessage,
  type WorkerProgressMessage,
  type WorkerRequest,
} from '@track-layout/layout-generator';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './layout-candidate-carousel.ts';

type SearchPhase = 'idle' | 'running' | 'done';

@customElement('layout-generator-panel')
export class LayoutGeneratorPanel extends LitElement {
  @state()
  private phase: SearchPhase = 'idle';

  @state()
  private preferClosedLoops = true;

  @state()
  private explored = 0;

  @state()
  private found = 0;

  @state()
  private candidates: Layout[] = [];

  @state()
  private message = '';

  @state()
  private exhausted = false;

  @state()
  private selectedIndex: number | null = null;

  private worker: Worker | null = null;
  private inventory: Inventory | null = null;

  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      margin-top: 0;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
    }

    button {
      padding: 0.45rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      background: #fff;
      font: inherit;
      cursor: pointer;
    }

    button.primary {
      background: #1565c0;
      border-color: #1565c0;
      color: #fff;
    }

    button:hover:not(:disabled) {
      filter: brightness(0.97);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .progress {
      margin: 1rem 0;
    }

    .progress-bar {
      height: 0.5rem;
      background: #eee;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #1565c0;
      transition: width 0.2s ease;
    }

    .progress-text {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #555;
    }

    .empty {
      margin: 2rem 0;
      padding: 2rem;
      border: 1px dashed #ccc;
      border-radius: 0.5rem;
      text-align: center;
      color: #555;
      background: #fafafa;
    }

    .empty h2 {
      margin-top: 0;
      color: #333;
    }

    .nav-links {
      margin-top: 1.5rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .nav-links a {
      color: #1565c0;
    }

    .partial-note {
      margin: 0.75rem 0 0;
      font-size: 0.875rem;
      color: #6d4c41;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.inventory = loadInventory();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.terminateWorker();
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' } satisfies WorkerRequest);
      this.worker.terminate();
      this.worker = null;
    }
  }

  private startSearch(): void {
    if (!this.inventory || this.phase === 'running') {
      return;
    }

    this.terminateWorker();
    this.phase = 'running';
    this.explored = 0;
    this.found = 0;
    this.candidates = [];
    this.message = '';
    this.exhausted = false;
    this.selectedIndex = null;

    const workerUrl = new URL('../../../packages/layout-generator/worker.ts', import.meta.url);
    this.worker = new Worker(workerUrl, { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<WorkerProgressMessage | WorkerDoneMessage>) => {
      const data = event.data;
      if (data.status === 'progress') {
        this.explored = data.explored;
        this.found = data.found;
        return;
      }

      this.phase = 'done';
      this.candidates = data.candidates;
      this.exhausted = data.exhausted;
      this.message = data.message ?? '';
      this.explored = data.explored;
      this.found = data.candidates.length;
      this.terminateWorker();
    };

    this.worker.onerror = () => {
      this.phase = 'done';
      this.message = 'Generation failed';
      this.terminateWorker();
    };

    const options = defaultGeneratorOptions({
      preferClosedLoops: this.preferClosedLoops,
      seed: Date.now(),
    });

    this.worker.postMessage({
      type: 'search',
      inventory: this.inventory,
      options,
    } satisfies WorkerRequest);
  }

  private cancelSearch(): void {
    this.terminateWorker();
    this.phase = 'done';
    this.exhausted = true;
  }

  private handleCandidateSelect(event: CustomEvent<{ index: number }>): void {
    this.selectedIndex = event.detail.index;
  }

  private handleCandidateOpen(event: CustomEvent<{ index: number }>): void {
    const layout = this.candidates[event.detail.index];
    if (!layout || !this.inventory) {
      return;
    }

    const forked = forkLayout(layout);
    saveAutosave(
      createSerializedAppState(forked, {
        catalogueVersion: CATALOGUE_VERSION,
        inventory: this.inventory,
      }),
    );

    const base = import.meta.env.BASE_URL;
    window.location.href = `${base}editor/`;
  }

  private progressPercent(): number {
    if (this.phase !== 'running') {
      return this.phase === 'done' ? 100 : 0;
    }
    return Math.min(99, Math.round((this.explored / 50000) * 100));
  }

  override render() {
    const base = import.meta.env.BASE_URL;

    return html`
      <h1>Generate layouts</h1>
      <p>Search for valid track layouts from your inventory.</p>

      <div class="controls">
        <label>
          <input
            type="checkbox"
            .checked=${this.preferClosedLoops}
            ?disabled=${this.phase === 'running'}
            @change=${(e: Event) => {
              this.preferClosedLoops = (e.target as HTMLInputElement).checked;
            }}
          />
          Prefer closed loops
        </label>
        <button
          type="button"
          class="primary"
          ?disabled=${this.phase === 'running'}
          @click=${this.startSearch}
        >
          ${this.phase === 'running' ? 'Generating…' : 'Generate'}
        </button>
        ${this.phase === 'running'
          ? html`<button type="button" @click=${this.cancelSearch}>Cancel</button>`
          : nothing}
      </div>

      ${this.phase === 'running'
        ? html`
            <div class="progress" role="status" aria-live="polite">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.progressPercent()}%"></div>
              </div>
              <p class="progress-text">Explored ${this.explored} configurations</p>
            </div>
          `
        : nothing}

      ${this.phase === 'done' && this.candidates.length > 0
        ? html`
            <layout-candidate-carousel
              .candidates=${this.candidates}
              .selectedIndex=${this.selectedIndex}
              @candidate-select=${this.handleCandidateSelect}
              @candidate-open=${this.handleCandidateOpen}
            ></layout-candidate-carousel>
            ${this.exhausted
              ? html`<p class="partial-note">Search stopped early — partial results shown.</p>`
              : nothing}
          `
        : nothing}

      ${this.phase === 'done' && this.candidates.length === 0
        ? html`
            <div class="empty">
              <h2>No layouts found</h2>
              <p>
                ${this.message ||
                'No valid layout could be found for this inventory within the search limits.'}
              </p>
              <p>
                Layout generation is combinatorially hard — try adding more pieces, using a
                random inventory preset, or building manually in the editor.
              </p>
              <div class="nav-links">
                <a href="${base}onboarding/">Edit inventory</a>
                <a href="${base}editor/">Open editor</a>
              </div>
            </div>
          `
        : nothing}

      <div class="nav-links">
        <a href="${base}editor/">Back to editor</a>
        <a href="${base}onboarding/">Inventory settings</a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-generator-panel': LayoutGeneratorPanel;
  }
}
