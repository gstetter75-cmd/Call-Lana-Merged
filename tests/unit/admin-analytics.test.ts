import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createSupabaseMock } from './setup';

describe('AdminAnalytics', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;
  let supabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    supabase = createSupabaseMock();
    mocks = setupGlobalMocks({ supabase });

    // Mock clanaDB for revenue/cohort/churn methods
    (window as any).clanaDB = {
      getCustomers: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getLeads: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getAllProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    // Mock CONFIG for plan prices
    (window as any).CONFIG = {
      getPlanPrice: vi.fn().mockReturnValue(99),
    };

    // Mock Components for toast notifications
    (window as any).Components = {
      toast: vi.fn(),
    };

    document.body.innerHTML = '<div id="admin-webhooks"></div>';

    loadBrowserScript('js/admin-analytics.js');
  });

  it('AdminAnalytics is defined on window', () => {
    expect((window as any).AdminAnalytics).toBeDefined();
  });

  it('has generateMonthlyInvoices method', () => {
    expect(typeof (window as any).AdminAnalytics.generateMonthlyInvoices).toBe('function');
  });

  it('has renderWebhookConfig method', () => {
    expect(typeof (window as any).AdminAnalytics.renderWebhookConfig).toBe('function');
  });

  it('has addWebhook method', () => {
    expect(typeof (window as any).AdminAnalytics.addWebhook).toBe('function');
  });

  it('has deleteWebhook method', () => {
    expect(typeof (window as any).AdminAnalytics.deleteWebhook).toBe('function');
  });

  it('has renderRevenueForecast method', () => {
    expect(typeof (window as any).AdminAnalytics.renderRevenueForecast).toBe('function');
  });

  it('has renderCohortAnalysis method', () => {
    expect(typeof (window as any).AdminAnalytics.renderCohortAnalysis).toBe('function');
  });

  it('has renderChurnWarnings method', () => {
    expect(typeof (window as any).AdminAnalytics.renderChurnWarnings).toBe('function');
  });

  describe('renderWebhookConfig()', () => {
    it('returns early for null container', async () => {
      await (window as any).AdminAnalytics.renderWebhookConfig(null);
      // Should not throw
    });

    it('renders empty state when no webhooks', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
      };
      supabase.from.mockReturnValue(qm);

      const container = document.getElementById('admin-webhooks')!;
      await (window as any).AdminAnalytics.renderWebhookConfig(container);
      expect(container.innerHTML).toContain('Keine Webhooks konfiguriert');
    });

    it('renders webhook rows when data exists', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'wh-1', event_type: 'lead.created', url: 'https://hooks.slack.com/test', is_active: true },
          ],
        }),
      };
      supabase.from.mockReturnValue(qm);

      const container = document.getElementById('admin-webhooks')!;
      await (window as any).AdminAnalytics.renderWebhookConfig(container);
      expect(container.innerHTML).toContain('Neuer Lead');
      expect(container.innerHTML).toContain('https://hooks.slack.com/test');
      expect(container.innerHTML).toContain('Aktiv');
    });
  });

  describe('renderRevenueForecast()', () => {
    it('returns early for null container', async () => {
      await (window as any).AdminAnalytics.renderRevenueForecast(null);
      // Should not throw
    });

    it('renders forecast with active customers', async () => {
      (window as any).clanaDB.getCustomers.mockResolvedValue({
        success: true,
        data: [{ status: 'active', plan: 'starter' }],
      });
      (window as any).clanaDB.getLeads.mockResolvedValue({
        success: true,
        data: [{ status: 'won', value: 500 }],
      });

      const container = document.createElement('div');
      await (window as any).AdminAnalytics.renderRevenueForecast(container);
      expect(container.innerHTML).toContain('MRR-Prognose');
      expect(container.innerHTML).toContain('AKTUELL MRR');
    });
  });

  describe('renderChurnWarnings()', () => {
    it('shows no-risk message when all users are active', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { role: 'customer', is_active: true, last_sign_in_at: new Date().toISOString(), email: 'a@b.de' },
        ],
      });

      const container = document.createElement('div');
      await (window as any).AdminAnalytics.renderChurnWarnings(container);
      expect(container.innerHTML).toContain('Keine gefährdeten Kunden');
    });
  });
});
