import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('NotificationCenter', () => {
  let NC: any;

  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '<span id="notif-badge" style="display:none;">0</span>';
    loadBrowserScript('js/notifications.js');
    NC = (window as any).NotificationCenter;
    // Reset state
    NC.notifications = [];
    NC.isOpen = false;
    NC._clickHandler = null;
  });

  describe('addNotification', () => {
    it('adds a notification to the array', () => {
      NC.addNotification('Title', 'Message');
      expect(NC.notifications).toHaveLength(1);
      expect(NC.notifications[0].title).toBe('Title');
      expect(NC.notifications[0].message).toBe('Message');
      expect(NC.notifications[0].read).toBe(false);
    });

    it('caps notifications at 50', () => {
      for (let i = 0; i < 55; i++) {
        NC.addNotification(`Title ${i}`, `Msg ${i}`);
      }
      expect(NC.notifications).toHaveLength(50);
    });

    it('prepends new notifications (newest first)', () => {
      NC.addNotification('First', 'Msg1');
      NC.addNotification('Second', 'Msg2');
      expect(NC.notifications[0].title).toBe('Second');
      expect(NC.notifications[1].title).toBe('First');
    });

    it('sets the correct type', () => {
      NC.addNotification('Warn', 'Msg', 'warning');
      expect(NC.notifications[0].type).toBe('warning');
    });

    it('defaults type to info', () => {
      NC.addNotification('Info', 'Msg');
      expect(NC.notifications[0].type).toBe('info');
    });

    it('stores action callback', () => {
      const action = vi.fn();
      NC.addNotification('Act', 'Msg', 'info', action);
      expect(NC.notifications[0].action).toBe(action);
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', () => {
      NC.addNotification('A', 'a');
      NC.addNotification('B', 'b');
      expect(NC.notifications.every((n: any) => !n.read)).toBe(true);
      NC.markAllRead();
      expect(NC.notifications.every((n: any) => n.read)).toBe(true);
    });
  });

  describe('handleClick', () => {
    it('marks a single notification as read', () => {
      NC.addNotification('A', 'a');
      const id = NC.notifications[0].id;
      NC.handleClick(id);
      expect(NC.notifications[0].read).toBe(true);
    });

    it('calls the action callback', () => {
      const action = vi.fn();
      NC.addNotification('A', 'a', 'info', action);
      const id = NC.notifications[0].id;
      NC.handleClick(id);
      expect(action).toHaveBeenCalledOnce();
    });

    it('does nothing for unknown id', () => {
      NC.addNotification('A', 'a');
      expect(() => NC.handleClick(99999)).not.toThrow();
      expect(NC.notifications[0].read).toBe(false);
    });
  });

  describe('timeAgo', () => {
    it('returns "gerade" for less than 60 seconds', () => {
      const now = new Date();
      expect(NC.timeAgo(now)).toBe('gerade');
    });

    it('returns "X Min." for minutes', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(NC.timeAgo(fiveMinAgo)).toBe('5 Min.');
    });

    it('returns "X Std." for hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(NC.timeAgo(twoHoursAgo)).toBe('2 Std.');
    });

    it('returns "X Tage" for days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(NC.timeAgo(threeDaysAgo)).toBe('3 Tage');
    });
  });

  describe('updateBadge', () => {
    it('shows badge when there are unread notifications', () => {
      NC.addNotification('A', 'a');
      NC.updateBadge();
      const badge = document.getElementById('notif-badge')!;
      expect(badge.style.display).toBe('block');
      expect(badge.textContent).toBe('1');
    });

    it('hides badge when all notifications are read', () => {
      NC.addNotification('A', 'a');
      NC.markAllRead();
      const badge = document.getElementById('notif-badge')!;
      expect(badge.style.display).toBe('none');
      expect(badge.textContent).toBe('0');
    });

    it('hides badge when there are no notifications', () => {
      NC.updateBadge();
      const badge = document.getElementById('notif-badge')!;
      expect(badge.style.display).toBe('none');
    });
  });

  describe('checkFollowUpReminders', () => {
    it('adds warning for leads > 14 days without contact', () => {
      const oldDate = new Date(Date.now() - 15 * 86400000).toISOString();
      NC.checkFollowUpReminders([
        { company_name: 'Stale Corp', status: 'open', updated_at: oldDate },
      ]);
      expect(NC.notifications).toHaveLength(1);
      expect(NC.notifications[0].type).toBe('warning');
      expect(NC.notifications[0].title).toBe('Lead vergessen?');
    });

    it('adds reminder for leads > 7 days without update', () => {
      const weekOld = new Date(Date.now() - 8 * 86400000).toISOString();
      NC.checkFollowUpReminders([
        { company_name: 'Slow Corp', status: 'contacted', updated_at: weekOld },
      ]);
      expect(NC.notifications).toHaveLength(1);
      expect(NC.notifications[0].type).toBe('reminder');
      expect(NC.notifications[0].title).toBe('Follow-up fällig');
    });

    it('ignores leads with "won" status', () => {
      const oldDate = new Date(Date.now() - 30 * 86400000).toISOString();
      NC.checkFollowUpReminders([
        { company_name: 'Won Corp', status: 'won', updated_at: oldDate },
      ]);
      expect(NC.notifications).toHaveLength(0);
    });

    it('ignores leads with "lost" status', () => {
      const oldDate = new Date(Date.now() - 30 * 86400000).toISOString();
      NC.checkFollowUpReminders([
        { company_name: 'Lost Corp', status: 'lost', updated_at: oldDate },
      ]);
      expect(NC.notifications).toHaveLength(0);
    });

    it('does nothing when leads is null/undefined', () => {
      expect(() => NC.checkFollowUpReminders(null)).not.toThrow();
      expect(() => NC.checkFollowUpReminders(undefined)).not.toThrow();
      expect(NC.notifications).toHaveLength(0);
    });
  });
});
