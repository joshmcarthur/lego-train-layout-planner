import { validateLayout } from '@track-layout/connection-engine';
import { getRemainingCounts } from '@track-layout/inventory';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getState, setLayout, subscribe } from '../state/app-store.ts';
import {
  createEditorState,
  editorReducer,
  previewPlacement,
  type EditorState,
} from '../state/editor-reducer.ts';
import './editor-canvas.ts';
import './editor-toolbar.ts';
import './inventory-palette.ts';
import './inventory-settings.ts';

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

  private unsubscribe: (() => void) | null = null;

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
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(12rem, 14rem) 1fr;
      gap: 1rem;
      align-items: start;
    }

    @media (max-width: 640px) {
      .workspace {
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
    const { inventory, layout } = getState();
    if (!inventory) {
      return;
    }

    this.editorState = createEditorState(inventory, layout);
    this.syncRemaining();

    this.unsubscribe = subscribe(() => {
      const current = getState();
      if (current.inventory && this.editorState) {
        this.editorState = {
          ...this.editorState,
          inventory: current.inventory,
        };
        this.syncRemaining();
      }
    });

    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);
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
    if (!this.editorState) {
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
    if (!this.editorState) {
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

    return html`
      <div tabindex="0" @keydown=${this.handleKeyDown}>
        <div class="header">
          <h1>Editor</h1>
          <inventory-settings></inventory-settings>
        </div>

        <div class="toolbar-row">
          <editor-toolbar
            .canUndo=${this.editorState.history.past.length > 0}
            .canRedo=${this.editorState.history.future.length > 0}
            .zoom=${this.editorState.viewport.zoom}
            @toolbar-action=${this.handleToolbarAction}
          ></editor-toolbar>
        </div>

        <div class="workspace">
          <inventory-palette
            .remaining=${this.remaining}
            .selectedPieceId=${this.editorState.selectedPieceId}
            @piece-select=${this.handlePieceSelect}
          ></inventory-palette>

          <editor-canvas
            .layout=${this.editorState.layout}
            .viewport=${this.editorState.viewport}
            .ghostPlacement=${ghost?.placement ?? null}
            .ghostValid=${ghost?.valid ?? false}
            .selectedInstanceId=${this.editorState.selectedInstanceId}
            .panMode=${this.spaceHeld}
            @canvas-pointer=${this.handleCanvasPointer}
            @instance-select=${this.handleInstanceSelect}
            @viewport-change=${this.handleViewportChange}
          ></editor-canvas>
        </div>

        <p class="hint">
          Click palette piece, then click grid to place. R or scroll to rotate. Space+drag to pan.
          ${layoutIssues.valid ? 'Layout valid.' : `${layoutIssues.issues.filter((i) => i.severity === 'error').length} issue(s).`}
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
