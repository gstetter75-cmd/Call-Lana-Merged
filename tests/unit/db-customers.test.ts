import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbCustomers', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/customers.js');
  });

  // ====== getCustomers ======

  describe('getCustomers', () => {
    it('returns customers on success', async () => {
      const customers = [{ id: 'c1', company_name: 'Firma A' }];
      const qm = createQueryMock(customers);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.getCustomers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(customers);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customers');
    });

    it('applies status filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCustomers.getCustomers({ status: 'active' });

      expect(qm.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('applies assigned_to filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCustomers.getCustomers({ assigned_to: 'u-1' });

      expect(qm.eq).toHaveBeenCalledWith('assigned_to', 'u-1');
    });

    it('applies search filter with or()', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCustomers.getCustomers({ search: 'test' });

      expect(qm.or).toHaveBeenCalledWith(
        'company_name.ilike.%test%,contact_name.ilike.%test%,email.ilike.%test%'
      );
    });

    it('applies pagination via range', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCustomers.getCustomers({ page: 2, pageSize: 10 });

      expect(qm.range).toHaveBeenCalledWith(20, 29);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCustomers.getCustomers();

      expect(result.success).toBe(false);
    });
  });

  // ====== getCustomer ======

  describe('getCustomer', () => {
    it('returns customer by id', async () => {
      const customer = { id: 'c1', company_name: 'Firma A' };
      const qm = createQueryMock(customer);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.getCustomer('c1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(customer);
      expect(qm.eq).toHaveBeenCalledWith('id', 'c1');
      expect(qm.single).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCustomers.getCustomer('c1');

      expect(result.success).toBe(false);
    });
  });

  // ====== createCustomer ======

  describe('createCustomer', () => {
    it('creates customer on success', async () => {
      const customer = { id: 'c-new', company_name: 'New Co' };
      const qm = createQueryMock(customer);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.createCustomer({ company_name: 'New Co' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(customer);
    });

    it('validates company_name is required', async () => {
      const result = await (window as any).dbCustomers.createCustomer({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firmenname');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCustomers.createCustomer({ company_name: 'X' });

      expect(result.success).toBe(false);
    });
  });

  // ====== updateCustomer ======

  describe('updateCustomer', () => {
    it('updates customer on success', async () => {
      const updated = { id: 'c1', company_name: 'Updated' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.updateCustomer('c1', { company_name: 'Updated' });

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ company_name: 'Updated' });
      expect(qm.eq).toHaveBeenCalledWith('id', 'c1');
    });
  });

  // ====== deleteCustomer ======

  describe('deleteCustomer', () => {
    it('deletes customer on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.deleteCustomer('c1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customers');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 'c1');
    });
  });

  // ====== convertLeadToCustomer ======

  describe('convertLeadToCustomer', () => {
    it('creates customer from lead and updates lead status', async () => {
      // maybeSingle returns null (no existing customer)
      const checkQm = createQueryMock(null);
      // single returns lead data
      const leadQm = createQueryMock({ id: 'l1', company_name: 'Lead Co', contact_name: 'Max', email: 'max@test.de', phone: '+49', industry: 'IT', notes: 'note', assigned_to: 'u-1', organization_id: 'org-1' });
      // single returns customer
      const custQm = createQueryMock({ id: 'c-new', company_name: 'Lead Co' });
      // update lead / insert activity
      const updateQm = createQueryMock(null);

      let callIdx = 0;
      mocks.supabase.from.mockImplementation((table: string) => {
        callIdx++;
        if (callIdx === 1) return checkQm;  // customers check
        if (callIdx === 2) return leadQm;    // leads select
        if (callIdx === 3) return custQm;    // customers insert
        return updateQm;                      // leads update / activities insert
      });

      const result = await (window as any).dbCustomers.convertLeadToCustomer('l1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'c-new', company_name: 'Lead Co' });
      expect(result.alreadyExists).toBeUndefined();
    });

    it('returns alreadyExists if lead was already converted', async () => {
      const existingQm = createQueryMock({ id: 'c-existing' });
      mocks.supabase.from.mockReturnValue(existingQm);
      // maybeSingle returns existing customer
      existingQm.maybeSingle.mockResolvedValue({ data: { id: 'c-existing' }, error: null });

      const result = await (window as any).dbCustomers.convertLeadToCustomer('l1');

      expect(result.success).toBe(true);
      expect(result.alreadyExists).toBe(true);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCustomers.convertLeadToCustomer('l1');

      expect(result.success).toBe(false);
    });
  });

  // ====== Call Protocols ======

  describe('getCallProtocols', () => {
    it('returns protocols for a customer', async () => {
      const protocols = [{ id: 'p1', subject: 'Call 1' }];
      const qm = createQueryMock(protocols);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.getCallProtocols('c1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(protocols);
      expect(mocks.supabase.from).toHaveBeenCalledWith('call_protocols');
      expect(qm.eq).toHaveBeenCalledWith('customer_id', 'c1');
    });
  });

  describe('createCallProtocol', () => {
    it('creates protocol and updates last_contact_at', async () => {
      const protocol = { id: 'p-new', subject: 'Follow-up' };
      const qm = createQueryMock(protocol);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.createCallProtocol({
        customer_id: 'c1',
        subject: 'Follow-up',
        direction: 'outbound',
      });

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('call_protocols');
      expect(mocks.supabase.from).toHaveBeenCalledWith('customers');
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_activities');
    });
  });

  // ====== Customer Tags ======

  describe('getCustomerTags', () => {
    it('returns tags on success', async () => {
      const tags = [{ id: 't1', name: 'VIP', color: '#ff0000' }];
      const qm = createQueryMock(tags);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.getCustomerTags();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(tags);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_tags');
    });
  });

  describe('createCustomerTag', () => {
    it('creates tag with name and color', async () => {
      const tag = { id: 't-new', name: 'Premium', color: '#00ff00' };
      const qm = createQueryMock(tag);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.createCustomerTag('Premium', '#00ff00');

      expect(result.success).toBe(true);
      expect(qm.insert).toHaveBeenCalledWith([{ name: 'Premium', color: '#00ff00' }]);
    });

    it('uses default color when none provided', async () => {
      const qm = createQueryMock({ id: 't-new', name: 'Basic' });
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCustomers.createCustomerTag('Basic');

      expect(qm.insert).toHaveBeenCalledWith([{ name: 'Basic', color: '#7c3aed' }]);
    });
  });

  describe('assignCustomerTag', () => {
    it('assigns tag to customer', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.assignCustomerTag('c1', 't1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_tag_assignments');
      expect(qm.insert).toHaveBeenCalledWith([{ customer_id: 'c1', tag_id: 't1' }]);
    });
  });

  describe('removeCustomerTag', () => {
    it('removes tag assignment', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.removeCustomerTag('c1', 't1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_tag_assignments');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('customer_id', 'c1');
      expect(qm.eq).toHaveBeenCalledWith('tag_id', 't1');
    });
  });

  // ====== Customer Activities ======

  describe('getCustomerActivities', () => {
    it('returns activities for customer', async () => {
      const activities = [{ id: 'a1', type: 'call', title: 'Called' }];
      const qm = createQueryMock(activities);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.getCustomerActivities('c1', 25);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(activities);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_activities');
      expect(qm.eq).toHaveBeenCalledWith('customer_id', 'c1');
      expect(qm.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('logCustomerActivity', () => {
    it('logs activity on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCustomers.logCustomerActivity('c1', 'note', 'Added note', 'Details');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customer_activities');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          customer_id: 'c1',
          actor_id: 'test-uid',
          type: 'note',
          title: 'Added note',
          details: 'Details',
        }),
      ]);
    });

    it('returns false when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCustomers.logCustomerActivity('c1', 'note', 'test', '');

      expect(result.success).toBe(false);
    });
  });
});
