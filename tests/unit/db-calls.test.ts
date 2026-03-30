import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbCalls', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/calls.js');
  });

  // ====== saveCall ======

  describe('saveCall', () => {
    it('inserts call with correct fields', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const callData = {
        phoneNumber: '+49123456',
        duration: 120,
        status: 'completed',
        transcript: 'Hello world',
        timestamp: '2025-01-15T10:00:00Z',
      };

      const result = await (window as any).dbCalls.saveCall(callData);

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('calls');
      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'test-uid',
          phone_number: '+49123456',
          duration: 120,
          status: 'completed',
          transcript: 'Hello world',
          created_at: '2025-01-15T10:00:00Z',
        }),
      ]);
    });

    it('uses current timestamp if none provided', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCalls.saveCall({ phoneNumber: '+49123', duration: 60, status: 'completed' });

      expect(qm.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          phone_number: '+49123',
          created_at: expect.any(String),
        }),
      ]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCalls.saveCall({ phoneNumber: '+49' });

      expect(result.success).toBe(false);
    });
  });

  // ====== getCalls ======

  describe('getCalls', () => {
    it('returns calls ordered by date with limit', async () => {
      const calls = [{ id: '1', duration: 60 }, { id: '2', duration: 120 }];
      const qm = createQueryMock(calls);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getCalls(25);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(calls);
      expect(mocks.supabase.from).toHaveBeenCalledWith('calls');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'test-uid');
      expect(qm.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(qm.limit).toHaveBeenCalledWith(25);
    });

    it('defaults limit to 50', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCalls.getCalls();

      expect(qm.limit).toHaveBeenCalledWith(50);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCalls.getCalls();

      expect(result.success).toBe(false);
    });
  });

  // ====== getStats ======

  describe('getStats', () => {
    it('computes totalCalls, totalDuration, avgDuration, statuses', async () => {
      const calls = [
        { duration: 60, status: 'completed' },
        { duration: 120, status: 'completed' },
        { duration: 30, status: 'missed' },
      ];
      const qm = createQueryMock(calls);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getStats('2025-01-01', '2025-01-31');

      expect(result.success).toBe(true);
      expect(result.stats.totalCalls).toBe(3);
      expect(result.stats.totalDuration).toBe(210);
      expect(result.stats.avgDuration).toBe(70);
      expect(result.stats.statuses).toEqual({ completed: 2, missed: 1 });
    });

    it('handles empty call list', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getStats('2025-01-01', '2025-01-31');

      expect(result.success).toBe(true);
      expect(result.stats.totalCalls).toBe(0);
      expect(result.stats.avgDuration).toBe(0);
    });

    it('applies date range filters', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbCalls.getStats('2025-01-01', '2025-01-31');

      expect(qm.gte).toHaveBeenCalledWith('created_at', '2025-01-01');
      expect(qm.lte).toHaveBeenCalledWith('created_at', '2025-01-31');
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCalls.getStats('2025-01-01', '2025-01-31');

      expect(result.success).toBe(false);
    });
  });

  // ====== saveSettings ======

  describe('saveSettings', () => {
    it('upserts settings correctly', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const settings = { theme: 'dark', lang: 'de' };
      const result = await (window as any).dbCalls.saveSettings(settings);

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('user_settings');
      expect(qm.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'test-uid',
          settings: { theme: 'dark', lang: 'de' },
          updated_at: expect.any(String),
        }),
      ]);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCalls.saveSettings({});

      expect(result.success).toBe(false);
    });
  });

  // ====== getSettings ======

  describe('getSettings', () => {
    it('returns settings on success', async () => {
      const qm = createQueryMock({ settings: { theme: 'dark' } });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getSettings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ theme: 'dark' });
      expect(mocks.supabase.from).toHaveBeenCalledWith('user_settings');
      expect(qm.single).toHaveBeenCalled();
    });

    it('returns empty object when no settings exist', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getSettings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('handles PGRST116 (no rows) gracefully', async () => {
      const qm = createQueryMock(null, { code: 'PGRST116', message: 'No rows' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getSettings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('fails on non-PGRST116 errors', async () => {
      const qm = createQueryMock(null, { code: 'OTHER', message: 'DB broke' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbCalls.getSettings();

      expect(result.success).toBe(false);
    });

    it('fails when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbCalls.getSettings();

      expect(result.success).toBe(false);
    });
  });
});
