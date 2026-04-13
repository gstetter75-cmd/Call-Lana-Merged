import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Sales CRM', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="sidebar-container"></div>
      <div id="breadcrumb-page"></div>
      <div class="tab-btn" data-tab="pipeline"></div>
      <div class="tab-btn" data-tab="leads"></div>
      <div class="tab-btn" data-tab="tasks"></div>
      <div class="tab-btn" data-tab="customers"></div>
      <div class="tab-btn" data-tab="availability"></div>
      <div class="tab-btn" data-tab="commission"></div>
      <div class="page-section" id="tab-pipeline"></div>
      <div class="page-section" id="tab-leads"></div>
      <div class="page-section" id="tab-tasks"></div>
      <div class="page-section" id="tab-customers"></div>
      <div class="page-section" id="tab-availability"></div>
      <div class="page-section" id="tab-commission"></div>
      <div id="pipeline-board"></div>
      <div id="leads-tbody"></div>
      <input id="lead-search" />
      <select id="lead-status-filter"><option value="">Alle</option></select>
      <div id="stat-total-leads"></div>
      <div id="stat-won"></div>
      <div id="stat-pipeline-value"></div>
      <div id="stat-conversion"></div>
      <div id="conversion-funnel"></div>
      <div id="won-lost-chart"></div>
      <div id="stage-value-bars"></div>
      <div id="followup-banner"></div>
      <div id="deal-forecast-widget"></div>
      <div id="pipeline-period"><option value="30">30</option></div>
      <input id="lead-company" />
      <input id="lead-contact" />
      <input id="lead-email" />
      <input id="lead-phone" />
      <input id="lead-value" />
      <select id="lead-industry"></select>
      <select id="lead-source"></select>
      <textarea id="lead-notes"></textarea>
      <div id="lead-dup-warning" style="display:none"></div>
      <button id="btn-save-lead"></button>
      <button id="btn-add-lead-pipeline"></button>
      <button id="btn-add-lead"></button>
      <button id="btn-add-task"></button>
      <button id="btn-set-avail"></button>
      <button id="btn-save-task"></button>
      <button id="btn-save-avail"></button>
      <select id="task-lead"></select>
      <input id="avail-date" />
      <div id="modal-add-lead" class="modal-overlay"></div>
      <div id="modal-add-task" class="modal-overlay"></div>
      <div id="modal-avail" class="modal-overlay"></div>
      <div id="modal-lead-detail" class="modal-overlay"></div>
      <div id="lead-detail-content"></div>
      <button id="sidebar-logout"></button>
    `;

    mocks = setupGlobalMocks();

    (window as any).currentProfile = { id: 'test', role: 'sales', organization_id: 'org1' };

    (window as any).AuthGuard = {
      requireSales: vi.fn().mockResolvedValue({ id: 'test', role: 'sales', organization_id: 'org1' }),
    };
    (window as any).Components = {
      loadSidebar: vi.fn().mockResolvedValue(undefined),
      toast: vi.fn(),
    };
    (window as any).openModal = vi.fn();
    (window as any).closeModal = vi.fn();
    (window as any).KeyboardShortcuts = { init: vi.fn() };
    (window as any).CONFIG = {
      getPlanLabel: (p: string) => p,
      getPlanPrice: () => 29,
      getHealthColor: () => '#10b981',
      getIndustryLabel: (i: string) => i || 'Unbekannt',
      CUSTOMER_STATUSES: { active: { label: 'Aktiv', color: '#10b981' } },
    };

    (window as any).clanaDB = {
      getLeads: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getLead: vi.fn().mockResolvedValue({ success: true, data: {} }),
      createLead: vi.fn().mockResolvedValue({ success: true }),
      updateLead: vi.fn().mockResolvedValue({ success: true }),
      deleteLead: vi.fn().mockResolvedValue({ success: true }),
      calculateLeadScore: vi.fn().mockReturnValue({ score: 50 }),
      checkDuplicate: vi.fn().mockResolvedValue({ duplicates: [] }),
      getEmailTemplates: vi.fn().mockResolvedValue({ success: true, data: [] }),
      subscribeTable: vi.fn(),
      createNote: vi.fn().mockResolvedValue({ success: true }),
      getCustomers: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    // Sanitize helpers
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
        .replace(/>/g, '&gt;');
    };

    // Stub cross-file references that sales.js expects to exist
    (window as any).exportCustomersCSV = vi.fn();
    (window as any).NotificationCenter = undefined;
    (window as any).CRMEnhancements = undefined;
    (window as any).AvailabilityModule = undefined;

    loadBrowserScript('js/sales.js');
  });

  describe('window exports', () => {
    it('exposes switchTab on window', () => {
      expect(typeof (window as any).switchTab).toBe('function');
    });

    it('exposes loadLeads on window', () => {
      expect(typeof (window as any).loadLeads).toBe('function');
    });

    it('exposes renderPipeline on window', () => {
      expect(typeof (window as any).renderPipeline).toBe('function');
    });

    it('exposes saveLead on window', () => {
      expect(typeof (window as any).saveLead).toBe('function');
    });

    it('exposes clearLeadForm on window', () => {
      expect(typeof (window as any).clearLeadForm).toBe('function');
    });
  });

  describe('PIPELINE_STAGES', () => {
    it('has 6 expected stages', () => {
      const stages = (window as any).PIPELINE_STAGES;
      expect(stages).toHaveLength(6);
      const keys = stages.map((s: any) => s.key);
      expect(keys).toEqual(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']);
    });
  });

  describe('switchTab', () => {
    it('activates the correct tab section', () => {
      (window as any).switchTab('leads');
      const section = document.getElementById('tab-leads');
      expect(section?.classList.contains('active')).toBe(true);
    });

    it('deactivates other sections', () => {
      (window as any).switchTab('leads');
      const pipeline = document.getElementById('tab-pipeline');
      expect(pipeline?.classList.contains('active')).toBe(false);
    });

    it('updates breadcrumb text', () => {
      (window as any).switchTab('customers');
      expect(document.getElementById('breadcrumb-page')?.textContent).toBe('Kunden');
    });

    it('falls back to pipeline for invalid tab', () => {
      (window as any).switchTab('invalid-tab');
      const section = document.getElementById('tab-pipeline');
      expect(section?.classList.contains('active')).toBe(true);
    });
  });

  describe('clearLeadForm', () => {
    it('resets all form fields to empty', () => {
      const fields = ['lead-company', 'lead-contact', 'lead-email', 'lead-phone', 'lead-value', 'lead-industry', 'lead-notes'];
      fields.forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = 'test-value';
      });

      (window as any).clearLeadForm();

      fields.forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) expect(el.value).toBe('');
      });
    });
  });

  describe('loadLeads', () => {
    it('calls clanaDB.getLeads', async () => {
      await (window as any).loadLeads();
      expect((window as any).clanaDB.getLeads).toHaveBeenCalled();
    });

    it('sets window.allLeads from result data', async () => {
      const testLeads = [{ id: '1', company_name: 'TestCo', status: 'new', score: 80 }];
      (window as any).clanaDB.getLeads.mockResolvedValue({ success: true, data: testLeads });

      await (window as any).loadLeads();
      expect((window as any).allLeads).toEqual(testLeads);
    });

    it('shows toast on error', async () => {
      (window as any).clanaDB.getLeads.mockResolvedValue({ success: false, error: 'DB error' });

      await (window as any).loadLeads();
      expect((window as any).Components.toast).toHaveBeenCalledWith(
        'Fehler beim Laden der Leads', 'error'
      );
    });
  });
});
