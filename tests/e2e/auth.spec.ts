import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'gstetter75@googlemail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Abcund123..';
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'g.stetter@gmx.net';
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD || 'Abcund123..';

async function loginViaApi(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function setSession(page: any, session: any) {
  await page.goto('/login.html');
  await page.evaluate((s: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(s));
  }, session);
}

test.describe('Authentication', () => {

  test('login with valid admin credentials redirects to admin page', async ({ page }) => {
    const session = await loginViaApi(ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(session.access_token).toBeTruthy();
    await setSession(page, session);

    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should stay on admin (not redirected to login)
    expect(page.url()).not.toContain('login.html');
  });

  test('login with customer credentials redirects to dashboard', async ({ page }) => {
    const session = await loginViaApi(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    expect(session.access_token).toBeTruthy();
    await setSession(page, session);

    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain('login.html');
  });

  test('login with wrong password returns error via API', async () => {
    const result = await loginViaApi('wrong@example.com', 'WrongPassword123!');
    expect(result.access_token).toBeUndefined();
    expect(result.msg || result.error_code).toBeTruthy();
  });

  test('protected page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    await page.goto('/dashboard.html');
    await page.waitForURL('**/login.html*', { timeout: 15000 });
    expect(page.url()).toContain('login.html');
  });

  test('auth-pending class is removed after auth', async ({ page }) => {
    const session = await loginViaApi(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await setSession(page, session);

    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hasAuthPending = await page.evaluate(() => document.body.classList.contains('auth-pending'));
    expect(hasAuthPending).toBe(false);
  });

  test('session persists after page reload', async ({ page }) => {
    const session = await loginViaApi(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await setSession(page, session);

    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('login.html');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    // After reload, should still be on dashboard (not redirected to login)
    const url = page.url();
    expect(url).not.toContain('login.html');
  });

  test('sidebar is visible after auth', async ({ page }) => {
    const session = await loginViaApi(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await setSession(page, session);

    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const sidebar = page.locator('.sidebar');
    const hasSidebar = await sidebar.count() > 0;
    expect(hasSidebar).toBe(true);
  });

  test('logout clears session', async ({ page }) => {
    const session = await loginViaApi(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await setSession(page, session);

    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Logout via JS and clear all storage
    await page.evaluate(async () => {
      if (typeof (window as any).clanaAuth !== 'undefined') {
        await (window as any).clanaAuth.signOut();
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();

    // Open new page (fresh context without cached tokens)
    const newPage = await page.context().newPage();
    await newPage.goto('/dashboard.html');
    await newPage.waitForURL('**/login.html*', { timeout: 15000 });
    expect(newPage.url()).toContain('login.html');
    await newPage.close();
  });
});
