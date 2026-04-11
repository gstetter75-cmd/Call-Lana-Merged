import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AppointmentsPage', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    document.body.innerHTML = `
      <div id="page-appointments">
        <button class="editor-tab active">Woche</button>
        <button class="editor-tab">Liste</button>
      </div>
      <div id="appt-week-view"></div>
      <div id="appt-week-nav"></div>
      <div id="appt-list-view" style="display:none;"></div>
      <div id="appt-week-label"></div>
      <div id="appt-list-body"></div>
      <span id="apptListCount"></span>
    `;
    (window as any).clanaUtils = { sanitizeHtml: (s: string) => s, sanitizeAttr: (s: string) => s };
    (window as any).Logger = { warn: vi.fn(), error: vi.fn() };

    loadBrowserScript('js/appointments.js');
  });

  it('AppointmentsPage is defined', () => {
    expect((window as any).AppointmentsPage).toBeDefined();
  });

  describe('init()', () => {
    it('sets _currentWeekStart to Monday of current week', async () => {
      // Mock supabase query for loadAppointments
      const qm = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).AppointmentsPage.init();
      const weekStart = (window as any).AppointmentsPage._currentWeekStart;
      expect(weekStart).toBeDefined();
      // Should be a Monday (getDay() returns 0=Sun, 1=Mon, etc.)
      expect(weekStart.getDay()).toBe(1);
    });
  });

  describe('prevWeek() / nextWeek()', () => {
    it('prevWeek moves back 7 days', () => {
      const ap = (window as any).AppointmentsPage;
      ap._currentWeekStart = new Date(2026, 2, 30); // March 30
      ap.loadAppointments = vi.fn();
      ap.prevWeek();
      expect(ap._currentWeekStart.getDate()).toBe(23); // March 23
      expect(ap.loadAppointments).toHaveBeenCalled();
    });

    it('nextWeek moves forward 7 days', () => {
      const ap = (window as any).AppointmentsPage;
      ap._currentWeekStart = new Date(2026, 2, 23);
      ap.loadAppointments = vi.fn();
      ap.nextWeek();
      expect(ap._currentWeekStart.getDate()).toBe(30);
      expect(ap.loadAppointments).toHaveBeenCalled();
    });
  });

  describe('setView()', () => {
    it('switches to list view', () => {
      const ap = (window as any).AppointmentsPage;
      ap._appointments = [];
      ap.setView('list');
      expect(ap._view).toBe('list');
      expect(document.getElementById('appt-list-view')!.style.display).toBe('');
    });

    it('switches to week view', () => {
      const ap = (window as any).AppointmentsPage;
      ap._appointments = [];
      ap.setView('week');
      expect(ap._view).toBe('week');
    });
  });

  describe('_renderWeekLabel()', () => {
    it('renders date range in label', () => {
      const ap = (window as any).AppointmentsPage;
      ap._currentWeekStart = new Date(2026, 2, 23); // March 23
      ap._renderWeekLabel();
      const label = document.getElementById('appt-week-label')!;
      expect(label.textContent).toContain('23');
      expect(label.textContent).toContain('2026');
    });
  });

  describe('_getStatusClass()', () => {
    it('returns correct class for confirmed', () => {
      expect((window as any).AppointmentsPage._getStatusClass('confirmed')).toBe('status-confirmed');
    });

    it('returns correct class for cancelled', () => {
      expect((window as any).AppointmentsPage._getStatusClass('cancelled')).toBe('status-cancelled');
    });

    it('returns correct class for completed', () => {
      expect((window as any).AppointmentsPage._getStatusClass('completed')).toBe('status-completed');
    });

    it('returns correct class for pending', () => {
      expect((window as any).AppointmentsPage._getStatusClass('pending')).toBe('status-pending');
    });

    it('returns status-confirmed as default for unknown status', () => {
      expect((window as any).AppointmentsPage._getStatusClass('unknown')).toBe('status-confirmed');
      expect((window as any).AppointmentsPage._getStatusClass(undefined)).toBe('status-confirmed');
    });
  });

  describe('_getStatusBadgeClass()', () => {
    it('returns badge-green for confirmed', () => {
      expect((window as any).AppointmentsPage._getStatusBadgeClass('confirmed')).toBe('badge-green');
    });

    it('returns badge-red for cancelled', () => {
      expect((window as any).AppointmentsPage._getStatusBadgeClass('cancelled')).toBe('badge-red');
    });

    it('returns badge-green as default', () => {
      expect((window as any).AppointmentsPage._getStatusBadgeClass('xyz')).toBe('badge-green');
    });
  });

  describe('loadAppointments()', () => {
    it('has loadAppointments method', () => {
      expect(typeof (window as any).AppointmentsPage.loadAppointments).toBe('function');
    });
  });

  describe('_renderListView()', () => {
    it('shows empty state with no appointments', () => {
      const ap = (window as any).AppointmentsPage;
      ap._appointments = [];
      ap._renderListView();
      const body = document.getElementById('appt-list-body')!;
      expect(body.innerHTML).toContain('Keine Termine');
    });

    it('renders appointment rows', () => {
      const ap = (window as any).AppointmentsPage;
      ap._appointments = [
        { id: '1', appointment_date: '2026-03-25T10:00:00', customer_name: 'Firma A', phone: '+49123', duration_minutes: 30, status: 'confirmed' },
      ];
      ap._renderListView();
      const body = document.getElementById('appt-list-body')!;
      expect(body.innerHTML).toContain('Firma A');
    });
  });
});
