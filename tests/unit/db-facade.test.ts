import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('db facade and utils', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    // Load all DB modules first, then the facade
    loadBrowserScript('js/db/calls.js');
    loadBrowserScript('js/db/assistants.js');
    loadBrowserScript('js/db/profiles.js');
    loadBrowserScript('js/db/leads.js');
    loadBrowserScript('js/db/messaging.js');
    loadBrowserScript('js/db/customers.js');
    loadBrowserScript('js/db/tools.js');
    loadBrowserScript('js/db.js');
  });

  // ====== clanaDB combines all modules ======

  describe('clanaDB', () => {
    it('has methods from dbCalls', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.saveCall).toBe('function');
      expect(typeof db.getCalls).toBe('function');
      expect(typeof db.getStats).toBe('function');
      expect(typeof db.saveSettings).toBe('function');
      expect(typeof db.getSettings).toBe('function');
    });

    it('has methods from dbAssistants', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getAssistants).toBe('function');
      expect(typeof db.createAssistant).toBe('function');
      expect(typeof db.deleteAssistant).toBe('function');
    });

    it('has methods from dbProfiles', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getProfile).toBe('function');
      expect(typeof db.updateProfile).toBe('function');
      expect(typeof db.getAllProfiles).toBe('function');
      expect(typeof db.getOrganizations).toBe('function');
    });

    it('has methods from dbLeads', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getLeads).toBe('function');
      expect(typeof db.createLead).toBe('function');
      expect(typeof db.getTasks).toBe('function');
      expect(typeof db.createNote).toBe('function');
    });

    it('has methods from dbMessaging', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getConversations).toBe('function');
      expect(typeof db.sendMessage).toBe('function');
      expect(typeof db.submitContactForm).toBe('function');
    });

    it('has methods from dbCustomers', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getCustomers).toBe('function');
      expect(typeof db.convertLeadToCustomer).toBe('function');
      expect(typeof db.getCallProtocols).toBe('function');
    });

    it('has methods from dbTools', () => {
      const db = (window as any).clanaDB;
      expect(typeof db.getWorkingHours).toBe('function');
      expect(typeof db.calculateLeadScore).toBe('function');
      expect(typeof db.subscribeTable).toBe('function');
      expect(typeof db.checkDuplicate).toBe('function');
    });
  });

  // ====== clanaUtils ======

  describe('clanaUtils.formatDuration', () => {
    it('formats seconds as m:ss', () => {
      const utils = (window as any).clanaUtils;
      expect(utils.formatDuration(0)).toBe('0:00');
      expect(utils.formatDuration(5)).toBe('0:05');
      expect(utils.formatDuration(60)).toBe('1:00');
      expect(utils.formatDuration(125)).toBe('2:05');
      expect(utils.formatDuration(3661)).toBe('61:01');
    });
  });

  describe('clanaUtils.formatDate', () => {
    it('formats date in German locale', () => {
      const utils = (window as any).clanaUtils;
      const formatted = utils.formatDate('2025-03-15T14:30:00Z');

      // Should contain day.month.year pattern
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/03/);
      expect(formatted).toMatch(/2025/);
    });
  });

  describe('clanaUtils.sanitizeHtml', () => {
    it('escapes HTML entities', () => {
      const utils = (window as any).clanaUtils;
      const result = utils.sanitizeHtml('<script>alert("xss")</script>');

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('passes plain text through', () => {
      const utils = (window as any).clanaUtils;
      expect(utils.sanitizeHtml('Hello World')).toBe('Hello World');
    });

    it('handles null and undefined', () => {
      const utils = (window as any).clanaUtils;
      expect(utils.sanitizeHtml(null)).toBe('');
      expect(utils.sanitizeHtml(undefined)).toBe('');
    });
  });

  describe('clanaUtils.sanitizeAttr', () => {
    it('escapes double quotes', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn('value"with"quotes')).toContain('&quot;');
      expect(fn('value"with"quotes')).not.toContain('"with"');
    });

    it('escapes single quotes', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn("it's")).toContain('&#39;');
    });

    it('escapes HTML angle brackets', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      const result = fn('<script>');
      expect(result).not.toContain('<');
      expect(result).toContain('&lt;');
    });

    it('escapes backslashes', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn('path\\to\\file')).toContain('&#92;');
    });

    it('escapes ampersands', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn('a&b')).toContain('&amp;');
    });

    it('handles null and undefined', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn(null)).toBe('');
      expect(fn(undefined)).toBe('');
    });

    it('converts numbers to strings', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      expect(fn(42)).toBe('42');
    });

    it('prevents onclick injection via ID', () => {
      const fn = (window as any).clanaUtils.sanitizeAttr;
      const malicious = "');alert('xss');//";
      const result = fn(malicious);
      expect(result).not.toContain("'");
      expect(result).toContain('&#39;');
    });
  });

  describe('clanaUtils.validateEmail', () => {
    it('validates correct emails', () => {
      const v = (window as any).clanaUtils.validateEmail;
      expect(v('test@test.de')).toBe(true);
      expect(v('user.name+tag@domain.co')).toBe(true);
    });

    it('rejects invalid emails', () => {
      const v = (window as any).clanaUtils.validateEmail;
      expect(v('')).toBe(false);
      expect(v('not-email')).toBe(false);
      expect(v('missing@')).toBe(false);
      expect(v('@no-user.de')).toBe(false);
    });
  });

  describe('clanaUtils.validatePhone', () => {
    it('validates correct phone numbers', () => {
      const v = (window as any).clanaUtils.validatePhone;
      expect(v('+49 123 456 789')).toBe(true);
      expect(v('0123-456789')).toBe(true);
      expect(v('(030) 1234567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      const v = (window as any).clanaUtils.validatePhone;
      expect(v('')).toBe(false);
      expect(v('12345')).toBe(false);  // too short
      expect(v('abc')).toBe(false);
    });
  });

  describe('clanaUtils.safeTelHref', () => {
    it('returns tel: href for valid phone', () => {
      const fn = (window as any).clanaUtils.safeTelHref;
      expect(fn('+49 123 456')).toBe('tel:+49 123 456');
    });

    it('returns # for empty/null phone', () => {
      const fn = (window as any).clanaUtils.safeTelHref;
      expect(fn('')).toBe('#');
      expect(fn(null)).toBe('#');
      expect(fn(undefined)).toBe('#');
    });
  });

  describe('clanaUtils.safeMailHref', () => {
    it('returns mailto: href for valid email', () => {
      const fn = (window as any).clanaUtils.safeMailHref;
      expect(fn('test@test.de')).toBe('mailto:test@test.de');
    });

    it('returns # for invalid email', () => {
      const fn = (window as any).clanaUtils.safeMailHref;
      expect(fn('not-email')).toBe('#');
      expect(fn('')).toBe('#');
    });
  });

  // ====== utils (window.utils) ======

  describe('utils.isAuthenticated', () => {
    it('returns true when session exists', async () => {
      const utils = (window as any).clanaUtils;
      // The window-level utils object is actually loaded as window.utils in db.js
      const windowUtils = (window as any).utils;

      // auth.getSession returns a session object
      mocks.auth.getSession.mockResolvedValue({ access_token: 'tok' });

      const result = await windowUtils.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no session', async () => {
      const windowUtils = (window as any).utils;

      mocks.auth.getSession.mockResolvedValue(null);

      const result = await windowUtils.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
