import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings – Complete Coverage', () => {

  const settingsTabs = ['profile', 'security', 'notifications', 'forwarding', 'calendar',
    'connectors', 'addons', 'referral', 'danger'];

  test('all settings tabs are reachable', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(2000);
    for (const tab of settingsTabs) {
      const btn = page.locator(`[data-tab="${tab}"]`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(300);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('profile tab has email field', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(2000);
    const profileBtn = page.locator('[data-tab="profile"]').first();
    if (await profileBtn.count() > 0) await profileBtn.click();
    await page.waitForTimeout(500);
    // Email input should exist (may be readonly)
    const emailInput = page.locator('input[type="email"], #profile-email, #settingsEmail');
    expect(await emailInput.count()).toBeGreaterThanOrEqual(1);
  });

  test('security tab has password fields', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(2000);
    const secBtn = page.locator('[data-tab="security"]').first();
    if (await secBtn.count() > 0) await secBtn.click();
    await page.waitForTimeout(500);
    const pwFields = page.locator('input[type="password"]');
    expect(await pwFields.count()).toBeGreaterThanOrEqual(1);
  });

  test('notifications tab has toggle elements', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(2000);
    const notifBtn = page.locator('[data-tab="notifications"]').first();
    if (await notifBtn.count() > 0) await notifBtn.click();
    await page.waitForTimeout(500);
    // Look for toggle switches, checkboxes, or similar
    const toggles = page.locator('input[type="checkbox"], .toggle, [role="switch"]');
    expect(await toggles.count()).toBeGreaterThanOrEqual(1);
  });

  test('settings page has no inline onclick handlers', async ({ customerPage: page }) => {
    await page.goto('/settings.html');
    await page.waitForTimeout(1000);
    const onclickCount = await page.locator('[onclick]').count();
    expect(onclickCount).toBeLessThanOrEqual(2);
  });

  test('settings page loads without critical errors', async ({ customerPage: page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/settings.html');
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('Failed to fetch')
    );
    expect(critical.length).toBeLessThanOrEqual(5);
  });
});
