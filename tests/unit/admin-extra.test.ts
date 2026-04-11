import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('AdminExtra', () => {
  let AE: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'onb-pending', 'onb-setup', 'onb-live', 'onb-total-badge', 'onb-tbody',
      'min-critical', 'min-warning', 'min-normal', 'min-tbody',
      'err-today', 'err-warnings', 'err-resolved', 'err-tbody',
    ];
    document.body.innerHTML = ids.map(id => `<div id="${id}"></div>`).join('');

    mocks = setupGlobalMocks();

    (window as any).showToast = vi.fn();

    loadBrowserScript('js/admin-extra.js');
    AE = (window as any).AdminExtra;
  });

  it('exports AdminExtra to window', () => {
    expect(AE).toBeDefined();
    expect(typeof AE).toBe('object');
  });

  it('has loadOnboarding method', () => {
    expect(typeof AE.loadOnboarding).toBe('function');
  });

  it('has loadMinutesAlert method', () => {
    expect(typeof AE.loadMinutesAlert).toBe('function');
  });

  it('has loadErrorLog method', () => {
    expect(typeof AE.loadErrorLog).toBe('function');
  });

  it('has initTab method', () => {
    expect(typeof AE.initTab).toBe('function');
  });

  describe('_getPlanLimit', () => {
    it('returns 100 for free plan', () => {
      expect(AE._getPlanLimit('free')).toBe(100);
    });

    it('returns 1000 for solo plan', () => {
      expect(AE._getPlanLimit('solo')).toBe(1000);
    });

    it('returns 3000 for team plan', () => {
      expect(AE._getPlanLimit('team')).toBe(3000);
    });

    it('returns 10000 for business plan', () => {
      expect(AE._getPlanLimit('business')).toBe(10000);
    });

    it('returns 500 for unknown plan', () => {
      expect(AE._getPlanLimit('unknown')).toBe(500);
    });
  });

  describe('initTab', () => {
    it('calls loadOnboarding for onboarding tab', async () => {
      const spy = vi.spyOn(AE, 'loadOnboarding').mockResolvedValue(undefined);
      await AE.initTab('onboarding');
      expect(spy).toHaveBeenCalled();
    });

    it('calls loadMinutesAlert for minutes-alert tab', async () => {
      const spy = vi.spyOn(AE, 'loadMinutesAlert').mockResolvedValue(undefined);
      await AE.initTab('minutes-alert');
      expect(spy).toHaveBeenCalled();
    });

    it('calls loadErrorLog for error-log tab', async () => {
      const spy = vi.spyOn(AE, 'loadErrorLog').mockResolvedValue(undefined);
      await AE.initTab('error-log');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('loadErrorLog', () => {
    it('renders empty state when no errors', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await AE.loadErrorLog();

      const tbody = document.getElementById('err-tbody')!;
      expect(tbody.innerHTML).toContain('Keine Fehler');
    });
  });
});
