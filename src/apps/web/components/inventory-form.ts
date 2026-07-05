import { CATALOGUE_V1 } from '@track-layout/piece-catalogue';
import type { PieceCategory, PieceDefinition } from '@track-layout/piece-catalogue';
import {
  INVENTORY_PRESETS,
  randomInventory,
  validateCount,
  type InventoryPresetId,
} from '@track-layout/inventory';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const CATEGORY_GROUPS: { title: string; categories: PieceCategory[] }[] = [
  { title: 'Straights', categories: ['straight'] },
  { title: 'Curves', categories: ['curve'] },
  { title: 'Switches', categories: ['switch-left', 'switch-right'] },
];

function piecesForGroup(categories: PieceCategory[]): PieceDefinition[] {
  return CATALOGUE_V1.all().filter((piece) => categories.includes(piece.category));
}

@customElement('inventory-form')
export class InventoryForm extends LitElement {
  @property({ type: Object })
  counts: Record<string, number> = {};

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  submitLabel = 'Continue to editor';

  @state()
  private fieldErrors: Record<string, string> = {};

  @state()
  private formError = '';

  @state()
  private selectedPreset: InventoryPresetId = 'medium';

  static override styles = css`
    :host {
      display: block;
    }

    fieldset {
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      margin: 0 0 1.25rem;
      padding: 1rem;
    }

    legend {
      font-weight: 600;
      padding: 0 0.25rem;
    }

    .field {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem 1rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    label {
      font-size: 0.95rem;
    }

    input[type='number'] {
      width: 5rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      font: inherit;
    }

    input[aria-invalid='true'] {
      border-color: var(--color-invalid, #c62828);
    }

    .field-error {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--color-invalid, #c62828);
      font-size: 0.875rem;
    }

    .random-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    select,
    button {
      font: inherit;
      padding: 0.35rem 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
    }

    button.primary {
      background: #1565c0;
      border-color: #1565c0;
      color: #fff;
    }

    button:disabled,
    select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-error {
      margin: 0 0 1rem;
      color: var(--color-invalid, #c62828);
    }

    .actions {
      margin-top: 1rem;
    }
  `;

  private emitChange(counts: Record<string, number>): void {
    this.dispatchEvent(
      new CustomEvent('inventory-change', {
        detail: { counts },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleInput(inventoryKey: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const result = validateCount(input.value);
    const nextErrors = { ...this.fieldErrors };

    if (result.ok) {
      delete nextErrors[inventoryKey];
      const nextCounts = { ...this.counts, [inventoryKey]: result.count };
      this.counts = nextCounts;
      this.emitChange(nextCounts);
    } else {
      nextErrors[inventoryKey] = result.error;
    }

    this.fieldErrors = nextErrors;
    this.formError = '';
  }

  private applyRandomPreset(): void {
    const inventory = randomInventory(this.selectedPreset, CATALOGUE_V1);
    this.counts = { ...inventory.counts };
    this.fieldErrors = {};
    this.formError = '';
    this.emitChange(this.counts);
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.disabled) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    let total = 0;

    for (const piece of CATALOGUE_V1.all()) {
      const result = validateCount(this.counts[piece.inventoryKey] ?? 0);
      if (!result.ok) {
        nextErrors[piece.inventoryKey] = result.error;
      } else {
        total += result.count;
      }
    }

    this.fieldErrors = nextErrors;

    if (Object.keys(nextErrors).length > 0) {
      this.formError = 'Fix the highlighted fields before continuing.';
      return;
    }

    if (total === 0) {
      this.formError = 'Enter at least one piece to continue.';
      return;
    }

    this.formError = '';
    this.dispatchEvent(
      new CustomEvent('inventory-submit', {
        detail: { counts: { ...this.counts } },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <div class="random-row">
          <label for="preset">Random inventory</label>
          <select
            id="preset"
            .value=${this.selectedPreset}
            ?disabled=${this.disabled}
            @change=${(event: Event) => {
              this.selectedPreset = (event.target as HTMLSelectElement)
                .value as InventoryPresetId;
            }}
          >
            ${INVENTORY_PRESETS.map(
              (preset) => html`
                <option value=${preset.id}>${preset.label}</option>
              `,
            )}
          </select>
          <button type="button" ?disabled=${this.disabled} @click=${this.applyRandomPreset}>
            Apply
          </button>
        </div>

        ${CATEGORY_GROUPS.map(
          (group) => html`
            <fieldset>
              <legend>${group.title}</legend>
              ${piecesForGroup(group.categories).map((piece) => this.renderField(piece))}
            </fieldset>
          `,
        )}

        <div aria-live="polite">
          ${this.formError ? html`<p class="form-error">${this.formError}</p>` : nothing}
        </div>

        <div class="actions">
          <button class="primary" type="submit" ?disabled=${this.disabled}>
            ${this.submitLabel}
          </button>
        </div>
      </form>
    `;
  }

  private renderField(piece: PieceDefinition) {
    const error = this.fieldErrors[piece.inventoryKey];
    const value = this.counts[piece.inventoryKey] ?? 0;

    return html`
      <div class="field">
        <label for=${piece.inventoryKey}>${piece.name}</label>
        <input
          id=${piece.inventoryKey}
          type="number"
          min="0"
          max="999"
          step="1"
          .value=${String(value)}
          ?disabled=${this.disabled}
          aria-invalid=${error ? 'true' : 'false'}
          @input=${(event: Event) => this.handleInput(piece.inventoryKey, event)}
        />
        ${error ? html`<p class="field-error">${error}</p>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'inventory-form': InventoryForm;
  }
}
