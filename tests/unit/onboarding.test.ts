import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Onboarding', () => {
  let OB: any;

  beforeEach(() => {
    setupGlobalMocks();
    document.body.innerHTML = '<div id="onboarding-section"></div>';

    // Provide clanaDB mock on window
    (window as any).clanaDB = {
      getOnboardingProgress: vi.fn().mockResolvedValue({ data: [] }),
      getAssistants: vi.fn().mockResolvedValue({ data: [] }),
      completeOnboardingStep: vi.fn().mockResolvedValue({ data: null }),
    };
    (window as any).Confetti = undefined;
    (window as any).Toast = undefined;
    (window as any).sessionStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    loadBrowserScript('js/onboarding.js');
    OB = (window as any).Onboarding;
  });

  describe('steps', () => {
    it('has 5 items', () => {
      expect(OB.steps).toHaveLength(5);
    });

    it('has correct keys', () => {
      const keys = OB.steps.map((s: any) => s.key);
      expect(keys).toEqual([
        'create_assistant',
        'assign_number',
        'configure_greeting',
        'first_test_call',
        'go_live',
      ]);
    });

    it('each step has label, desc, icon, and page', () => {
      OB.steps.forEach((s: any) => {
        expect(s).toHaveProperty('label');
        expect(s).toHaveProperty('desc');
        expect(s).toHaveProperty('icon');
        expect(s).toHaveProperty('page');
      });
    });
  });

  describe('init()', () => {
    it('hides section when all steps are completed', async () => {
      const allSteps = OB.steps.map((s: any) => ({ step_key: s.key }));
      (window as any).clanaDB.getOnboardingProgress = vi.fn().mockResolvedValue({ data: allSteps });
      (window as any).clanaDB.getAssistants = vi.fn().mockResolvedValue({ data: [] });

      await OB.init('test-uid');

      const container = document.getElementById('onboarding-section')!;
      expect(container.style.display).toBe('none');
    });

    it('shows section when steps are incomplete', async () => {
      (window as any).clanaDB.getOnboardingProgress = vi.fn().mockResolvedValue({ data: [] });
      (window as any).clanaDB.getAssistants = vi.fn().mockResolvedValue({ data: [] });

      await OB.init('test-uid');

      const container = document.getElementById('onboarding-section')!;
      expect(container.style.display).toBe('block');
    });

    it('returns early if container does not exist', async () => {
      document.body.innerHTML = '';
      await OB.init('test-uid');
      // Should not throw
      expect((window as any).clanaDB.getOnboardingProgress).not.toHaveBeenCalled();
    });
  });

  describe('render()', () => {
    it('shows progress bar with correct percentage', async () => {
      // 2 of 5 steps completed = 40%
      const twoSteps = [{ step_key: 'create_assistant' }, { step_key: 'assign_number' }];
      (window as any).clanaDB.getOnboardingProgress = vi.fn().mockResolvedValue({ data: twoSteps });
      (window as any).clanaDB.getAssistants = vi.fn().mockResolvedValue({ data: [] });

      await OB.init('test-uid');

      const container = document.getElementById('onboarding-section')!;
      expect(container.innerHTML).toContain('width:40%');
      expect(container.innerHTML).toContain('2/5');
    });

    it('shows 0% when no steps completed', async () => {
      (window as any).clanaDB.getOnboardingProgress = vi.fn().mockResolvedValue({ data: [] });
      (window as any).clanaDB.getAssistants = vi.fn().mockResolvedValue({ data: [] });

      await OB.init('test-uid');

      const container = document.getElementById('onboarding-section')!;
      expect(container.innerHTML).toContain('width:0%');
      expect(container.innerHTML).toContain('0/5');
    });
  });

  describe('celebrate()', () => {
    it('calls Confetti.fire if available', () => {
      const fireSpy = vi.fn();
      (window as any).Confetti = { fire: fireSpy };
      OB.celebrate();
      expect(fireSpy).toHaveBeenCalledOnce();
    });

    it('calls Toast.success if available', () => {
      const successSpy = vi.fn();
      (window as any).Toast = { success: successSpy };
      OB.celebrate();
      expect(successSpy).toHaveBeenCalledOnce();
      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Geschafft'));
    });

    it('does not throw if Confetti/Toast are undefined', () => {
      (window as any).Confetti = undefined;
      (window as any).Toast = undefined;
      expect(() => OB.celebrate()).not.toThrow();
    });
  });
});
