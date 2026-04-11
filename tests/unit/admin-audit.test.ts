import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('AdminAudit', () => {
  let AA: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'admin-goals', 'admin-announcements',
    ];
    document.body.innerHTML = ids.map(id => `<div id="${id}"></div>`).join('');

    mocks = setupGlobalMocks();

    (window as any).Components = { toast: vi.fn() };

    loadBrowserScript('js/admin-audit.js');
    AA = (window as any).AdminAudit;
  });

  it('exports AdminAudit to window', () => {
    expect(AA).toBeDefined();
    expect(typeof AA).toBe('object');
  });

  it('has renderGoals method', () => {
    expect(typeof AA.renderGoals).toBe('function');
  });

  it('has renderAnnouncements method', () => {
    expect(typeof AA.renderAnnouncements).toBe('function');
  });

  it('has logAction method', () => {
    expect(typeof AA.logAction).toBe('function');
  });

  it('has renderAuditLog method', () => {
    expect(typeof AA.renderAuditLog).toBe('function');
  });

  it('has initActivityFeed method', () => {
    expect(typeof AA.initActivityFeed).toBe('function');
  });

  it('has feedItems array', () => {
    expect(Array.isArray(AA.feedItems)).toBe(true);
  });

  describe('logAction', () => {
    it('inserts an audit log entry via supabaseClient', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      await AA.logAction('role_change', 'profile', 'uid-1', { role: 'customer' }, { role: 'sales' });

      expect(mocks.supabase.from).toHaveBeenCalledWith('audit_logs');
      expect(qm.insert).toHaveBeenCalled();
    });
  });

  describe('renderGoals', () => {
    it('renders empty state when no goals', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      const container = document.getElementById('admin-goals')!;
      await AA.renderGoals(container, 0, 0);

      expect(container.innerHTML).toContain('Keine aktiven Ziele');
    });

    it('does nothing when container is null', async () => {
      // Should not throw
      await expect(AA.renderGoals(null, 0, 0)).resolves.toBeUndefined();
    });
  });

  describe('renderAnnouncements', () => {
    it('renders empty state when no announcements', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      const container = document.getElementById('admin-announcements')!;
      await AA.renderAnnouncements(container);

      expect(container.innerHTML).toContain('Keine aktiven Ankündigungen');
    });

    it('renders announcements when data exists', async () => {
      const qm = createQueryMock([
        { id: 'a1', title: 'Test News', message: 'Inhalt', type: 'info', is_active: true, created_at: '2025-01-01T00:00:00Z' },
      ]);
      mocks.supabase.from.mockReturnValue(qm);

      const container = document.getElementById('admin-announcements')!;
      await AA.renderAnnouncements(container);

      expect(container.innerHTML).toContain('Test News');
      expect(container.innerHTML).toContain('Inhalt');
    });
  });
});
