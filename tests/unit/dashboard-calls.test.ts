import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('CallsPage (dashboard-calls)', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="allCallsBody"></div>
      <div id="allCallsCount"></div>
      <input id="callSearchInput" value="" />
      <select id="callStatusFilter"><option value=""></option></select>
      <select id="callOutcomeFilter"><option value=""></option></select>
      <input id="callDateFrom" value="" />
      <input id="callDateTo" value="" />
    `;

    mocks = setupGlobalMocks();

    (window as any).clanaDB = {
      getCalls: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };
    (window as any).allCalls = [];
    (window as any).escHtml = (s: string) => String(s ?? '');
    (window as any).showToast = vi.fn();
    (window as any).URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:test'),
      revokeObjectURL: vi.fn(),
    };

    loadBrowserScript('js/dashboard-calls.js');
  });

  describe('window globals', () => {
    it('exposes CallsPage on window', () => {
      expect((window as any).CallsPage).toBeDefined();
    });

    it('exposes loadAllCalls on window', () => {
      expect(typeof (window as any).loadAllCalls).toBe('function');
    });

    it('exposes renderFilteredCalls on window', () => {
      expect(typeof (window as any).renderFilteredCalls).toBe('function');
    });

    it('exposes initCallFilters on window', () => {
      expect(typeof (window as any).initCallFilters).toBe('function');
    });

    it('CallsPage has exportCSV method', () => {
      expect(typeof (window as any).CallsPage.exportCSV).toBe('function');
    });
  });

  describe('loadAllCalls', () => {
    it('populates allCalls from clanaDB result', async () => {
      const calls = [
        { id: '1', phone_number: '+49123', status: 'completed', created_at: '2025-01-01' },
      ];
      (window as any).clanaDB.getCalls.mockResolvedValue({ success: true, data: calls });

      await (window as any).loadAllCalls();

      expect((window as any).allCalls).toEqual(calls);
    });

    it('shows empty state when no calls returned', async () => {
      (window as any).clanaDB.getCalls.mockResolvedValue({ success: true, data: [] });

      await (window as any).loadAllCalls();

      expect((window as any).allCalls).toEqual([]);
      const body = document.getElementById('allCallsBody')!;
      expect(body.innerHTML).toContain('Noch keine Anrufe');
    });

    it('shows empty state on failure', async () => {
      (window as any).clanaDB.getCalls.mockResolvedValue({ success: false, data: [] });

      await (window as any).loadAllCalls();

      expect((window as any).allCalls).toEqual([]);
    });
  });

  describe('renderFilteredCalls', () => {
    it('shows count of filtered calls', () => {
      (window as any).allCalls = [
        { phone_number: '+49111', status: 'completed', outcome: 'termin', created_at: '2025-01-01' },
        { phone_number: '+49222', status: 'missed', outcome: 'frage', created_at: '2025-01-02' },
      ];

      (window as any).renderFilteredCalls();

      const count = document.getElementById('allCallsCount')!;
      expect(count.textContent).toBe('2 Anrufe');
    });

    it('filters by search input', () => {
      (window as any).allCalls = [
        { phone_number: '+49111', caller_name: 'Alice', status: 'completed', created_at: '2025-01-01' },
        { phone_number: '+49222', caller_name: 'Bob', status: 'completed', created_at: '2025-01-02' },
      ];

      const searchInput = document.getElementById('callSearchInput') as HTMLInputElement;
      searchInput.value = 'alice';

      (window as any).renderFilteredCalls();

      const count = document.getElementById('allCallsCount')!;
      expect(count.textContent).toBe('1 Anrufe');
    });

    it('shows empty message when no results match', () => {
      (window as any).allCalls = [
        { phone_number: '+49111', status: 'completed', created_at: '2025-01-01' },
      ];

      const searchInput = document.getElementById('callSearchInput') as HTMLInputElement;
      searchInput.value = 'nonexistent';

      (window as any).renderFilteredCalls();

      const body = document.getElementById('allCallsBody')!;
      expect(body.innerHTML).toContain('Keine Ergebnisse');
    });
  });

  describe('exportCSV', () => {
    it('shows toast when no calls to export', () => {
      (window as any).allCalls = [];
      (window as any).CallsPage.exportCSV();
      expect((window as any).showToast).toHaveBeenCalledWith('Keine Anrufe zum Exportieren.', true);
    });

    it('creates download link when calls exist', () => {
      (window as any).allCalls = [
        { created_at: '2025-01-01T10:00:00Z', phone_number: '+49123', caller_name: 'Test', duration: 60, status: 'completed', outcome: 'termin', sentiment_score: 8.5 },
      ];

      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValueOnce({
        set href(v: string) { /* noop */ },
        set download(v: string) { /* noop */ },
        click: clickSpy,
      } as any);

      (window as any).CallsPage.exportCSV();

      expect(clickSpy).toHaveBeenCalled();
      expect((window as any).showToast).toHaveBeenCalledWith('CSV exportiert.');
    });
  });
});
