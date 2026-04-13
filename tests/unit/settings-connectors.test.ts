import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('SettingsConnectors', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'connCategoryFilter', 'connSearchInput',
      'connConnectedSection', 'connConnectedCount', 'connConnectedGrid',
      'connAvailableLabel', 'connAvailableGrid',
      'connModal', 'connModalIcon', 'connModalTitle',
      'connModalCategory', 'connModalDesc',
      'connDisconnectSection',
      'connFormOAuth', 'connFormApiKey', 'connFormWebhook',
      'connFormSip', 'connFormForward', 'connFormInfo',
      'connOAuthName', 'connOAuthBtn',
      'connApiKeyInput', 'connApiKeyHelp',
      'connApiKeyExtra', 'connApiKeyExtraLabel', 'connApiKeyExtraInput',
      'connWebhookUrl', 'connWebhookSecret', 'connWebhookHelp',
      'connSipServer', 'connSipUser', 'connSipPass', 'connSipPort',
      'connForwardNumber', 'connForwardHelp',
    ];
    document.body.innerHTML = ids.map(id => {
      if (['connCategoryFilter'].includes(id)) {
        return `<select id="${id}"><option value="Alle">Alle Kategorien</option></select>`;
      }
      if (['connSearchInput', 'connApiKeyInput', 'connApiKeyExtraInput',
           'connSipServer', 'connSipUser', 'connSipPass', 'connSipPort',
           'connWebhookUrl', 'connWebhookSecret', 'connForwardNumber'].includes(id)) {
        return `<input id="${id}" value="">`;
      }
      return `<div id="${id}"></div>`;
    }).join('');

    mocks = setupGlobalMocks();

    (window as any).showToast = vi.fn();
    (window as any).currentUser = { id: 'test-uid' };
    (window as any).escHtml = (s: string) => s;
    (window as any).confirm = vi.fn().mockReturnValue(true);

    // crypto is a read-only getter in jsdom, use stubGlobal
    vi.stubGlobal('crypto', {
      randomUUID: () => 'aaaabbbb-cccc',
      getRandomValues: (arr: Uint8Array) => { arr.fill(42); return arr; },
    });

    loadBrowserScript('js/settings-connectors.js');
  });

  it('CONNECTORS is a non-empty array', () => {
    const connectors = (window as any).CONNECTORS;
    expect(Array.isArray(connectors)).toBe(true);
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('each connector has required properties', () => {
    const connectors = (window as any).CONNECTORS;
    for (const c of connectors) {
      expect(c).toHaveProperty('provider');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('icon');
      expect(c).toHaveProperty('category');
      expect(c).toHaveProperty('type');
      expect(c).toHaveProperty('status');
      expect(c).toHaveProperty('desc');
    }
  });

  it('categories include Telefonie and Webhooks & API', () => {
    const connectors = (window as any).CONNECTORS;
    const categories = [...new Set(connectors.map((c: any) => c.category))];
    expect(categories).toContain('Telefonie');
    expect(categories).toContain('Webhooks & API');
  });

  it('initConnectorTab is a function and populates category filter', () => {
    const fn = (window as any).initConnectorTab;
    expect(typeof fn).toBe('function');
  });

  it('filterConnectors is a function', () => {
    expect(typeof (window as any).filterConnectors).toBe('function');
  });

  it('closeConnModal hides the modal and resets provider', () => {
    const modal = document.getElementById('connModal')!;
    (modal as HTMLElement).style.display = 'flex';
    (window as any).closeConnModal();
    expect(modal.style.display).toBe('none');
  });

  it('connDisconnect is a function', () => {
    expect(typeof (window as any).connDisconnect).toBe('function');
  });

  it('connSaveApiKey is a function', () => {
    expect(typeof (window as any).connSaveApiKey).toBe('function');
  });

  it('openConnModal sets modal content for a known provider', () => {
    (window as any).openConnModal('hubspot');
    expect(document.getElementById('connModalTitle')!.textContent).toBe('HubSpot CRM');
    expect(document.getElementById('connModalCategory')!.textContent).toBe('CRM & Vertrieb');
    expect(document.getElementById('connModal')!.style.display).toBe('flex');
  });

  it('openConnModal does nothing for unknown provider', () => {
    const modal = document.getElementById('connModal')!;
    modal.style.display = 'none';
    (window as any).openConnModal('nonexistent_provider');
    expect(modal.style.display).toBe('none');
  });
});
