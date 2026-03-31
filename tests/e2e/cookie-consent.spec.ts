import { test, expect } from '@playwright/test';

test.describe('Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure banner shows
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('calllana_cookie_consent'));
  });

  test('cookie banner appears on first visit', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const banner = page.locator('#cookieBanner');
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test('banner has accept and essential buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('#cbAccept')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#cbEssential')).toBeVisible({ timeout: 5000 });
  });

  test('accept button hides banner and sets localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('#cbAccept').click({ timeout: 5000 });
    // Banner should disappear
    await expect(page.locator('#cookieBanner')).toBeHidden({ timeout: 3000 });
    // localStorage should be set
    const consent = await page.evaluate(() => localStorage.getItem('calllana_cookie_consent'));
    expect(consent).toBe('all');
  });

  test('essential button hides banner and sets localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('#cbEssential').click({ timeout: 5000 });
    await expect(page.locator('#cookieBanner')).toBeHidden({ timeout: 3000 });
    const consent = await page.evaluate(() => localStorage.getItem('calllana_cookie_consent'));
    expect(consent).toBe('essential');
  });

  test('banner does not appear after consent is given', async ({ page }) => {
    // Set consent before visiting
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('calllana_cookie_consent', 'all'));
    // Reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Banner should NOT be visible
    const banner = page.locator('#cookieBanner');
    await expect(banner).toBeHidden({ timeout: 3000 });
  });

  test('banner contains link to Datenschutzerklärung', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const link = page.locator('#cookieBanner a[href="datenschutz.html"]');
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});
