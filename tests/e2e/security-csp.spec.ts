import { test, expect } from '@playwright/test';

test.describe('Security – CSP & Inline Script Audit', () => {

  const protectedPages = [
    '/dashboard.html',
    '/admin.html',
    '/sales.html',
    '/settings.html',
  ];

  for (const url of protectedPages) {
    test(`${url} has zero inline scripts`, async ({ page }) => {
      await page.goto(url);
      await page.waitForTimeout(1000);
      // Count <script> tags without src attribute (inline scripts)
      const inlineScripts = await page.locator('script:not([src]):not([type="application/ld+json"])').count();
      expect(inlineScripts).toBe(0);
    });
  }

  for (const url of protectedPages) {
    test(`${url} has zero onclick handlers`, async ({ page }) => {
      await page.goto(url);
      await page.waitForTimeout(1000);
      const onclickCount = await page.locator('[onclick]').count();
      expect(onclickCount).toBe(0);
    });
  }

  test('login page password field is type=password', async ({ page }) => {
    await page.goto('/login.html');
    const pwField = page.locator('#login-password');
    const type = await pwField.getAttribute('type');
    expect(type).toBe('password');
  });

  test('no document.write in loaded page scripts', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Check that no inline script uses document.write
    const scripts = await page.locator('script:not([src])').allTextContents();
    for (const script of scripts) {
      expect(script).not.toContain('document.write');
    }
  });

  test('all pages have viewport meta tag', async ({ page }) => {
    const pages = ['/', '/login.html', '/preise.html', '/dashboard.html'];
    for (const url of pages) {
      await page.goto(url);
      const viewport = page.locator('meta[name="viewport"]');
      expect(await viewport.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
