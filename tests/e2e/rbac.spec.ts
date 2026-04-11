import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

const ACCOUNTS = {
  admin: { email: 'gstetter75@googlemail.com', password: 'Abcund123..' },
  sales: { email: 'info@call-lana.de', password: 'Abcund123..' },
  customer: { email: 'g.stetter@gmx.net', password: 'Abcund123..' },
};

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
}

test.describe('Role-Based Access Control', () => {

  // Admin can access all pages
  test('admin can access admin.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login.html');
    expect(page.url()).toContain('admin.html');
  });

  test('admin can access dashboard.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login.html');
  });

  test('admin can access sales.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.goto('/sales.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login.html');
  });

  // Sales can access sales + settings, NOT admin
  test('sales can access sales.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.sales.email, ACCOUNTS.sales.password);
    await page.goto('/sales.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login.html');
  });

  test('sales cannot access admin.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.sales.email, ACCOUNTS.sales.password);
    await page.goto('/admin.html');
    await page.waitForTimeout(5000);
    // Should be redirected away from admin
    expect(page.url()).not.toContain('admin.html');
  });

  // Customer can access dashboard + settings, NOT admin/sales
  test('customer can access dashboard.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login.html');
  });

  test('customer cannot access admin.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/admin.html');
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain('admin.html');
  });

  test('customer cannot access sales.html', async ({ page }) => {
    await loginAs(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/sales.html');
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain('sales.html');
  });

  // Settings accessible by all roles
  test('all roles can access settings.html', async ({ page }) => {
    for (const [role, account] of Object.entries(ACCOUNTS)) {
      await loginAs(page, account.email, account.password);
      await page.goto('/settings.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('login.html');
      // Clear session for next iteration
      await page.evaluate(() => localStorage.clear());
    }
  });
});
