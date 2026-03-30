import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbLeads', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/leads.js');
  });

  // ====== getLeads ======

  describe('getLeads', () => {
    it('returns leads with profile join on success', async () => {
      const leads = [{ id: 'l1', company_name: 'Firma A' }];
      const qm = createQueryMock(leads);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.getLeads();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(leads);
      expect(mocks.supabase.from).toHaveBeenCalledWith('leads');
      expect(qm.select).toHaveBeenCalledWith('*, profiles:assigned_to(id, first_name, last_name)');
    });

    it('applies status filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbLeads.getLeads({ status: 'new' });

      expect(qm.eq).toHaveBeenCalledWith('status', 'new');
    });

    it('applies assigned_to filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbLeads.getLeads({ assigned_to: 'u-1' });

      expect(qm.eq).toHaveBeenCalledWith('assigned_to', 'u-1');
    });

    it('applies limit filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbLeads.getLeads({ limit: 10 });

      expect(qm.limit).toHaveBeenCalledWith(10);
    });

    it('falls back to plain select if profile join fails', async () => {
      // First call (with join) returns error
      const errorQm = createQueryMock(null, { message: 'relation not found' });
      // Second call (plain select) returns data
      const successQm = createQueryMock([{ id: 'l1' }]);

      let callCount = 0;
      mocks.supabase.from.mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? errorQm : successQm;
      });

      const result = await (window as any).dbLeads.getLeads();

      expect(result.success).toBe(true);
      expect(mocks.logger.warn).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.getLeads();

      expect(result.success).toBe(false);
    });
  });

  // ====== getLead ======

  describe('getLead', () => {
    it('returns lead with notes', async () => {
      const lead = { id: 'l1', company_name: 'Firma A', notes: [{ id: 'n1' }] };
      const qm = createQueryMock(lead);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.getLead('l1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(lead);
      expect(qm.select).toHaveBeenCalledWith('*, notes(*)');
      expect(qm.eq).toHaveBeenCalledWith('id', 'l1');
      expect(qm.single).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.getLead('l1');

      expect(result.success).toBe(false);
    });
  });

  // ====== createLead ======

  describe('createLead', () => {
    it('creates lead on success', async () => {
      const lead = { id: 'l-new', company_name: 'New Co' };
      const qm = createQueryMock(lead);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.createLead({ company_name: 'New Co' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(lead);
      expect(qm.insert).toHaveBeenCalledWith([{ company_name: 'New Co' }]);
    });

    it('retries without industry if column does not exist', async () => {
      // First call fails with industry error
      const errorQm = createQueryMock(null, { message: 'column industry does not exist' });
      // Second call succeeds
      const successQm = createQueryMock({ id: 'l-new', company_name: 'New' });

      let callCount = 0;
      mocks.supabase.from.mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? errorQm : successQm;
      });

      const result = await (window as any).dbLeads.createLead({ company_name: 'New', industry: 'IT' });

      expect(result.success).toBe(true);
      // Second insert should not include industry
      expect(successQm.insert).toHaveBeenCalledWith([{ company_name: 'New' }]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.createLead({});

      expect(result.success).toBe(false);
    });
  });

  // ====== updateLead ======

  describe('updateLead', () => {
    it('updates lead on success', async () => {
      const updated = { id: 'l1', company_name: 'Updated' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.updateLead('l1', { company_name: 'Updated' });

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ company_name: 'Updated' });
      expect(qm.eq).toHaveBeenCalledWith('id', 'l1');
    });

    it('retries without industry if column does not exist', async () => {
      const errorQm = createQueryMock(null, { message: 'column industry does not exist' });
      const successQm = createQueryMock({ id: 'l1', status: 'contacted' });

      let callCount = 0;
      mocks.supabase.from.mockImplementation(() => {
        callCount++;
        return callCount <= 1 ? errorQm : successQm;
      });

      const result = await (window as any).dbLeads.updateLead('l1', { status: 'contacted', industry: 'IT' });

      expect(result.success).toBe(true);
      expect(successQm.update).toHaveBeenCalledWith({ status: 'contacted' });
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.updateLead('l1', {});

      expect(result.success).toBe(false);
    });
  });

  // ====== deleteLead ======

  describe('deleteLead', () => {
    it('deletes lead on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.deleteLead('l1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('leads');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 'l1');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.deleteLead('l1');

      expect(result.success).toBe(false);
    });
  });

  // ====== Tasks ======

  describe('getTasks', () => {
    it('returns tasks with filters', async () => {
      const tasks = [{ id: 't1', title: 'Task A' }];
      const qm = createQueryMock(tasks);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.getTasks({ status: 'open', assigned_to: 'u-1', lead_id: 'l1', limit: 5 });

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('tasks');
      expect(qm.eq).toHaveBeenCalledWith('status', 'open');
      expect(qm.eq).toHaveBeenCalledWith('assigned_to', 'u-1');
      expect(qm.eq).toHaveBeenCalledWith('lead_id', 'l1');
      expect(qm.limit).toHaveBeenCalledWith(5);
      expect(qm.order).toHaveBeenCalledWith('due_date', { ascending: true });
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.getTasks();

      expect(result.success).toBe(false);
    });
  });

  describe('createTask', () => {
    it('sets created_by to current user id', async () => {
      const task = { id: 't-new', title: 'Do something', created_by: 'test-uid' };
      const qm = createQueryMock(task);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.createTask({ title: 'Do something' });

      expect(result.success).toBe(true);
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ created_by: 'test-uid', title: 'Do something' }),
      ]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.createTask({});

      expect(result.success).toBe(false);
    });
  });

  describe('updateTask', () => {
    it('updates task on success', async () => {
      const updated = { id: 't1', status: 'done' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.updateTask('t1', { status: 'done' });

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ status: 'done' });
      expect(qm.eq).toHaveBeenCalledWith('id', 't1');
    });
  });

  describe('deleteTask', () => {
    it('deletes task on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.deleteTask('t1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('tasks');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 't1');
    });
  });

  // ====== Notes ======

  describe('createNote', () => {
    it('sets author_id to current user id', async () => {
      const note = { id: 'n-new', content: 'Hello', author_id: 'test-uid' };
      const qm = createQueryMock(note);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.createNote({ content: 'Hello', lead_id: 'l1' });

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('notes');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ author_id: 'test-uid', content: 'Hello', lead_id: 'l1' }),
      ]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.createNote({});

      expect(result.success).toBe(false);
    });
  });

  describe('deleteNote', () => {
    it('deletes note on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbLeads.deleteNote('n1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('notes');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 'n1');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbLeads.deleteNote('n1');

      expect(result.success).toBe(false);
    });
  });
});
