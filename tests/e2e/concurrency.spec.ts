import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

test.describe('Concurrency – Public Pages', () => {

  test('double-click on login submit does not crash', async ({ page }) => {
    await page.goto('/login.html');
    const submitBtn = page.locator('button[type="submit"]').first();
    // Rapid double-click
    await submitBtn.dblclick();
    await page.waitForTimeout(1000);
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('rapid navigation between pages does not crash', async ({ page }) => {
    const urls = ['/', '/preise.html', '/funktionen.html', '/kontakt.html', '/login.html'];
    for (const url of urls) {
      await page.goto(url, { waitUntil: 'commit' });
    }
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});

authTest.describe('Concurrency – Authenticated', () => {

  authTest('rapid tab switching in dashboard does not crash', async ({ customerPage: page }) => {
    const tabs = ['transactions', 'home', 'appointments', 'analytics', 'home'];
    for (const tab of tabs) {
      const item = page.locator(`.sb-item[data-page="${tab}"]`);
      if (await item.count() > 0) {
        await item.click();
        // No waitForTimeout — rapid switching
      }
    }
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  authTest('page reload preserves session', async ({ customerPage: page }) => {
    await page.reload();
    await page.waitForTimeout(3000);
    const url = page.url();
    // Should still be on dashboard (not redirected to login)
    expect(url).toContain('dashboard');
  });
});
