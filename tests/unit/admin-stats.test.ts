import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AdminStats', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    // DOM elements required by admin-stats.js
    const ids = [
      'sys-total-users', 'sys-total-orgs', 'sys-new-leads', 'sys-active-leads',
      'sys-open-tasks', 'sys-conversion', 'sys-role-superadmin', 'sys-role-sales',
      'sys-role-customer', 'sys-plan-solo', 'sys-plan-team', 'sys-plan-business',
      'sys-total-assistants', 'sys-activity-tbody',
      'ov-mrr', 'ov-active-customers', 'ov-arr', 'ov-arpu',
      'ov-plan-breakdown', 'ov-top-sales', 'ov-recent-tbody', 'ov-churn-stats',
      'ov-mrr-chart', 'ov-mrr-growth',
      'admin-quick-actions', 'admin-leaderboard', 'admin-health-overview',
      'admin-journey-funnel', 'admin-goals', 'admin-announcements',
    ];
    document.body.innerHTML = ids.map(id => `<div id="${id}"></div>`).join('');

    mocks = setupGlobalMocks();

    (window as any).CONFIG = {
      PLANS: { starter: { price: 149 }, professional: { price: 299 }, business: { price: 599 } },
      getPlanPrice: (plan: string) => {
        const map: Record<string, number> = { starter: 149, solo: 149, professional: 299, team: 299, business: 599 };
        return map[plan] || 149;
      },
      getPlanLabel: (p: string) => p,
      getHealthColor: () => '#10b981',
    };

    (window as any).clanaDB = {
      getAllProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getOrganizations: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getLeads: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getTasks: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getAllAssistants: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCalls: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCustomers: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    (window as any).AdminOverview = {
      renderOverview: vi.fn(),
      renderQuickActions: vi.fn(),
      renderKpiComparison: vi.fn(),
      renderLeaderboard: vi.fn(),
      renderHealthOverview: vi.fn(),
      renderCustomerFunnel: vi.fn(),
    };

    (window as any).AdminAudit = {
      renderGoals: vi.fn(),
      renderAnnouncements: vi.fn(),
    };

    loadBrowserScript('js/admin-stats.js');
  });

  it('exports loadSystemStats to window', () => {
    expect((window as any).loadSystemStats).toBeDefined();
    expect(typeof (window as any).loadSystemStats).toBe('function');
  });

  it('exports loadOverview to window', () => {
    expect((window as any).loadOverview).toBeDefined();
    expect(typeof (window as any).loadOverview).toBe('function');
  });

  it('exports renderMrrChart to window', () => {
    expect((window as any).renderMrrChart).toBeDefined();
    expect(typeof (window as any).renderMrrChart).toBe('function');
  });

  describe('loadSystemStats', () => {
    it('updates DOM elements with user and org counts', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'u1', role: 'superadmin', created_at: '2025-01-01T00:00:00Z' },
          { id: 'u2', role: 'customer', created_at: '2025-01-01T00:00:00Z' },
          { id: 'u3', role: 'sales', created_at: '2025-01-01T00:00:00Z' },
        ],
      });
      (window as any).clanaDB.getOrganizations.mockResolvedValue({
        success: true,
        data: [
          { id: 'o1', plan: 'starter' },
          { id: 'o2', plan: 'business' },
        ],
      });

      await (window as any).loadSystemStats();

      expect(document.getElementById('sys-total-users')!.textContent).toBe('3');
      expect(document.getElementById('sys-total-orgs')!.textContent).toBe('2');
    });

    it('calculates role distribution correctly', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'u1', role: 'superadmin', created_at: '2025-01-01T00:00:00Z' },
          { id: 'u2', role: 'customer', created_at: '2025-01-01T00:00:00Z' },
          { id: 'u3', role: 'customer', created_at: '2025-01-01T00:00:00Z' },
          { id: 'u4', role: 'sales', created_at: '2025-01-01T00:00:00Z' },
        ],
      });

      await (window as any).loadSystemStats();

      expect(document.getElementById('sys-role-superadmin')!.textContent).toBe('1');
      expect(document.getElementById('sys-role-sales')!.textContent).toBe('1');
      expect(document.getElementById('sys-role-customer')!.textContent).toBe('2');
    });

    it('calculates plan distribution correctly', async () => {
      (window as any).clanaDB.getOrganizations.mockResolvedValue({
        success: true,
        data: [
          { id: 'o1', plan: 'starter' },
          { id: 'o2', plan: 'solo' },
          { id: 'o3', plan: 'professional' },
          { id: 'o4', plan: 'business' },
        ],
      });

      await (window as any).loadSystemStats();

      expect(document.getElementById('sys-plan-solo')!.textContent).toBe('2');
      expect(document.getElementById('sys-plan-team')!.textContent).toBe('1');
      expect(document.getElementById('sys-plan-business')!.textContent).toBe('1');
    });

    it('shows no-activity message when no recent items', async () => {
      await (window as any).loadSystemStats();

      const tbody = document.getElementById('sys-activity-tbody')!;
      expect(tbody.innerHTML).toContain('Keine Aktivität');
    });
  });
});
