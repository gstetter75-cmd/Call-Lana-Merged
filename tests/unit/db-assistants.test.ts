import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbAssistants', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/assistants.js');
  });

  // ====== getAssistants ======

  describe('getAssistants', () => {
    it('returns assistants for current user', async () => {
      const assistants = [{ id: 'a1', name: 'Bot A' }, { id: 'a2', name: 'Bot B' }];
      const qm = createQueryMock(assistants);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.getAssistants();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(assistants);
      expect(mocks.supabase.from).toHaveBeenCalledWith('assistants');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
      expect(qm.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.getAssistants();

      expect(result.success).toBe(false);
    });
  });

  // ====== getAllAssistants ======

  describe('getAllAssistants', () => {
    it('returns all assistants (admin)', async () => {
      const all = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }];
      const qm = createQueryMock(all);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.getAllAssistants();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(all);
      // Should not filter by user_id
      expect(qm.eq).not.toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.getAllAssistants();

      expect(result.success).toBe(false);
    });
  });

  // ====== getAssistant ======

  describe('getAssistant', () => {
    it('returns assistant by id', async () => {
      const assistant = { id: 'a1', name: 'Bot A', user_id: 'test-uid' };
      const qm = createQueryMock(assistant);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.getAssistant('a1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(assistant);
      expect(qm.eq).toHaveBeenCalledWith('id', 'a1');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
      expect(qm.single).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.getAssistant('a1');

      expect(result.success).toBe(false);
    });
  });

  // ====== createAssistant ======

  describe('createAssistant', () => {
    it('inserts with user_id', async () => {
      const created = { id: 'a-new', name: 'New Bot', user_id: 'test-uid' };
      const qm = createQueryMock(created);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.createAssistant({ name: 'New Bot' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'test-uid', name: 'New Bot' }),
      ]);
      expect(qm.single).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.createAssistant({ name: 'Bot' });

      expect(result.success).toBe(false);
    });
  });

  // ====== updateAssistant ======

  describe('updateAssistant', () => {
    it('updates with id and user scope', async () => {
      const updated = { id: 'a1', name: 'Renamed' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.updateAssistant('a1', { name: 'Renamed' });

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ name: 'Renamed' });
      expect(qm.eq).toHaveBeenCalledWith('id', 'a1');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
      expect(qm.single).toHaveBeenCalled();
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.updateAssistant('a1', {});

      expect(result.success).toBe(false);
    });
  });

  // ====== deleteAssistant ======

  describe('deleteAssistant', () => {
    it('deletes assistant by id and user scope', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.deleteAssistant('a1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('assistants');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('id', 'a1');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbAssistants.deleteAssistant('a1');

      expect(result.success).toBe(false);
    });

    it('returns error on supabase failure', async () => {
      const qm = createQueryMock(null, { message: 'FK constraint' });
      qm.then = (resolve: any, reject: any) => {
        if (reject) return reject({ message: 'FK constraint' });
        return resolve({ data: null, error: { message: 'FK constraint' } });
      };
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbAssistants.deleteAssistant('a1');

      expect(result.success).toBe(false);
    });
  });
});
