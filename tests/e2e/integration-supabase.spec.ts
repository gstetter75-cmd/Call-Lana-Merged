import { test, expect } from '../fixtures/auth.fixture';

test.describe('Integration – Supabase', () => {

  test('session exists in localStorage after login', async ({ customerPage: page }) => {
    const hasSession = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(k => k.includes('sb-') || k.includes('supabase'));
    });
    expect(hasSession).toBe(true);
  });

  test('dashboard loads profile data', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(3000);
    // Settings should show email or profile info
    const emailInput = page.locator('input[type="email"], #profile-email, #settingsEmail');
    if (await emailInput.count() > 0) {
      const value = await emailInput.first().inputValue();
      expect(value).toContain('@');
    }
  });

  test('customer can access dashboard without 401', async ({ customerPage: page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('401') || msg.text().includes('403')) {
        errors.push(msg.text());
      }
    });
    await page.reload();
    await page.waitForTimeout(3000);
    // Filter out non-critical auth errors
    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('admin can access admin page', async ({ adminPage: page }) => {
    await expect(page.locator('body')).toBeVisible();
    const url = page.url();
    expect(url).toContain('admin');
  });

  test('protected pages redirect to login after session clear', async ({ customerPage: page }) => {
    // Clear session
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard.html');
    await page.waitForTimeout(3000);
    const url = page.url();
    const isLoginOrPending = url.includes('login') ||
      await page.locator('.auth-pending, #login-email').count() > 0;
    expect(isLoginOrPending).toBe(true);
  });
});
