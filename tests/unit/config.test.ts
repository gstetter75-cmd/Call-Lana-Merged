import { describe, it, expect, beforeEach } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('CONFIG', () => {
  beforeEach(() => {
    setupGlobalMocks();
    loadBrowserScript('js/config.js');
  });

  const getConfig = () => (window as any).CONFIG;

  it('is defined on window', () => {
    expect(getConfig()).toBeDefined();
  });

  it('has all expected top-level keys', () => {
    const config = getConfig();
    expect(config.PLANS).toBeDefined();
    expect(config.COMMISSION_RATE).toBeDefined();
    expect(config.CUSTOMER_STATUSES).toBeDefined();
    expect(config.CALL_DIRECTIONS).toBeDefined();
    expect(config.CALL_OUTCOMES).toBeDefined();
    expect(config.INDUSTRIES).toBeDefined();
    expect(config.HEALTH_THRESHOLDS).toBeDefined();
  });

  it('COMMISSION_RATE is 5%', () => {
    expect(getConfig().COMMISSION_RATE).toBe(0.05);
  });

  describe('getPlanPrice()', () => {
    it('returns correct price for starter', () => {
      expect(getConfig().getPlanPrice('starter')).toBe(149);
    });

    it('returns correct price for professional', () => {
      expect(getConfig().getPlanPrice('professional')).toBe(299);
    });

    it('returns correct price for business', () => {
      expect(getConfig().getPlanPrice('business')).toBe(599);
    });

    it('defaults to starter price for unknown plan', () => {
      expect(getConfig().getPlanPrice('unknown_plan')).toBe(149);
    });

    it('defaults to starter price for null', () => {
      expect(getConfig().getPlanPrice(null)).toBe(149);
    });

    it('handles case-insensitive plan names', () => {
      expect(getConfig().getPlanPrice('STARTER')).toBe(149);
      expect(getConfig().getPlanPrice('Professional')).toBe(299);
    });
  });

  describe('getPlanLabel()', () => {
    it('returns Starter for starter plan', () => {
      expect(getConfig().getPlanLabel('starter')).toBe('Starter');
    });

    it('returns Professional for professional plan', () => {
      expect(getConfig().getPlanLabel('professional')).toBe('Professional');
    });

    it('returns Business for business plan', () => {
      expect(getConfig().getPlanLabel('business')).toBe('Business');
    });

    it('defaults to Starter label for unknown plan', () => {
      expect(getConfig().getPlanLabel('unknown')).toBe('Starter');
    });

    it('defaults to Starter label for null', () => {
      expect(getConfig().getPlanLabel(null)).toBe('Starter');
    });
  });

  describe('getHealthColor()', () => {
    it('returns green for score >= 70', () => {
      expect(getConfig().getHealthColor(70)).toBe('#10b981');
      expect(getConfig().getHealthColor(100)).toBe('#10b981');
    });

    it('returns yellow for score >= 40 and < 70', () => {
      expect(getConfig().getHealthColor(40)).toBe('#f59e0b');
      expect(getConfig().getHealthColor(69)).toBe('#f59e0b');
    });

    it('returns red for score < 40', () => {
      expect(getConfig().getHealthColor(39)).toBe('#ef4444');
      expect(getConfig().getHealthColor(0)).toBe('#ef4444');
    });
  });

  describe('getIndustryLabel()', () => {
    it('returns correct label for known industry', () => {
      expect(getConfig().getIndustryLabel('handwerk')).toBe('Handwerk');
      expect(getConfig().getIndustryLabel('immobilien')).toBe('Immobilien');
      expect(getConfig().getIndustryLabel('it')).toBe('IT & Software');
    });

    it('falls back to key for unknown industry', () => {
      expect(getConfig().getIndustryLabel('fintech')).toBe('fintech');
    });

    it('returns dash for null/undefined key', () => {
      expect(getConfig().getIndustryLabel(null)).toBe('—');
      expect(getConfig().getIndustryLabel(undefined)).toBe('—');
    });
  });

  describe('fallback prices (PRICING undefined)', () => {
    it('uses fallback prices when PRICING is not defined', () => {
      // PRICING is not set on window, so fallback branch is used
      const config = getConfig();
      expect(config.PLANS.starter.price).toBe(149);
      expect(config.PLANS.professional.price).toBe(299);
      expect(config.PLANS.business.price).toBe(599);
    });

    it('solo maps to starter price', () => {
      expect(getConfig().PLANS.solo.price).toBe(149);
    });

    it('team maps to professional price', () => {
      expect(getConfig().PLANS.team.price).toBe(299);
    });
  });
});
