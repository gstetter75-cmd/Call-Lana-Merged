import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';
const SALES_EMAIL = 'info@call-lana.de';
const SALES_PASSWORD = 'Abcund123..';

async function loginAs(page: any, email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await res.json();
  if (!session.access_token) throw new Error(`Login failed: ${session.msg}`);

  await page.goto('/login.html');
  await page.evaluate((s: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(s));
  }, session);
  return session;
}

test.describe('Sales Page', () => {

  test('sales page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, SALES_EMAIL, SALES_PASSWORD);
    await page.goto('/sales.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Content should render
    const content = page.locator('.content, .sidebar, .tab-btn').first();
    await expect(content).toBeVisible({ timeout: 10000 });

    const criticalErrors = errors.filter(e =>
      !e.includes('404') && !e.includes('403') && !e.includes('406') &&
      !e.includes('Failed to fetch') && !e.includes('Load failed')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('sales page has pipeline tabs', async ({ page }) => {
    await loginAs(page, SALES_EMAIL, SALES_PASSWORD);
    await page.goto('/sales.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should have tab buttons for pipeline sections
    const tabs = page.locator('.tab-btn');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sales sidebar shows correct user', async ({ page }) => {
    await loginAs(page, SALES_EMAIL, SALES_PASSWORD);
    await page.goto('/sales.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Sidebar should show sales user info
    const sidebar = page.locator('.sidebar');
    if (await sidebar.count() > 0) {
      const text = await sidebar.textContent();
      expect(text).toContain('Sales');
    }
  });

  test('customer who accesses sales.html is redirected', async ({ page }) => {
    const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'g.stetter@gmx.net';
    const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD || 'Abcund123..';

    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/sales.html');
    await page.waitForTimeout(5000);

    // Customer should be redirected away from sales page
    const url = page.url();
    expect(url).not.toContain('sales.html');
  });
});
