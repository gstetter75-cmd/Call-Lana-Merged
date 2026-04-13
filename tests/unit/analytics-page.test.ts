import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('AnalyticsPage', () => {
  let AP: any;
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    const ids = [
      'chart-calls-per-day', 'chart-outcome-mix',
      'chart-booking-trend', 'chart-call-hours',
      'chart-sentiment-trend', 'chart-minutes-gauge',
    ];
    document.body.innerHTML = ids.map(id => `<div id="${id}"></div>`).join('');

    mocks = setupGlobalMocks();

    (window as any).clanaDB = {
      getSettings: vi.fn().mockResolvedValue({ success: true, data: {} }),
    };

    loadBrowserScript('js/analytics-page.js');
    AP = (window as any).AnalyticsPage;
  });

  it('AnalyticsPage is defined on window', () => {
    expect(AP).toBeDefined();
    expect(typeof AP).toBe('object');
  });

  it('has init method', () => {
    expect(typeof AP.init).toBe('function');
  });

  it('_calls array starts empty', () => {
    expect(Array.isArray(AP._calls)).toBe(true);
    expect(AP._calls).toHaveLength(0);
  });

  it('has all render methods', () => {
    expect(typeof AP._renderCallsPerDay).toBe('function');
    expect(typeof AP._renderOutcomeMix).toBe('function');
    expect(typeof AP._renderBookingTrend).toBe('function');
    expect(typeof AP._renderCallHours).toBe('function');
    expect(typeof AP._renderSentimentTrend).toBe('function');
    expect(typeof AP._renderMinutesGauge).toBe('function');
  });

  it('has data helper methods', () => {
    expect(typeof AP._groupByDay).toBe('function');
    expect(typeof AP._groupByWeek).toBe('function');
    expect(typeof AP._emptyMsg).toBe('function');
  });

  it('_emptyMsg returns fallback HTML when no message given', () => {
    const html = AP._emptyMsg();
    expect(html).toContain('Noch nicht genug Daten');
  });

  it('_emptyMsg returns custom message when provided', () => {
    const html = AP._emptyMsg('Keine Daten');
    expect(html).toContain('Keine Daten');
  });

  it('init calls auth.getUser and handles missing user', async () => {
    mocks.auth.getUser.mockResolvedValue(null);
    await AP.init();
    expect(mocks.auth.getUser).toHaveBeenCalled();
    // When user is null, _calls stays empty
    expect(AP._calls).toHaveLength(0);
  });

  it('_groupByDay groups call data by date', () => {
    AP._calls = [
      { created_at: '2026-03-10T10:00:00Z', outcome: 'termin', status: 'completed', sentiment_score: 8 },
      { created_at: '2026-03-10T14:00:00Z', outcome: 'frage', status: 'completed', sentiment_score: 6 },
      { created_at: '2026-03-11T09:00:00Z', outcome: 'termin', status: 'completed', sentiment_score: null },
    ];
    const days = AP._groupByDay();
    expect(days).toHaveLength(2);
    expect(days[0].count).toBe(2);
    expect(days[1].count).toBe(1);
  });
});
