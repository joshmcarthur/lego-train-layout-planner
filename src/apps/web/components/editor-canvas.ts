import type { Layout, Placement, ValidationIssue } from '@track-layout/connection-engine';
import { getWorldPorts, validateLayout } from '@track-layout/connection-engine';
import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { Viewport } from '../state/editor-reducer.ts';
import { screenToStud } from '../state/snap-placement.ts';
import { issueMessage } from '../state/validation-messages.ts';
import './editor-grid.ts';
import './track-piece-svg.ts';
import './validation-overlay.ts';
import type { OpenEndMarker } from './validation-overlay.ts';

@customElement('editor-canvas')
export class EditorCanvas extends LitElement {
  @property({ attribute: false })
  layout!: Layout;

  @property({ attribute: false })
  viewport!: Viewport;

  @property({ attribute: false })
  ghostPlacement: Placement | null = null;

  @property({ type: Boolean })
  ghostValid = false;

  @property({ type: String })
  selectedInstanceId: string | null = null;

  @property({ type: Boolean })
  panMode = false;

  @state()
  private tooltipMessage = '';

  @state()
  private tooltipX = 0;

  @state()
  private tooltipY = 0;

  @state()
  private isPanning = false;

  @state()
  private panStart = { x: 0, y: 0, panX: 0, panY: 0 };

  static override styles = css`
    :host {
      display: block;
      flex: 1;
      min-height: 24rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #fafafa;
      cursor: crosshair;
    }

    :host([pan-mode]) {
      cursor: grab;
    }

    :host([panning]) {
      cursor: grabbing;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 24rem;
      touch-action: none;
    }

    .hit-area {
      fill: transparent;
      stroke: none;
    }
  `;

  private getSvgPoint(event: MouseEvent): { x: number; y: number } {
    const svg = this.renderRoot.querySelector('svg');
    if (!svg) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private toStud(screenX: number, screenY: number): { x: number; y: number } {
    return screenToStud(screenX, screenY, this.viewport);
  }

  private dispatchPointer(type: string, studX: number, studY: number): void {
    this.dispatchEvent(
      new CustomEvent('canvas-pointer', {
        detail: { type, studX, studY },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private dispatchViewport(viewport: Partial<Viewport>): void {
    this.dispatchEvent(
      new CustomEvent('viewport-change', {
        detail: { viewport },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      const point = this.getSvgPoint(event);
      const dx = point.x - this.panStart.x;
      const dy = point.y - this.panStart.y;
      this.dispatchViewport({
        panX: this.panStart.panX + dx,
        panY: this.panStart.panY + dy,
      });
      return;
    }

    const point = this.getSvgPoint(event);
    const stud = this.toStud(point.x, point.y);
    this.dispatchPointer('move', stud.x, stud.y);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 1 || this.panMode) {
      event.preventDefault();
      const point = this.getSvgPoint(event);
      this.isPanning = true;
      this.panStart = {
        x: point.x,
        y: point.y,
        panX: this.viewport.panX,
        panY: this.viewport.panY,
      };
      this.setAttribute('panning', '');
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const target = event.target as Element;
    const pieceGroup = target.closest('[data-instance-id]');
    const point = this.getSvgPoint(event);
    const stud = this.toStud(point.x, point.y);

    if (pieceGroup) {
      const instanceId = pieceGroup.getAttribute('data-instance-id');
      if (instanceId && instanceId !== '__ghost__') {
        this.dispatchEvent(
          new CustomEvent('instance-select', {
            detail: { instanceId },
            bubbles: true,
            composed: true,
          }),
        );
      }
      return;
    }

    this.dispatchPointer('place', stud.x, stud.y);
  }

  private handleMouseUp(): void {
    if (this.isPanning) {
      this.isPanning = false;
      this.removeAttribute('panning');
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const point = this.getSvgPoint(event);
    const studBefore = this.toStud(point.x, point.y);

    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = this.viewport.zoom * factor;

    const panX = point.x - studBefore.x * newZoom;
    const panY = point.y - studBefore.y * newZoom;

    this.dispatchViewport({ zoom: newZoom, panX, panY });
  }

  private getOpenEndMarkers(): OpenEndMarker[] {
    const result = validateLayout(this.layout, CATALOGUE_V1);
    const markers: OpenEndMarker[] = [];

    for (const issue of result.issues) {
      if (issue.code !== 'OPEN_END') {
        continue;
      }
      const placement = this.layout.placements.find((p) => p.instanceId === issue.instanceId);
      if (!placement) {
        continue;
      }
      const port = getWorldPorts(placement, CATALOGUE_V1).find((p) => p.portId === issue.portId);
      if (port) {
        markers.push({ x: port.position.x, y: port.position.y });
      }
    }

    return markers;
  }

  private getGhostIssues(): ValidationIssue[] {
    if (!this.ghostPlacement || this.ghostValid) {
      return [];
    }

    const tempLayout: Layout = {
      ...this.layout,
      placements: [...this.layout.placements, this.ghostPlacement],
    };
    const result = validateLayout(tempLayout, CATALOGUE_V1);
    return result.issues.filter((issue) => issue.severity === 'error');
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('ghostPlacement') || changed.has('ghostValid')) {
      if (!this.ghostPlacement) {
        this.tooltipMessage = '';
        return;
      }

      if (!this.ghostValid) {
        const issues = this.getGhostIssues();
        const first = issues[0];
        this.tooltipMessage = first ? issueMessage(first.code) : issueMessage('OVERLAP');
        this.tooltipX = this.ghostPlacement.x;
        this.tooltipY = this.ghostPlacement.y - 3;
      } else {
        this.tooltipMessage = '';
      }
    }

    if (changed.has('panMode')) {
      if (this.panMode) {
        this.setAttribute('pan-mode', '');
      } else {
        this.removeAttribute('pan-mode');
      }
    }
  }

  override render() {
    const { panX, panY, zoom } = this.viewport;
    const worldTransform = `translate(${panX} ${panY}) scale(${zoom})`;
    const openEnds = this.getOpenEndMarkers();

    return html`
      <svg
        data-testid="editor-canvas"
        @mousemove=${this.handleMouseMove}
        @mousedown=${this.handleMouseDown}
        @mouseup=${this.handleMouseUp}
        @mouseleave=${this.handleMouseUp}
        @wheel=${this.handleWheel}
      >
        <g transform=${worldTransform}>
          <editor-grid minX=${-16} minY=${-16} maxX=${96} maxY=${96}></editor-grid>

          <g class="layer-footprints">
            ${this.layout.placements.map(
              (placement) => html`
                <track-piece-svg
                  .placement=${placement}
                  ?selected=${this.selectedInstanceId === placement.instanceId}
                ></track-piece-svg>
              `,
            )}
          </g>

          ${this.ghostPlacement
            ? html`
                <track-piece-svg
                  .placement=${this.ghostPlacement}
                  ghost
                  ?invalid=${!this.ghostValid}
                ></track-piece-svg>
              `
            : nothing}

          <validation-overlay
            .openEnds=${openEnds}
            .tooltipMessage=${this.tooltipMessage}
            .tooltipX=${this.tooltipX}
            .tooltipY=${this.tooltipY}
          ></validation-overlay>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-canvas': EditorCanvas;
  }
}
