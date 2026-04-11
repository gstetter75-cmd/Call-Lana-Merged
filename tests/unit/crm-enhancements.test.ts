import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('CRMEnhancements', () => {
  let CRM: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = '<div id="crm-forecast"></div><div id="crm-followup"></div>';

    mocks = setupGlobalMocks();

    (window as any).Components = { toast: vi.fn() };
    (window as any).clanaDB = {
      updateLead: vi.fn().mockResolvedValue({ success: true }),
    };
    (window as any).loadLeads = vi.fn();

    loadBrowserScript('js/crm-enhancements.js');
    CRM = (window as any).CRMEnhancements;
  });

  it('exports CRMEnhancements to window', () => {
    expect(CRM).toBeDefined();
    expect(typeof CRM).toBe('object');
  });

  it('has STAGE_PROBABILITIES with expected keys', () => {
    expect(CRM.STAGE_PROBABILITIES).toBeDefined();
    expect(CRM.STAGE_PROBABILITIES.new).toBe(0.10);
    expect(CRM.STAGE_PROBABILITIES.contacted).toBe(0.25);
    expect(CRM.STAGE_PROBABILITIES.qualified).toBe(0.50);
    expect(CRM.STAGE_PROBABILITIES.proposal).toBe(0.75);
    expect(CRM.STAGE_PROBABILITIES.won).toBe(1.0);
    expect(CRM.STAGE_PROBABILITIES.lost).toBe(0);
  });

  it('has calculateWeightedPipeline method', () => {
    expect(typeof CRM.calculateWeightedPipeline).toBe('function');
  });

  it('has renderForecastWidget method', () => {
    expect(typeof CRM.renderForecastWidget).toBe('function');
  });

  it('has renderFollowUpBanner method', () => {
    expect(typeof CRM.renderFollowUpBanner).toBe('function');
  });

  describe('calculateWeightedPipeline', () => {
    it('returns 0 for empty leads', () => {
      const result = CRM.calculateWeightedPipeline([]);
      expect(result.weighted).toBe(0);
      expect(result.unweighted).toBe(0);
    });

    it('excludes won and lost leads', () => {
      const leads = [
        { status: 'won', value: 1000 },
        { status: 'lost', value: 2000 },
      ];
      const result = CRM.calculateWeightedPipeline(leads);
      expect(result.weighted).toBe(0);
      expect(result.unweighted).toBe(0);
    });

    it('calculates weighted values correctly', () => {
      const leads = [
        { status: 'new', value: 1000 },       // 1000 * 0.10 = 100
        { status: 'qualified', value: 2000 },  // 2000 * 0.50 = 1000
        { status: 'proposal', value: 4000 },   // 4000 * 0.75 = 3000
      ];
      const result = CRM.calculateWeightedPipeline(leads);
      expect(result.weighted).toBe(4100);
      expect(result.unweighted).toBe(7000);
    });

    it('handles leads with no value', () => {
      const leads = [{ status: 'new', value: null }];
      const result = CRM.calculateWeightedPipeline(leads);
      expect(result.weighted).toBe(0);
      expect(result.unweighted).toBe(0);
    });

    it('uses 0.1 fallback for unknown status', () => {
      const leads = [{ status: 'unknown_status', value: 1000 }];
      const result = CRM.calculateWeightedPipeline(leads);
      expect(result.weighted).toBe(100);
      expect(result.unweighted).toBe(1000);
    });
  });

  describe('renderForecastWidget', () => {
    it('renders forecast values into container', () => {
      const container = document.getElementById('crm-forecast')!;
      const leads = [
        { status: 'new', value: 1000 },
        { status: 'proposal', value: 2000 },
      ];
      CRM.renderForecastWidget(container, leads);

      expect(container.innerHTML).toContain('Deal-Forecast');
      expect(container.innerHTML).toContain('Gewichtet');
      expect(container.innerHTML).toContain('Ungewichtet');
    });

    it('does nothing when container is null', () => {
      expect(() => CRM.renderForecastWidget(null, [])).not.toThrow();
    });
  });

  describe('renderFollowUpBanner', () => {
    it('renders empty when no stale leads', () => {
      const container = document.getElementById('crm-followup')!;
      const leads = [
        { status: 'new', updated_at: new Date().toISOString(), company_name: 'Fresh', id: '1' },
      ];
      CRM.renderFollowUpBanner(container, leads);
      expect(container.innerHTML).toBe('');
    });

    it('renders banner for stale leads (7+ days old)', () => {
      const container = document.getElementById('crm-followup')!;
      const old = new Date(Date.now() - 10 * 86400000).toISOString();
      const leads = [
        { status: 'new', updated_at: old, company_name: 'Stale Corp', id: 's1' },
      ];
      CRM.renderFollowUpBanner(container, leads);
      expect(container.innerHTML).toContain('Follow-up');
      expect(container.innerHTML).toContain('Stale Corp');
    });
  });
});
