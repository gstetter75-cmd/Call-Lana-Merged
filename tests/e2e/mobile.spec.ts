import { test, expect, devices } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function loginAs(page: any, email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await res.json();
  await page.goto('/login.html');
  await page.evaluate((s: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(s));
  }, session);
}

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 13

  test('login page is usable on mobile', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('#login-email');
    const pwInput = page.locator('#login-password');
    const submitBtn = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(pwInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Form should be scrollable and usable
    const box = await submitBtn.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(100);
  });

  test('dashboard renders on mobile', async ({ page }) => {
    await loginAs(page, 'g.stetter@gmx.net', 'Abcund123..');
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Content should be visible (sidebar may be hidden)
    expect(page.url()).not.toContain('login.html');
  });

  test('marketing page loads on mobile without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Page should render something
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(100);

    // No critical JS errors
    const critical = errors.filter(e => !e.includes('Spline') && !e.includes('404'));
    expect(critical).toEqual([]);
  });

  test('preise page loads on mobile', async ({ page }) => {
    await page.goto('/preise.html');
    await page.waitForLoadState('networkidle');

    // Should have pricing content
    const text = await page.locator('body').textContent();
    expect(text).toContain('Starter');
  });
});
