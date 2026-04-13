import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('SalesTasks', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="tasks-list"></div>
      <div id="stat-tasks-open"></div>
      <div id="stat-tasks-progress"></div>
      <div id="stat-tasks-done"></div>
      <input id="task-title" />
      <textarea id="task-desc"></textarea>
      <input id="task-due" />
      <select id="task-priority"><option value="medium">medium</option></select>
      <select id="task-lead"><option value="">--</option></select>
      <div id="avail-grid"></div>
      <input id="avail-date" />
      <input id="avail-start" />
      <input id="avail-end" />
      <select id="avail-type"><option value="available">available</option></select>
      <textarea id="avail-note"></textarea>
      <div id="comm-tbody"></div>
      <div id="comm-monthly"></div>
      <div id="comm-customers"></div>
      <div id="comm-revenue"></div>
      <div id="comm-last-month"></div>
      <div id="modal-add-task" class="modal-overlay"></div>
      <div id="modal-avail" class="modal-overlay"></div>
    `;

    mocks = setupGlobalMocks();

    (window as any).currentProfile = { id: 'user-1', role: 'sales' };
    (window as any).allTasks = [];
    (window as any).allLeads = [];

    (window as any).Components = {
      loadSidebar: vi.fn(),
      toast: vi.fn(),
    };
    (window as any).openModal = vi.fn();
    (window as any).closeModal = vi.fn();

    (window as any).CONFIG = {
      PLANS: { starter: 29, professional: 79, business: 149 },
      COMMISSION_RATE: 0.1,
      getPlanPrice: (p: string) => ({ starter: 29, professional: 79, business: 149 }[p] || 29),
      getPlanLabel: (p: string) => p.charAt(0).toUpperCase() + p.slice(1),
    };

    (window as any).clanaDB = {
      getTasks: vi.fn().mockResolvedValue({ success: true, data: [] }),
      updateTask: vi.fn().mockResolvedValue({ success: true }),
      createTask: vi.fn().mockResolvedValue({ success: true }),
      getAvailability: vi.fn().mockResolvedValue({ success: true, data: [] }),
      setAvailability: vi.fn().mockResolvedValue({ success: true }),
    };

    loadBrowserScript('js/sales-tasks.js');
  });

  describe('window exports', () => {
    it('exposes loadTasks on window', () => {
      expect(typeof (window as any).loadTasks).toBe('function');
    });

    it('exposes renderTasks on window', () => {
      expect(typeof (window as any).renderTasks).toBe('function');
    });

    it('exposes updateTaskStats on window', () => {
      expect(typeof (window as any).updateTaskStats).toBe('function');
    });

    it('exposes toggleTask on window', () => {
      expect(typeof (window as any).toggleTask).toBe('function');
    });

    it('exposes saveTask on window', () => {
      expect(typeof (window as any).saveTask).toBe('function');
    });

    it('exposes loadAvailability on window', () => {
      expect(typeof (window as any).loadAvailability).toBe('function');
    });

    it('exposes saveAvailability on window', () => {
      expect(typeof (window as any).saveAvailability).toBe('function');
    });

    it('exposes loadCommissions on window', () => {
      expect(typeof (window as any).loadCommissions).toBe('function');
    });
  });

  describe('guessPlanFromValue', () => {
    it('returns starter for null/undefined value', () => {
      expect((window as any).guessPlanFromValue(null)).toBe('starter');
      expect((window as any).guessPlanFromValue(undefined)).toBe('starter');
    });

    it('returns starter for values under 250', () => {
      expect((window as any).guessPlanFromValue(100)).toBe('starter');
      expect((window as any).guessPlanFromValue(249)).toBe('starter');
    });

    it('returns professional for values 250-499', () => {
      expect((window as any).guessPlanFromValue(250)).toBe('professional');
      expect((window as any).guessPlanFromValue(499)).toBe('professional');
    });

    it('returns business for values 500+', () => {
      expect((window as any).guessPlanFromValue(500)).toBe('business');
      expect((window as any).guessPlanFromValue(1000)).toBe('business');
    });
  });

  describe('loadTasks', () => {
    it('calls clanaDB.getTasks with current profile id', async () => {
      await (window as any).loadTasks();
      expect((window as any).clanaDB.getTasks).toHaveBeenCalledWith({ assigned_to: 'user-1' });
    });

    it('sets window.allTasks from result data', async () => {
      const tasks = [{ id: '1', title: 'Test', status: 'open' }];
      (window as any).clanaDB.getTasks.mockResolvedValue({ success: true, data: tasks });

      await (window as any).loadTasks();
      expect((window as any).allTasks).toEqual(tasks);
    });
  });

  describe('updateTaskStats', () => {
    it('counts tasks by status correctly', () => {
      (window as any).allTasks = [
        { status: 'open' },
        { status: 'open' },
        { status: 'in_progress' },
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
      ];

      (window as any).updateTaskStats();

      expect(document.getElementById('stat-tasks-open')!.textContent).toBe('2');
      expect(document.getElementById('stat-tasks-progress')!.textContent).toBe('1');
      expect(document.getElementById('stat-tasks-done')!.textContent).toBe('3');
    });
  });

  describe('renderTasks', () => {
    it('shows empty state when no tasks', () => {
      (window as any).allTasks = [];
      (window as any).renderTasks();
      expect(document.getElementById('tasks-list')!.innerHTML).toContain('Keine Aufgaben');
    });

    it('renders task rows for existing tasks', () => {
      (window as any).allTasks = [
        { id: 't1', title: 'My Task', status: 'open', priority: 'high' },
      ];
      (window as any).renderTasks();
      expect(document.getElementById('tasks-list')!.innerHTML).toContain('My Task');
      expect(document.getElementById('tasks-list')!.innerHTML).toContain('badge-orange');
    });
  });

  describe('toggleTask', () => {
    it('toggles done to open', async () => {
      (window as any).clanaDB.getTasks.mockResolvedValue({ success: true, data: [] });
      await (window as any).toggleTask('t1', 'done');
      expect((window as any).clanaDB.updateTask).toHaveBeenCalledWith('t1', { status: 'open' });
    });

    it('toggles open to done', async () => {
      (window as any).clanaDB.getTasks.mockResolvedValue({ success: true, data: [] });
      await (window as any).toggleTask('t1', 'open');
      expect((window as any).clanaDB.updateTask).toHaveBeenCalledWith('t1', { status: 'done' });
    });
  });
});
