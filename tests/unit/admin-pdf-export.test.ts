import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AdminPdfExport', () => {
  let supabase: any;

  beforeEach(() => {
    const mocks = setupGlobalMocks();
    supabase = mocks.supabase;

    // Mock CONFIG.getPlanPrice
    (window as any).CONFIG = {
      getPlanPrice: vi.fn((plan: string) => {
        if (plan === 'starter') return 149;
        if (plan === 'professional') return 299;
        if (plan === 'business') return 599;
        return 0;
      }),
    };

    // Mock Components.toast
    (window as any).Components = {
      toast: vi.fn(),
    };

    // Mock clanaDB
    (window as any).clanaDB = {
      getAllProfiles: vi.fn().mockResolvedValue({ data: [] }),
      getOrganizations: vi.fn().mockResolvedValue({ data: [] }),
      getLeads: vi.fn().mockResolvedValue({ data: [] }),
    };

    loadBrowserScript('js/admin-pdf-export.js');
  });

  const getExport = () => (window as any).AdminPdfExport;

  it('is defined on window', () => {
    expect(getExport()).toBeDefined();
  });

  it('has generateMonthlyReport method', () => {
    expect(typeof getExport().generateMonthlyReport).toBe('function');
  });

  it('has _ensureJsPdf method', () => {
    expect(typeof getExport()._ensureJsPdf).toBe('function');
  });

  it('shows error toast when jsPDF is not available', async () => {
    // _ensureJsPdf returns false when jsPDF cannot be loaded
    const exp = getExport();
    exp._ensureJsPdf = vi.fn().mockResolvedValue(false);

    await exp.generateMonthlyReport();

    expect((window as any).Components.toast).toHaveBeenCalledWith(
      'PDF-Bibliothek konnte nicht geladen werden',
      'error'
    );
  });
});
