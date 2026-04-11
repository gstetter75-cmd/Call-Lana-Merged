import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

const ACCOUNTS = {
  admin: { email: process.env.TEST_ADMIN_EMAIL || 'gstetter75@googlemail.com', password: process.env.TEST_ADMIN_PASSWORD || 'Abcund123..' },
  customer: { email: process.env.TEST_CUSTOMER_EMAIL || 'g.stetter@gmx.net', password: process.env.TEST_CUSTOMER_PASSWORD || 'Abcund123..' },
};

// Helper: Login via Supabase API and set session in browser
async function loginViaApi(page: any, email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Login failed: ${data.msg}`);

  // Set session in browser localStorage (same key Supabase uses)
  await page.goto('/login.html');
  await page.evaluate((session: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(session));
  }, data);

  return data;
}

test.describe('Critical Flows', () => {

  test('login page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');

    // Login form should be visible
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    // No JS errors
    expect(errors.filter(e => !e.includes('404') && !e.includes('403'))).toEqual([]);
  });

  test('dashboard loads without JS errors for customer', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginViaApi(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Dashboard content should render
    const title = page.locator('h1, h2, .page-title').first();
    await expect(title).toBeVisible({ timeout: 10000 });

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('404') && !e.includes('403') && !e.includes('406') &&
      !e.includes('Failed to fetch') && !e.includes('Load failed')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('admin loads without JS errors for superadmin', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginViaApi(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Admin content should render — check for any visible content
    const content = page.locator('.content, .tab-btn, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 10000 });

    const criticalErrors = errors.filter(e =>
      !e.includes('404') && !e.includes('403') && !e.includes('406') &&
      !e.includes('Failed to fetch') && !e.includes('Load failed')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('settings loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginViaApi(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/settings.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Settings content should render — check for any visible element
    const content = page.locator('.content, .settings-section, h1, h2, .form-group, input').first();
    await expect(content).toBeVisible({ timeout: 15000 });

    const criticalErrors = errors.filter(e =>
      !e.includes('404') && !e.includes('403') && !e.includes('406') &&
      !e.includes('Failed to fetch') && !e.includes('Load failed') &&
      !e.includes('NetworkError') && !e.includes('AbortError')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.context().clearCookies();
    // Clear localStorage
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard.html');
    await page.waitForURL('**/login.html*', { timeout: 15000 });
    expect(page.url()).toContain('login.html');
  });

  test('marketing pages load without auth', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Should have nav and content
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 5000 });

    const criticalErrors = errors.filter(e => !e.includes('Spline'));
    expect(criticalErrors).toEqual([]);
  });
});
