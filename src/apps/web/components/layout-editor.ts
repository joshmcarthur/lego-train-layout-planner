import { validateLayout } from '@track-layout/connection-engine';
import { getRemainingCounts } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getInventoryShortfall } from './fork-banner.ts';
import { getState, getSessionEpoch, setLayout, subscribe } from '../state/app-store.ts';
import {
  createEditorState,
  editorReducer,
  previewPlacement,
  type EditorState,
} from '../state/editor-reducer.ts';
import './editor-canvas.ts';
import './editor-toolbar.ts';
import './fork-banner.ts';
import './import-export-menu.ts';
import './inventory-palette.ts';
import './layout-library.ts';
import './mobile-editor-banner.ts';
import './save-load-menu.ts';
import './share-link-button.ts';

@customElement('layout-editor')
export class LayoutEditor extends LitElement {
  @state()
  private editorState: EditorState | null = null;

  @state()
  private remaining: Record<string, number> = {};

  @state()
  private ghostPlacement: ReturnType<typeof previewPlacement> = null;

  @state()
  private spaceHeld = false;

  @state()
  private mobileView = false;

  private unsubscribe: (() => void) | null = null;
  private sessionEpoch = 0;
  private mobileQuery: MediaQueryList | null = null;

  private handleMobileChange = (event: MediaQueryListEvent): void => {
    this.mobileView = event.matches;
  };

  static override styles = css`
    :host {
      display: block;
      outline: none;
    }

    :host:focus-visible {
      outline: 2px solid #1565c0;
      outline-offset: 4px;
      border-radius: 0.25rem;
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2, 1rem);
      margin-bottom: var(--space-2, 1rem);
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 0.5rem);
      align-items: flex-start;
    }

    h1 {
      margin: 0;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(12rem, 14rem) 1fr;
      gap: var(--space-2, 1rem);
      align-items: start;
    }

    .workspace.mobile {
      grid-template-columns: 1fr;
    }

    @media (max-width: 640px) {
      .workspace:not(.mobile) {
        grid-template-columns: 1fr;
      }
    }

    .toolbar-row {
      margin-bottom: 0.75rem;
    }

    .hint {
      margin: 0.75rem 0 0;
      font-size: 0.875rem;
      color: #555;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncFromStore();

    this.unsubscribe = subscribe(() => {
      this.syncFromStore();
    });

    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mobileQuery = window.matchMedia('(max-width: 1023px)');
      this.mobileView = this.mobileQuery.matches;
      this.mobileQuery.addEventListener('change', this.handleMobileChange);
    }
  }

  private syncFromStore(): void {
    const current = getState();
    if (!current.inventory) {
      return;
    }

    const epoch = getSessionEpoch();
    if (!this.editorState || epoch !== this.sessionEpoch) {
      this.sessionEpoch = epoch;
      this.editorState = createEditorState(current.inventory, current.layout);
      this.syncRemaining();
      return;
    }

    if (this.editorState.inventory !== current.inventory) {
      this.editorState = {
        ...this.editorState,
        inventory: current.inventory,
      };
      this.syncRemaining();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);
    this.mobileQuery?.removeEventListener('change', this.handleMobileChange);
    this.mobileQuery = null;
  }

  override firstUpdated(): void {
    this.focus();
  }

  private syncRemaining(): void {
    if (!this.editorState) {
      return;
    }
    this.remaining = getRemainingCounts(
      this.editorState.inventory,
      this.editorState.layout,
      CATALOGUE_V1,
    );
  }

  private dispatch(state: EditorState): void {
    this.editorState = state;
    setLayout(state.layout);
    this.syncRemaining();
    this.requestUpdate();
  }

  private handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space' && !this.spaceHeld) {
      this.spaceHeld = true;
      event.preventDefault();
    }
  };

  private handleWindowKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      this.spaceHeld = false;
    }
  };

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.editorState || this.mobileView) {
      return;
    }

    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.dispatch(editorReducer(this.editorState, { type: 'UNDO' }));
      return;
    }

    if (mod && (event.key === 'Z' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      this.dispatch(editorReducer(this.editorState, { type: 'REDO' }));
      return;
    }

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.dispatch(editorReducer(this.editorState, { type: 'ROTATE_CW' }));
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.editorState.selectedInstanceId) {
        event.preventDefault();
        this.dispatch(
          editorReducer(this.editorState, {
            type: 'REMOVE',
            instanceId: this.editorState.selectedInstanceId,
          }),
        );
      }
    }
  }

  private handlePieceSelect(event: CustomEvent<{ pieceId: string }>): void {
    if (!this.editorState) {
      return;
    }
    this.dispatch(editorReducer(this.editorState, { type: 'SELECT_PIECE', pieceId: event.detail.pieceId }));
  }

  private handleToolbarAction(event: CustomEvent<{ type: string }>): void {
    if (!this.editorState) {
      return;
    }

    switch (event.detail.type) {
      case 'undo':
        this.dispatch(editorReducer(this.editorState, { type: 'UNDO' }));
        break;
      case 'redo':
        this.dispatch(editorReducer(this.editorState, { type: 'REDO' }));
        break;
      case 'zoom-in':
        this.dispatch(
          editorReducer(this.editorState, {
            type: 'SET_VIEWPORT',
            viewport: { zoom: this.editorState.viewport.zoom * 1.2 },
          }),
        );
        break;
      case 'zoom-out':
        this.dispatch(
          editorReducer(this.editorState, {
            type: 'SET_VIEWPORT',
            viewport: { zoom: this.editorState.viewport.zoom / 1.2 },
          }),
        );
        break;
      case 'zoom-reset':
        this.dispatch(
          editorReducer(this.editorState, {
            type: 'SET_VIEWPORT',
            viewport: { zoom: 1, panX: 40, panY: 40 },
          }),
        );
        break;
      default:
        break;
    }
  }

  private handleCanvasPointer(event: CustomEvent<{ type: string; studX: number; studY: number }>): void {
    if (!this.editorState || this.mobileView) {
      return;
    }

    const { type, studX, studY } = event.detail;

    if (type === 'move') {
      this.ghostPlacement = previewPlacement(this.editorState, studX, studY);
      return;
    }

    if (type === 'place') {
      const next = editorReducer(this.editorState, { type: 'PLACE', x: studX, y: studY });
      this.dispatch(next);
      this.ghostPlacement = previewPlacement(next, studX, studY);
    }
  }

  private handleInstanceSelect(event: CustomEvent<{ instanceId: string }>): void {
    if (!this.editorState) {
      return;
    }
    this.dispatch(
      editorReducer(this.editorState, {
        type: 'SELECT_INSTANCE',
        instanceId: event.detail.instanceId,
      }),
    );
  }

  private handleViewportChange(event: CustomEvent<{ viewport: Partial<EditorState['viewport']> }>): void {
    if (!this.editorState) {
      return;
    }
    this.dispatch(
      editorReducer(this.editorState, {
        type: 'SET_VIEWPORT',
        viewport: event.detail.viewport,
      }),
    );
  }

  override render() {
    if (!this.editorState) {
      return html`<p>Loading…</p>`;
    }

    const ghost = this.ghostPlacement;
    const layoutIssues = validateLayout(this.editorState.layout, CATALOGUE_V1);
    const appState = getState();
    const shortfalls = appState.inventory
      ? getInventoryShortfall(appState.inventory, this.editorState.layout)
      : [];

    return html`
      <div tabindex="0" @keydown=${this.handleKeyDown}>
        <fork-banner
          .forkMode=${appState.forkMode}
          .catalogueMismatch=${appState.catalogueMismatch}
          .shortfalls=${shortfalls}
        ></fork-banner>

        <mobile-editor-banner .visible=${this.mobileView}></mobile-editor-banner>

        <div class="header">
          <h1>Editor</h1>
          <div class="header-actions">
            <save-load-menu @layout-saved=${() => this.syncFromStore()}></save-load-menu>
            <share-link-button></share-link-button>
            <layout-library @layout-opened=${() => this.syncFromStore()}></layout-library>
            <import-export-menu @layout-imported=${() => this.syncFromStore()}></import-export-menu>
          </div>
        </div>

        <div class="toolbar-row">
          <editor-toolbar
            .canUndo=${this.editorState.history.past.length > 0}
            .canRedo=${this.editorState.history.future.length > 0}
            .zoom=${this.editorState.viewport.zoom}
            @toolbar-action=${this.handleToolbarAction}
          ></editor-toolbar>
        </div>

        <div class="workspace ${this.mobileView ? 'mobile' : ''}">
          ${this.mobileView
            ? nothing
            : html`
                <inventory-palette
                  .remaining=${this.remaining}
                  .selectedPieceId=${this.editorState.selectedPieceId}
                  @piece-select=${this.handlePieceSelect}
                ></inventory-palette>
              `}

          <editor-canvas
            .layout=${this.editorState.layout}
            .viewport=${this.editorState.viewport}
            .ghostPlacement=${ghost?.placement ?? null}
            .ghostValid=${ghost?.valid ?? false}
            .selectedInstanceId=${this.editorState.selectedInstanceId}
            .panMode=${this.spaceHeld}
            .readOnly=${this.mobileView}
            @canvas-pointer=${this.handleCanvasPointer}
            @instance-select=${this.handleInstanceSelect}
            @viewport-change=${this.handleViewportChange}
          ></editor-canvas>
        </div>

        <p class="hint" aria-live="polite">
          ${this.mobileView
            ? 'Pan and zoom to explore the layout. Use a desktop to place and edit pieces.'
            : html`Click palette piece, then click grid to place. R or scroll to rotate. Space+drag to pan.
          ${layoutIssues.valid ? 'Layout valid.' : `${layoutIssues.issues.filter((i) => i.severity === 'error').length} issue(s).`}`}
        </p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-editor': LayoutEditor;
  }
}
