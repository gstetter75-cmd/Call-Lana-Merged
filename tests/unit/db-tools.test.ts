import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbTools', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/tools.js');
  });

  // ====== Working Hours ======

  describe('getWorkingHours', () => {
    it('returns working hours for user', async () => {
      const hours = [{ day_of_week: 1, start_time: '09:00', end_time: '17:00' }];
      const qm = createQueryMock(hours);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.getWorkingHours();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(hours);
      expect(mocks.supabase.from).toHaveBeenCalledWith('working_hours');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
      expect(qm.order).toHaveBeenCalledWith('day_of_week');
    });

    it('accepts optional userId', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbTools.getWorkingHours('other-uid');

      expect(qm.eq).toHaveBeenCalledWith('user_id', 'other-uid');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbTools.getWorkingHours();

      expect(result.success).toBe(false);
    });
  });

  describe('setWorkingHours', () => {
    it('deletes existing and inserts new hours', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const hours = [{ day_of_week: 1, start_time: '09:00', end_time: '17:00' }];
      const result = await (window as any).dbTools.setWorkingHours(hours);

      expect(result.success).toBe(true);
      // First call: delete
      expect(qm.delete).toHaveBeenCalled();
      // Second call: insert
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'test-uid', day_of_week: 1 }),
      ]);
    });

    it('handles empty array (delete only)', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.setWorkingHours([]);

      expect(result.success).toBe(true);
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.insert).not.toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbTools.setWorkingHours([]);

      expect(result.success).toBe(false);
    });
  });

  // ====== Time Off ======

  describe('getTimeOffRequests', () => {
    it('returns requests for user', async () => {
      const requests = [{ id: 'r1', type: 'vacation', status: 'approved' }];
      const qm = createQueryMock(requests);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.getTimeOffRequests(null, 2025);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(requests);
      expect(mocks.supabase.from).toHaveBeenCalledWith('time_off_requests');
      expect(qm.gte).toHaveBeenCalledWith('start_date', '2025-01-01');
      expect(qm.lte).toHaveBeenCalledWith('start_date', '2025-12-31');
    });

    it('does not apply year filter when not provided', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbTools.getTimeOffRequests();

      expect(qm.gte).not.toHaveBeenCalled();
    });
  });

  describe('createTimeOffRequest', () => {
    it('creates request with user_id', async () => {
      const req = { id: 'r-new', type: 'vacation', user_id: 'test-uid' };
      const qm = createQueryMock(req);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.createTimeOffRequest({ type: 'vacation', start_date: '2025-06-01', end_date: '2025-06-10' });

      expect(result.success).toBe(true);
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'test-uid', type: 'vacation' }),
      ]);
    });
  });

  describe('updateTimeOffStatus', () => {
    it('updates status', async () => {
      const updated = { id: 'r1', status: 'rejected' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.updateTimeOffStatus('r1', 'rejected');

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ status: 'rejected' });
    });

    it('sets approved_by and approved_at when status is approved', async () => {
      const updated = { id: 'r1', status: 'approved' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.updateTimeOffStatus('r1', 'approved', 'admin-uid');

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approved_by: 'admin-uid',
          approved_at: expect.any(String),
        })
      );
    });
  });

  // ====== Vacation Balance ======

  describe('getVacationBalance', () => {
    it('computes remaining days', async () => {
      // quota query
      const quotaQm = createQueryMock({ total_days: 28, carried_over: 2 });
      // requests query
      const requestsQm = createQueryMock([{ days_count: 5 }, { days_count: 3 }]);

      let callIdx = 0;
      mocks.supabase.from.mockImplementation(() => {
        callIdx++;
        return callIdx === 1 ? quotaQm : requestsQm;
      });

      const result = await (window as any).dbTools.getVacationBalance('test-uid', 2025);

      expect(result.success).toBe(true);
      expect(result.data.totalDays).toBe(30); // 28 + 2
      expect(result.data.usedDays).toBe(8);   // 5 + 3
      expect(result.data.remaining).toBe(22);  // 30 - 8
    });

    it('defaults to 30 days when no quota exists', async () => {
      const quotaQm = createQueryMock(null);
      const requestsQm = createQueryMock([]);

      let callIdx = 0;
      mocks.supabase.from.mockImplementation(() => {
        callIdx++;
        return callIdx === 1 ? quotaQm : requestsQm;
      });

      const result = await (window as any).dbTools.getVacationBalance();

      expect(result.success).toBe(true);
      expect(result.data.totalDays).toBe(30);
      expect(result.data.remaining).toBe(30);
    });
  });

  // ====== Team Availability ======

  describe('getTeamAvailability', () => {
    it('returns timeOff and workHours', async () => {
      const timeOffData = [{ user_id: 'u-1', type: 'vacation' }];
      const workHoursData = [{ user_id: 'u-1', day_of_week: 1 }];

      const timeOffQm = createQueryMock(timeOffData);
      const workHoursQm = createQueryMock(workHoursData);

      let callIdx = 0;
      mocks.supabase.from.mockImplementation(() => {
        callIdx++;
        return callIdx === 1 ? timeOffQm : workHoursQm;
      });

      const result = await (window as any).dbTools.getTeamAvailability('2025-01-01', '2025-01-31');

      expect(result.success).toBe(true);
      expect(result.timeOff).toEqual(timeOffData);
      expect(result.workHours).toEqual(workHoursData);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbTools.getTeamAvailability('2025-01-01', '2025-01-31');

      expect(result.success).toBe(false);
    });
  });

  // ====== Lead Scoring ======

  describe('calculateLeadScore', () => {
    it('scores high-value industry', () => {
      const { score, factors } = (window as any).dbTools.calculateLeadScore({
        industry: 'handwerk',
      });

      expect(factors.industry).toBe(20);
      expect(score).toBeGreaterThanOrEqual(20);
    });

    it('scores high value lead', () => {
      const { score, factors } = (window as any).dbTools.calculateLeadScore({
        value: 6000,
      });

      expect(factors.value).toBe(30);
      expect(score).toBeGreaterThanOrEqual(30);
    });

    it('scores completeness of data', () => {
      const { factors } = (window as any).dbTools.calculateLeadScore({
        email: 'test@test.de',
        phone: '+49123',
        contact_name: 'Max',
        industry: 'handwerk',
      });

      expect(factors.completeness).toBe(20); // 5+5+5+5
    });

    it('scores recent activity', () => {
      const { factors } = (window as any).dbTools.calculateLeadScore({
        updated_at: new Date().toISOString(),
      });

      expect(factors.recency).toBe(30);
    });

    it('caps score at 100', () => {
      const { score } = (window as any).dbTools.calculateLeadScore({
        industry: 'handwerk',
        value: 10000,
        email: 'a@b.de',
        phone: '+49',
        contact_name: 'Max',
        updated_at: new Date().toISOString(),
      });

      expect(score).toBe(100);
    });

    it('returns 0 for empty lead', () => {
      const { score } = (window as any).dbTools.calculateLeadScore({});

      expect(score).toBe(0);
    });
  });

  // ====== Email Templates ======

  describe('getEmailTemplates', () => {
    it('returns templates on success', async () => {
      const templates = [{ id: 'e1', name: 'Welcome' }];
      const qm = createQueryMock(templates);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.getEmailTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(templates);
      expect(mocks.supabase.from).toHaveBeenCalledWith('email_templates');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbTools.getEmailTemplates();

      expect(result.success).toBe(false);
    });
  });

  // ====== Onboarding ======

  describe('getOnboardingProgress', () => {
    it('returns progress steps', async () => {
      const steps = [{ step_key: 'step1', completed_at: '2025-01-01' }];
      const qm = createQueryMock(steps);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.getOnboardingProgress('test-uid');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('onboarding_progress');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
    });

    it('returns empty array on error', async () => {
      const qm = createQueryMock(null, { message: 'Error' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.getOnboardingProgress('test-uid');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('completeOnboardingStep', () => {
    it('upserts onboarding step', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.completeOnboardingStep('test-uid', 'step1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('onboarding_progress');
      expect(qm.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'test-uid', step_key: 'step1' }),
        { onConflict: 'user_id,step_key' }
      );
    });
  });

  // ====== Duplicate Detection ======

  describe('checkDuplicate', () => {
    it('finds duplicates in leads and customers', async () => {
      const leadsQm = createQueryMock([{ id: 'l1', company_name: 'Firma', status: 'new' }]);
      const customersQm = createQueryMock([{ id: 'c1', company_name: 'Firma', status: 'active' }]);

      let callIdx = 0;
      mocks.supabase.from.mockImplementation(() => {
        callIdx++;
        return callIdx === 1 ? leadsQm : customersQm;
      });

      const result = await (window as any).dbTools.checkDuplicate('test@test.de');

      expect(result.success).toBe(true);
      expect(result.duplicates).toHaveLength(2);
      expect(result.duplicates[0].type).toBe('lead');
      expect(result.duplicates[1].type).toBe('customer');
    });

    it('returns empty for no email', async () => {
      const result = await (window as any).dbTools.checkDuplicate('');

      expect(result.success).toBe(true);
      expect(result.duplicates).toEqual([]);
    });

    it('returns empty for null email', async () => {
      const result = await (window as any).dbTools.checkDuplicate(null);

      expect(result.success).toBe(true);
      expect(result.duplicates).toEqual([]);
    });
  });

  // ====== Realtime Subscriptions ======

  describe('subscribeTable', () => {
    it('creates channel subscription', () => {
      const callback = vi.fn();

      (window as any).dbTools.subscribeTable('leads', callback);

      expect(mocks.supabase.channel).toHaveBeenCalledWith('leads-changes');
      const channelMock = mocks.supabase.channel.mock.results[0].value;
      expect(channelMock.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        expect.any(Function)
      );
      expect(channelMock.subscribe).toHaveBeenCalled();
    });
  });

  // ====== Bulk Import ======

  describe('bulkCreateCustomers', () => {
    it('inserts multiple customers', async () => {
      const customers = [{ company_name: 'A' }, { company_name: 'B' }];
      const qm = createQueryMock(customers);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbTools.bulkCreateCustomers(customers);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mocks.supabase.from).toHaveBeenCalledWith('customers');
      expect(qm.insert).toHaveBeenCalledWith(customers);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbTools.bulkCreateCustomers([]);

      expect(result.success).toBe(false);
    });
  });
});
