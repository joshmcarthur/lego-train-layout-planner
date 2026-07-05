import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { loadInventory } from '@track-layout/persistence';
import './inventory-settings.ts';

export type AppRoute = 'home' | 'onboarding' | 'editor' | 'generate';

@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: String })
  route: AppRoute = 'home';

  static override styles = css`
    :host {
      display: block;
      border-bottom: 1px solid #e0e0e0;
      background: #fff;
      margin-bottom: var(--space-3, 1.5rem);
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2, 1rem);
      padding: var(--space-2, 1rem) var(--space-3, 1.5rem);
      max-width: 72rem;
      margin: 0 auto;
    }

    .brand {
      font-weight: 700;
      font-size: 1rem;
      color: inherit;
      text-decoration: none;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-1, 0.5rem);
    }

    a {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      color: inherit;
      text-decoration: none;
      font-size: 0.95rem;
    }

    a:hover {
      background: #f5f5f5;
    }

    a[aria-current='page'] {
      background: #e3f2fd;
      color: #1565c0;
      font-weight: 600;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-1, 0.5rem);
    }
  `;

  private base(): string {
    return import.meta.env.BASE_URL;
  }

  private navLink(href: string, label: string, active: boolean) {
    return html`<a href=${href} aria-current=${active ? 'page' : 'false'}>${label}</a>`;
  }

  override render() {
    const base = this.base();
    const hasInventory = loadInventory() !== null;

    return html`
      <nav aria-label="Main">
        <a class="brand" href="${base}">Lego Train Layout Planner</a>
        <div class="links">
          ${this.navLink(`${base}`, 'Home', this.route === 'home')}
          ${hasInventory
            ? this.navLink(`${base}editor/`, 'Editor', this.route === 'editor')
            : nothing}
          ${hasInventory
            ? this.navLink(`${base}generate/`, 'Generate', this.route === 'generate')
            : nothing}
          ${!hasInventory
            ? this.navLink(`${base}onboarding/`, 'Set up inventory', this.route === 'onboarding')
            : nothing}
        </div>
        ${hasInventory && this.route !== 'onboarding'
          ? html`<div class="actions"><inventory-settings></inventory-settings></div>`
          : null}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
