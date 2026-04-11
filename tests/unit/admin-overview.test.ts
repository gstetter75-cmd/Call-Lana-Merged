import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AdminOverview', () => {
  let AO: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'ov-mrr', 'ov-active-customers', 'ov-arr', 'ov-arpu',
      'ov-plan-breakdown', 'ov-top-sales', 'ov-recent-tbody', 'ov-churn-stats',
      'admin-quick-actions', 'admin-leaderboard', 'admin-health-overview',
      'admin-journey-funnel', 'users-tbody', 'orgs-tbody',
      'lb-period', 'lb-content',
    ];
    document.body.innerHTML = ids.map(id => `<div id="${id}"></div>`).join('');

    mocks = setupGlobalMocks();

    (window as any).CONFIG = {
      getPlanPrice: (plan: string) => {
        const map: Record<string, number> = { starter: 149, solo: 149, professional: 299, team: 299, business: 599 };
        return map[plan] || 149;
      },
      getHealthColor: (score: number) => score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
    };

    (window as any).Components = { toast: vi.fn() };
    (window as any).switchTab = vi.fn();
    (window as any).openModal = vi.fn();
    (window as any).AdminAnalytics = undefined;
    (window as any).AdminPdfExport = undefined;

    loadBrowserScript('js/admin-overview.js');
    AO = (window as any).AdminOverview;
  });

  it('exports AdminOverview to window', () => {
    expect(AO).toBeDefined();
    expect(typeof AO).toBe('object');
  });

  it('has renderQuickActions method', () => {
    expect(typeof AO.renderQuickActions).toBe('function');
  });

  it('has calculateHealthScore method', () => {
    expect(typeof AO.calculateHealthScore).toBe('function');
  });

  it('has exportUsersCSV method', () => {
    expect(typeof AO.exportUsersCSV).toBe('function');
  });

  it('has exportOrgsCSV method', () => {
    expect(typeof AO.exportOrgsCSV).toBe('function');
  });

  it('has renderKpiComparison method', () => {
    expect(typeof AO.renderKpiComparison).toBe('function');
  });

  it('has renderLeaderboard method', () => {
    expect(typeof AO.renderLeaderboard).toBe('function');
  });

  it('has renderCustomerFunnel method', () => {
    expect(typeof AO.renderCustomerFunnel).toBe('function');
  });

  describe('calculateHealthScore', () => {
    it('returns a number between 0 and 100', () => {
      const user = {
        id: 'u1',
        last_sign_in_at: new Date().toISOString(),
        organizations: { plan: 'business' },
      };
      const calls = [
        { user_id: 'u1', created_at: new Date().toISOString() },
        { user_id: 'u1', created_at: new Date().toISOString() },
      ];

      const score = AO.calculateHealthScore(user, calls);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns 0 for user with no login and no calls on starter plan', () => {
      const user = { id: 'u1', organizations: { plan: 'starter' } };
      const score = AO.calculateHealthScore(user, []);
      // No login = 0 pts, no calls = 0 pts, starter plan = 10 pts
      expect(score).toBe(10);
    });

    it('gives higher score for business plan', () => {
      const base = { id: 'u1' };
      const starterScore = AO.calculateHealthScore({ ...base, organizations: { plan: 'starter' } }, []);
      const bizScore = AO.calculateHealthScore({ ...base, organizations: { plan: 'business' } }, []);
      expect(bizScore).toBeGreaterThan(starterScore);
    });

    it('caps score at 100', () => {
      const now = new Date();
      const user = {
        id: 'u1',
        last_sign_in_at: now.toISOString(),
        organizations: { plan: 'business' },
      };
      // 25 recent calls
      const calls = Array.from({ length: 25 }, () => ({
        user_id: 'u1',
        created_at: now.toISOString(),
      }));

      const score = AO.calculateHealthScore(user, calls);
      expect(score).toBe(100);
    });
  });

  describe('renderQuickActions', () => {
    it('renders quick action buttons into container', () => {
      const container = document.getElementById('admin-quick-actions')!;
      AO.renderQuickActions(container);
      expect(container.innerHTML).toContain('Schnellaktionen');
      expect(container.innerHTML).toContain('data-action="qa-invite-user"');
      expect(container.innerHTML).toContain('data-action="qa-create-org"');
    });

    it('does nothing when container is null', () => {
      // Should not throw
      expect(() => AO.renderQuickActions(null)).not.toThrow();
    });
  });
});
