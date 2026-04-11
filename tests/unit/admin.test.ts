import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock, createSupabaseMock } from './setup';

describe('Admin Dashboard', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="sidebar-container"></div>
      <div id="breadcrumb-page"></div>
      <div class="tab-btn" data-tab="overview"></div>
      <div class="tab-btn" data-tab="users"></div>
      <div class="tab-btn" data-tab="customers"></div>
      <div class="page-section" id="tab-overview"></div>
      <div class="page-section" id="tab-users"></div>
      <div class="page-section" id="tab-customers"></div>
      <div id="users-tbody"></div>
      <div id="orgs-tbody"></div>
      <div id="customers-tbody"></div>
      <div id="user-search"></div>
      <div id="customer-search"></div>
      <div id="stat-total-users"></div>
      <div id="stat-total-orgs"></div>
      <div id="stat-active-users"></div>
      <div id="stat-total-calls"></div>
      <div id="stat-monthly-revenue"></div>
      <div id="stat-plan-breakdown"></div>
      <div id="admin-overview-customers"></div>
      <div id="overview-panel"></div>
      <div id="modal-role" class="modal-overlay"></div>
      <div id="modal-add-org" class="modal-overlay"></div>
      <div id="role-user-email"></div>
      <div id="role-select"></div>
      <div id="role-org-select"></div>
      <button id="btn-add-org"></button>
      <button id="btn-create-org"></button>
      <button id="btn-save-role"></button>
      <button id="sidebar-logout"></button>
    `;

    mocks = setupGlobalMocks();

    (window as any).AuthGuard = {
      requireSuperadmin: vi.fn().mockResolvedValue({
        id: 'admin-id',
        role: 'superadmin',
        first_name: 'Admin',
        last_name: 'User',
      }),
    };
    (window as any).Components = {
      loadSidebar: vi.fn().mockResolvedValue(undefined),
      toast: vi.fn(),
    };
    (window as any).openModal = vi.fn();
    (window as any).closeModal = vi.fn();
    (window as any).ImpersonationManager = { start: vi.fn() };
    (window as any).AdminAudit = undefined;
    (window as any).AdminExtra = undefined;
    (window as any).AdminAnalytics = undefined;
    (window as any).SystemHealth = undefined;
    (window as any).IntegrationsHub = undefined;
    (window as any).CONFIG = {
      getPlanLabel: (p: string) => p,
      getPlanPrice: () => 29,
      getHealthColor: () => '#10b981',
      CUSTOMER_STATUSES: { active: { label: 'Aktiv', color: '#10b981' } },
      PLANS: { starter: { price: 149 }, professional: { price: 299 }, business: { price: 599 } },
    };
    (window as any).AdminOverview = {
      renderOverview: vi.fn(),
      renderQuickActions: vi.fn(),
      renderKpiComparison: vi.fn(),
      renderLeaderboard: vi.fn(),
      renderHealthOverview: vi.fn(),
      renderCustomerFunnel: vi.fn(),
      exportUsersCSV: vi.fn(),
      exportOrgsCSV: vi.fn(),
    };

    // Replace passthrough mocks with real sanitize implementations
    (window as any).clanaUtils.sanitizeHtml = (str: any) => {
      if (str == null) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    };
    (window as any).clanaUtils.sanitizeAttr = (str: any) => {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/\\/g, '&#92;');
    };

    (window as any).clanaDB = {
      getAllProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getOrganizations: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getLeads: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getTasks: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCalls: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCustomers: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getAllCustomerTags: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getAllAssistants: vi.fn().mockResolvedValue({ success: true, data: [] }),
      updateProfile: vi.fn().mockResolvedValue({ success: true }),
      createOrganization: vi.fn().mockResolvedValue({ success: true, data: { id: 'new-org' } }),
    };

    // Add missing DOM elements that init() + loadSystemStats() + loadOverview() require
    const extraEls = [
      'sys-total-users', 'sys-total-orgs', 'sys-new-leads', 'sys-active-leads',
      'sys-open-tasks', 'sys-conversion', 'sys-role-distribution', 'sys-lead-status-distribution',
      'sys-role-superadmin', 'sys-role-sales', 'sys-role-customer',
      'sys-plan-solo', 'sys-plan-team', 'sys-plan-business',
      'sys-total-assistants', 'sys-activity-tbody',
      'ov-mrr', 'ov-active-customers', 'ov-arr', 'ov-arpu',
      'ov-plan-breakdown', 'ov-top-sales', 'ov-recent-tbody', 'ov-churn-stats',
      'ov-mrr-chart', 'ov-mrr-growth',
      'admin-quick-actions', 'admin-leaderboard', 'admin-health-overview', 'admin-journey-funnel',
    ];
    extraEls.forEach(id => {
      if (!document.getElementById(id)) {
        const el = document.createElement('div');
        el.id = id;
        document.body.appendChild(el);
      }
    });

    loadBrowserScript('js/admin.js');
    loadBrowserScript('js/admin-stats.js');
  });

  describe('switchTab', () => {
    it('activates the correct tab section', () => {
      const switchTab = (window as any).switchTab;
      switchTab('users');
      const section = document.getElementById('tab-users');
      expect(section?.classList.contains('active')).toBe(true);
    });

    it('updates breadcrumb text', () => {
      const switchTab = (window as any).switchTab;
      switchTab('customers');
      expect(document.getElementById('breadcrumb-page')?.textContent).toBe('Kunden');
    });

    it('falls back to overview for invalid tab', () => {
      const switchTab = (window as any).switchTab;
      switchTab('malicious-tab');
      const section = document.getElementById('tab-overview');
      expect(section?.classList.contains('active')).toBe(true);
    });

    it('prevents XSS via tab name injection', () => {
      const switchTab = (window as any).switchTab;
      switchTab('<script>alert(1)</script>');
      // Should fall back to overview since injected value is not in whitelist
      expect(document.getElementById('breadcrumb-page')?.textContent).toBe('Übersicht');
    });
  });

  describe('loadUsers', () => {
    it('renders user rows with sanitized data', async () => {
      const qm = createQueryMock([
        {
          id: 'u1',
          first_name: '<script>xss</script>',
          last_name: 'Test',
          email: 'test@test.de',
          role: 'customer',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          organizations: { name: 'Org1' },
          organization_id: 'org1',
        },
      ]);
      mocks.supabase.from.mockReturnValue(qm);

      // clanaDB.getAllProfiles needs to exist
      (window as any).clanaDB = {
        getAllProfiles: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: 'u1',
              first_name: '<script>xss</script>',
              last_name: 'Test',
              email: 'test@test.de',
              role: 'customer',
              is_active: true,
              created_at: '2025-01-01T00:00:00Z',
              organizations: { name: 'Org1' },
              organization_id: 'org1',
            },
          ],
        }),
        getOrganizations: vi.fn().mockResolvedValue({ success: true, data: [] }),
      };

      const loadUsers = (window as any).loadUsers;
      await loadUsers();

      const tbody = document.getElementById('users-tbody')!;
      // XSS payload should be escaped
      expect(tbody.innerHTML).not.toContain('<script>');
      expect(tbody.innerHTML).toContain('test@test.de');
      // Should use data-action instead of onclick
      expect(tbody.innerHTML).toContain('data-action="edit-role"');
      expect(tbody.innerHTML).not.toContain('onclick=');
    });

    it('shows empty state when no users', async () => {
      (window as any).clanaDB = {
        getAllProfiles: vi.fn().mockResolvedValue({ success: true, data: [] }),
      };

      await (window as any).loadUsers();
      const tbody = document.getElementById('users-tbody')!;
      expect(tbody.innerHTML).toContain('Keine Benutzer');
    });
  });

  describe('VALID_ADMIN_TABS whitelist', () => {
    it('contains expected tabs', () => {
      const tabs = (window as any).VALID_ADMIN_TABS;
      expect(tabs).toContain('overview');
      expect(tabs).toContain('users');
      expect(tabs).toContain('customers');
      expect(tabs).toContain('system');
      expect(tabs).not.toContain('');
      expect(tabs).not.toContain(undefined);
    });
  });

  describe('loadCustomers', () => {
    it('renders only customers (not sales/admin roles)', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'c1', first_name: 'Kunde', last_name: 'Eins', email: 'k@test.de', role: 'customer', is_active: true, created_at: '2025-01-01T00:00:00Z', organizations: { name: 'Org', plan: 'starter' } },
          { id: 'a1', first_name: 'Admin', last_name: 'User', email: 'a@test.de', role: 'superadmin', is_active: true, created_at: '2025-01-01T00:00:00Z' },
          { id: 's1', first_name: 'Sales', last_name: 'Rep', email: 's@test.de', role: 'sales', is_active: true, created_at: '2025-01-01T00:00:00Z' },
        ],
      });

      await (window as any).loadCustomers();
      const tbody = document.getElementById('customers-tbody')!;

      // Should only show the customer, not admin/sales
      expect(tbody.innerHTML).toContain('k@test.de');
      expect(tbody.innerHTML).not.toContain('a@test.de');
      expect(tbody.innerHTML).not.toContain('s@test.de');
    });

    it('shows empty state when no customers', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'a1', role: 'superadmin', created_at: '2025-01-01T00:00:00Z' },
        ],
      });

      await (window as any).loadCustomers();
      const tbody = document.getElementById('customers-tbody')!;
      expect(tbody.innerHTML).toContain('Keine Kunden');
    });

    it('sanitizes customer data in output', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'xss', first_name: '<img onerror=alert(1)>', last_name: '', email: 'test@test.de', role: 'customer', is_active: true, created_at: '2025-01-01T00:00:00Z', organizations: { plan: 'starter' } },
        ],
      });

      await (window as any).loadCustomers();
      const tbody = document.getElementById('customers-tbody')!;
      expect(tbody.innerHTML).not.toContain('<img');
      expect(tbody.innerHTML).toContain('&lt;img');
    });

    it('uses data-action instead of onclick for detail button', async () => {
      (window as any).clanaDB.getAllProfiles.mockResolvedValue({
        success: true,
        data: [
          { id: 'c1', first_name: 'Test', last_name: '', email: 'c@t.de', role: 'customer', is_active: true, created_at: '2025-01-01T00:00:00Z', organizations: { plan: 'starter' } },
        ],
      });

      await (window as any).loadCustomers();
      const tbody = document.getElementById('customers-tbody')!;
      expect(tbody.innerHTML).toContain('data-action="view-customer"');
      expect(tbody.innerHTML).not.toContain('onclick=');
    });
  });
});
