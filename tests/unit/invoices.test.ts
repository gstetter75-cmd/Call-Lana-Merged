import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Invoices', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <table><tbody id="invoiceTableBody"></tbody></table>
      <div id="selectionBar" style="display:none;"></div>
      <input id="selectAllInvoices" type="checkbox">
    `;

    mocks = setupGlobalMocks();
    // Mock global functions the script calls
    (window as any).escapeHtml = (s: string) => s;
    (window as any).updateSelectionBar = vi.fn();
    (window as any).getStatusBadge = (s: string) => `<span class="badge">${s}</span>`;

    loadBrowserScript('js/invoices.js');
  });

  describe('formatCents', () => {
    it('formats 0 cents', () => {
      const result = (window as any).formatCents(0);
      expect(result).toContain('0');
      expect(result).toMatch(/€|EUR/);
    });

    it('formats 15000 as 150 EUR', () => {
      const result = (window as any).formatCents(15000);
      expect(result).toContain('150');
    });

    it('formats 99 cents', () => {
      const result = (window as any).formatCents(99);
      expect(result).toContain('0,99');
    });
  });

  describe('formatDateDE', () => {
    it('formats ISO date to German format', () => {
      const result = (window as any).formatDateDE('2026-03-15');
      expect(result).toContain('15');
      expect(result).toContain('03');
      expect(result).toContain('2026');
    });

    it('returns empty string for null', () => {
      expect((window as any).formatDateDE(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect((window as any).formatDateDE('')).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect((window as any).formatDateDE(undefined)).toBe('');
    });
  });

  describe('renderInvoiceTable', () => {
    it('shows empty message when no invoices', () => {
      (window as any).renderInvoiceTable([]);
      const body = document.getElementById('invoiceTableBody')!;
      expect(body.innerHTML).toContain('Keine Rechnungen vorhanden');
    });

    it('renders rows for invoices', () => {
      const invoices = [
        {
          id: 'inv-1',
          invoice_number: 'INV-2026-001',
          invoice_date: '2026-03-01',
          period_start: '2026-02-01',
          period_end: '2026-02-28',
          total_gross_cents: 17800,
          status: 'paid',
          email_sent: true,
        },
        {
          id: 'inv-2',
          invoice_number: 'INV-2026-002',
          invoice_date: '2026-03-15',
          period_start: '2026-03-01',
          period_end: '2026-03-31',
          total_gross_cents: 35600,
          status: 'pending',
          email_sent: false,
        },
      ];

      (window as any).renderInvoiceTable(invoices);
      const body = document.getElementById('invoiceTableBody')!;
      expect(body.innerHTML).toContain('INV-2026-001');
      expect(body.innerHTML).toContain('INV-2026-002');
      expect(body.innerHTML).toContain('178'); // 17800 cents = 178 EUR
    });

    it('resets selectAll checkbox', () => {
      const cb = document.getElementById('selectAllInvoices') as HTMLInputElement;
      cb.checked = true;
      (window as any).renderInvoiceTable([]);
      expect(cb.checked).toBe(false);
    });

    it('calls updateSelectionBar after render', () => {
      (window as any).renderInvoiceTable([]);
      expect((window as any).updateSelectionBar).toHaveBeenCalled();
    });
  });

  describe('loadInvoices', () => {
    it('loads invoices from supabase and renders', async () => {
      const mockInvoices = [
        { id: '1', invoice_number: 'INV-001', invoice_date: '2026-01-01', total_gross_cents: 5000, status: 'paid' },
      ];

      // The from().select().order() chain needs to resolve
      const queryMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
      };
      mocks.supabase.from.mockReturnValue(queryMock as any);

      await (window as any).loadInvoices();
      expect(mocks.supabase.from).toHaveBeenCalledWith('invoices');
      const body = document.getElementById('invoiceTableBody')!;
      expect(body.innerHTML).toContain('INV-001');
    });

    it('renders empty table on error', async () => {
      const queryMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      };
      mocks.supabase.from.mockReturnValue(queryMock as any);

      await (window as any).loadInvoices();
      const body = document.getElementById('invoiceTableBody')!;
      expect(body.innerHTML).toContain('Keine Rechnungen');
    });

    it('does nothing if table body missing', async () => {
      const el = document.getElementById('invoiceTableBody');
      if (el) el.remove();
      // Should not throw
      await (window as any).loadInvoices();
    });
  });
});
