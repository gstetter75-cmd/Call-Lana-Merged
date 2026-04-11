import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createSupabaseMock } from './setup';

describe('SystemHealth', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;
  let supabase: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    supabase = createSupabaseMock();

    // Add storage mock needed by checkStorageUsage
    (supabase as any).storage = {
      listBuckets: vi.fn().mockResolvedValue({ data: [{ name: 'avatars' }] }),
    };

    mocks = setupGlobalMocks({ supabase });

    // performance.now mock for response time measurement
    let counter = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      counter += 50;
      return counter;
    });

    document.body.innerHTML = '<div id="health-container"></div>';

    loadBrowserScript('js/admin-health.js');
  });

  it('SystemHealth is defined on window', () => {
    expect((window as any).SystemHealth).toBeDefined();
  });

  it('has renderHealthDashboard method', () => {
    expect(typeof (window as any).SystemHealth.renderHealthDashboard).toBe('function');
  });

  it('has checkSupabaseApi method', () => {
    expect(typeof (window as any).SystemHealth.checkSupabaseApi).toBe('function');
  });

  it('has checkAuthService method', () => {
    expect(typeof (window as any).SystemHealth.checkAuthService).toBe('function');
  });

  it('has checkDatabaseTables method', () => {
    expect(typeof (window as any).SystemHealth.checkDatabaseTables).toBe('function');
  });

  it('has checkStorageUsage method', () => {
    expect(typeof (window as any).SystemHealth.checkStorageUsage).toBe('function');
  });

  describe('checkSupabaseApi()', () => {
    it('returns ok status for fast response', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      };
      supabase.from.mockReturnValue(qm);

      const result = await (window as any).SystemHealth.checkSupabaseApi();
      expect(result.name).toBe('Supabase API');
      expect(result.status).toBe('ok');
      expect(result.responseTime).toBeDefined();
    });

    it('returns error status when supabase returns error', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } }),
      };
      supabase.from.mockReturnValue(qm);

      const result = await (window as any).SystemHealth.checkSupabaseApi();
      expect(result.status).toBe('error');
      expect(result.detail).toBe('Connection failed');
    });

    it('returns error status when supabase throws', async () => {
      supabase.from.mockImplementation(() => { throw new Error('Network error'); });

      const result = await (window as any).SystemHealth.checkSupabaseApi();
      expect(result.status).toBe('error');
      expect(result.detail).toBe('Nicht erreichbar');
    });
  });

  describe('checkAuthService()', () => {
    it('returns ok when user is logged in', async () => {
      const result = await (window as any).SystemHealth.checkAuthService();
      expect(result.name).toBe('Auth Service');
      expect(result.status).toBe('ok');
      expect(result.detail).toContain('Eingeloggt');
    });

    it('returns warning when no user', async () => {
      mocks.auth.getUser.mockResolvedValueOnce(null);
      const result = await (window as any).SystemHealth.checkAuthService();
      expect(result.status).toBe('warning');
      expect(result.detail).toBe('Kein User');
    });
  });

  describe('checkStorageUsage()', () => {
    it('returns ok with bucket count', async () => {
      const result = await (window as any).SystemHealth.checkStorageUsage();
      expect(result.status).toBe('ok');
      expect(result.detail).toContain('1 Bucket');
    });

    it('returns warning when storage throws', async () => {
      (supabase as any).storage.listBuckets.mockRejectedValueOnce(new Error('fail'));
      const result = await (window as any).SystemHealth.checkStorageUsage();
      expect(result.status).toBe('warning');
    });
  });

  describe('renderHealthDashboard()', () => {
    it('returns early for null container', async () => {
      await (window as any).SystemHealth.renderHealthDashboard(null);
      // Should not throw
    });

    it('renders health checks into container', async () => {
      const qm = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      };
      supabase.from.mockReturnValue(qm);

      const container = document.getElementById('health-container')!;
      await (window as any).SystemHealth.renderHealthDashboard(container);
      expect(container.innerHTML).toContain('System Health');
      expect(container.innerHTML).toContain('Supabase API');
      expect(container.innerHTML).toContain('Auth Service');
    });
  });
});
