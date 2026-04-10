import { test, expect } from '../fixtures/auth.fixture';

test.describe('Performance – API Query Efficiency', () => {

  test('dashboard loads with under 20 Supabase requests', async ({ customerPage: page }) => {
    const supabaseRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('supabase') && req.url().includes('rest')) {
        supabaseRequests.push(req.url());
      }
    });
    // Dashboard is already loaded via fixture, navigate to trigger fresh load
    await page.reload();
    await page.waitForTimeout(5000);
    expect(supabaseRequests.length).toBeLessThan(20);
  });

  test('settings page loads with under 10 Supabase requests', async ({ customerPage: page }) => {
    const supabaseRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('supabase') && req.url().includes('rest')) {
        supabaseRequests.push(req.url());
      }
    });
    await page.goto('/settings.html');
    await page.waitForTimeout(5000);
    expect(supabaseRequests.length).toBeLessThan(10);
  });

  test('no duplicate API requests on dashboard load', async ({ customerPage: page }) => {
    const supabaseRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('supabase') && url.includes('rest')) {
        // Normalize URL (remove timestamps, etc.)
        const normalized = url.split('?')[0] + '?' + new URLSearchParams(
          [...new URL(url).searchParams.entries()].filter(([k]) => k !== '_')
        ).toString();
        supabaseRequests.push(normalized);
      }
    });
    await page.reload();
    await page.waitForTimeout(5000);
    const uniqueRequests = new Set(supabaseRequests);
    // Allow some duplication (realtime subscriptions, auth refreshes)
    const duplicationRatio = supabaseRequests.length / (uniqueRequests.size || 1);
    expect(duplicationRatio).toBeLessThan(2.0);
  });

  test('protected pages load bundles as ES modules', async ({ customerPage: page }) => {
    await page.goto('/dashboard.html');
    await page.waitForTimeout(1000);
    const moduleScripts = await page.locator('script[type="module"]').count();
    expect(moduleScripts).toBeGreaterThanOrEqual(1);
  });
});
