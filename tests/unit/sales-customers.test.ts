import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Sales Customers Module', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="sidebar-container"></div>
      <div id="customers-tbody"></div>
      <input id="cust-search" />
      <select id="cust-status-filter"><option value="">Alle</option></select>
      <div id="cust-stat-total"></div>
      <div id="cust-stat-active"></div>
      <div id="cust-stat-health"></div>
      <div id="cust-stat-revenue"></div>
      <div id="cust-detail-content"></div>
      <div id="cust-detail-tab-content"></div>
      <div id="cust-notes-list"></div>
      <textarea id="cust-note-input"></textarea>
      <div id="cust-modal-title"></div>
      <button id="btn-save-customer"></button>
      <input id="cust-company" />
      <input id="cust-contact" />
      <input id="cust-email" />
      <input id="cust-phone" />
      <select id="cust-industry"></select>
      <select id="cust-plan"></select>
      <input id="cust-website" />
      <input id="cust-address" />
      <textarea id="cust-notes-field"></textarea>
      <input id="cp-customer-id" />
      <input id="cp-called-at" />
      <select id="cp-direction"></select>
      <select id="cp-outcome"></select>
      <input id="cp-duration" />
      <input id="cp-subject" />
      <textarea id="cp-notes"></textarea>
      <input id="cp-followup-date" />
      <input id="cp-create-task" type="checkbox" />
      <button id="btn-csv-import"></button>
      <input id="csv-file-input" />
      <div id="csv-preview-content"></div>
      <div id="csv-import-count"></div>
      <div id="modal-add-customer" class="modal-overlay"></div>
      <div id="modal-customer-detail" class="modal-overlay"></div>
      <div id="modal-call-protocol" class="modal-overlay"></div>
      <div id="modal-csv-import" class="modal-overlay"></div>
    `;

    mocks = setupGlobalMocks();

    (window as any).currentProfile = { id: 'test', role: 'sales', organization_id: 'org1' };

    (window as any).Components = {
      loadSidebar: vi.fn().mockResolvedValue(undefined),
      toast: vi.fn(),
    };
    (window as any).openModal = vi.fn();
    (window as any).closeModal = vi.fn();
    (window as any).CONFIG = {
      getPlanLabel: (p: string) => p || 'starter',
      getPlanPrice: () => 149,
      getHealthColor: (s: number) => s >= 70 ? '#10b981' : '#ef4444',
      getIndustryLabel: (i: string) => i || 'Unbekannt',
      CUSTOMER_STATUSES: {
        active: { label: 'Aktiv', color: '#10b981' },
        churned: { label: 'Abgewandert', color: '#ef4444' },
      },
      CALL_DIRECTIONS: {
        outbound: { label: 'Ausgehend', icon: '📞' },
        inbound: { label: 'Eingehend', icon: '📲' },
      },
      CALL_OUTCOMES: {
        reached: { label: 'Erreicht' },
        not_reached: { label: 'Nicht erreicht' },
      },
    };

    (window as any).clanaDB = {
      getCustomers: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCustomer: vi.fn().mockResolvedValue({ success: true, data: {} }),
      createCustomer: vi.fn().mockResolvedValue({ success: true }),
      updateCustomer: vi.fn().mockResolvedValue({ success: true }),
      getCustomerTags: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getCallProtocols: vi.fn().mockResolvedValue({ success: true, data: [] }),
      createCallProtocol: vi.fn().mockResolvedValue({ success: true }),
      getCustomerActivities: vi.fn().mockResolvedValue({ success: true, data: [] }),
      logCustomerActivity: vi.fn().mockResolvedValue({ success: true }),
      bulkCreateCustomers: vi.fn().mockResolvedValue({ success: true, count: 0 }),
      convertLeadToCustomer: vi.fn().mockResolvedValue({ success: true }),
      createTask: vi.fn().mockResolvedValue({ success: true }),
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

    loadBrowserScript('js/sales-customers.js');
  });

  describe('window exports', () => {
    it('exposes loadCustomers on window', () => {
      expect(typeof (window as any).loadCustomers).toBe('function');
    });

    it('exposes loadCustomerTags on window', () => {
      expect(typeof (window as any).loadCustomerTags).toBe('function');
    });

    it('exposes viewCustomer on window', () => {
      expect(typeof (window as any).viewCustomer).toBe('function');
    });

    it('exposes renderCustomersTable on window', () => {
      expect(typeof (window as any).renderCustomersTable).toBe('function');
    });

    it('exposes exportCustomersCSV on window', () => {
      expect(typeof (window as any).exportCustomersCSV).toBe('function');
    });

    it('exposes openNewCustomerModal on window', () => {
      expect(typeof (window as any).openNewCustomerModal).toBe('function');
    });

    it('exposes saveCustomer on window', () => {
      expect(typeof (window as any).saveCustomer).toBe('function');
    });
  });

  describe('loadCustomers', () => {
    it('calls clanaDB.getCustomers with assigned_to', async () => {
      await (window as any).loadCustomers();
      expect((window as any).clanaDB.getCustomers).toHaveBeenCalledWith({
        assigned_to: 'test',
      });
    });

    it('sets customersLoaded flag to true', async () => {
      await (window as any).loadCustomers();
      expect((window as any).customersLoaded).toBe(true);
    });
  });

  describe('renderCustomersTable', () => {
    it('shows empty state when no customers', () => {
      (window as any).renderCustomersTable();
      const tbody = document.getElementById('customers-tbody')!;
      expect(tbody.innerHTML).toContain('Keine Kunden gefunden');
    });
  });

  describe('exportCustomersCSV', () => {
    it('shows toast when no customers to export', () => {
      (window as any).exportCustomersCSV();
      expect((window as any).Components.toast).toHaveBeenCalledWith(
        'Keine Kunden zum Exportieren', 'error'
      );
    });
  });

  describe('openNewCustomerModal', () => {
    it('sets modal title to Neuer Kunde', () => {
      (window as any).openNewCustomerModal();
      expect(document.getElementById('cust-modal-title')?.textContent).toBe('Neuer Kunde');
    });

    it('clears form fields', () => {
      (document.getElementById('cust-company') as HTMLInputElement).value = 'Old Value';
      (window as any).openNewCustomerModal();
      expect((document.getElementById('cust-company') as HTMLInputElement).value).toBe('');
    });

    it('opens the add-customer modal', () => {
      (window as any).openNewCustomerModal();
      expect((window as any).openModal).toHaveBeenCalledWith('modal-add-customer');
    });
  });
});
