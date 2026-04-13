import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('DashboardIntegrations', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="intConnectedCount"></div>
      <div id="intEmptyState"></div>
      <div id="intConnectedList"></div>
      <div id="contactsCount"></div>
      <table><tbody id="contactsTableBody"></tbody></table>
      <div id="csvImportModal" style="display:none"></div>
      <div id="csvPreview" style="display:none"></div>
      <button id="csvImportBtn" disabled></button>
      <input id="csvFileInput" type="file" />
      <div id="csvDropZone"></div>
      <div id="csvRowCount"></div>
      <div id="csvPreviewTable"></div>
    `;

    mocks = setupGlobalMocks();

    (window as any).showToast = vi.fn();
    (window as any).escHtml = (s: any) => String(s ?? '');

    loadBrowserScript('js/dashboard-integrations.js');
  });

  describe('window exports', () => {
    it('exposes loadIntegrations on window', () => {
      expect(typeof (window as any).loadIntegrations).toBe('function');
    });

    it('exposes openContactImport on window', () => {
      expect(typeof (window as any).openContactImport).toBe('function');
    });

    it('exposes closeCsvImportModal on window', () => {
      expect(typeof (window as any).closeCsvImportModal).toBe('function');
    });

    it('exposes loadContacts on window', () => {
      expect(typeof (window as any).loadContacts).toBe('function');
    });

    it('exposes syncIntegration on window', () => {
      expect(typeof (window as any).syncIntegration).toBe('function');
    });

    it('exposes importCsvContacts on window', () => {
      expect(typeof (window as any).importCsvContacts).toBe('function');
    });
  });

  describe('SafeActions registration', () => {
    it('registers sync-integration action', () => {
      const handlers = (window as any).SafeActions._handlers;
      expect(handlers['sync-integration']).toBeDefined();
      expect(typeof handlers['sync-integration']).toBe('function');
    });
  });

  describe('openContactImport', () => {
    it('shows the CSV import modal', () => {
      (window as any).openContactImport();
      expect(document.getElementById('csvImportModal')!.style.display).toBe('flex');
    });

    it('resets preview and disables import button', () => {
      (window as any).openContactImport();
      expect(document.getElementById('csvPreview')!.style.display).toBe('none');
      expect((document.getElementById('csvImportBtn') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('closeCsvImportModal', () => {
    it('hides the CSV import modal', () => {
      document.getElementById('csvImportModal')!.style.display = 'flex';
      (window as any).closeCsvImportModal();
      expect(document.getElementById('csvImportModal')!.style.display).toBe('none');
    });
  });

  describe('syncIntegration', () => {
    it('shows a toast message', async () => {
      await (window as any).syncIntegration('int-1');
      expect((window as any).showToast).toHaveBeenCalledWith(
        expect.stringContaining('Sync')
      );
    });
  });

  describe('loadIntegrations', () => {
    it('returns early when no user', async () => {
      mocks.auth.getUser.mockResolvedValue(null);
      await (window as any).loadIntegrations();
      expect(mocks.supabase.from).not.toHaveBeenCalled();
    });

    it('shows empty state when no connections', async () => {
      mocks.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      });

      await (window as any).loadIntegrations();
      expect(document.getElementById('intConnectedCount')!.textContent).toContain('0');
    });
  });
});
