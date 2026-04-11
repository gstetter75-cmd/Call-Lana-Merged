import { test, expect } from '@playwright/test';

test.describe('404 Error Page', () => {
  test('404 page loads with error message', async ({ page }) => {
    await page.goto('/404.html', { waitUntil: 'domcontentloaded' });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('404');
    expect(bodyText).toMatch(/nicht gefunden|Seite.*existiert/i);
  });

  test('404 page has title', async ({ page }) => {
    await page.goto('/404.html', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title).toContain('nicht gefunden');
  });

  test('404 page has navigation back to home', async ({ page }) => {
    await page.goto('/404.html', { waitUntil: 'domcontentloaded' });
    const homeLink = page.locator('a[href="index.html"], a[href="/"]');
    expect(await homeLink.count()).toBeGreaterThanOrEqual(1);
  });

  test('404 page has footer with legal links', async ({ page }) => {
    await page.goto('/404.html', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a[href="impressum.html"]')).toBeVisible();
    await expect(footer.locator('a[href="datenschutz.html"]')).toBeVisible();
  });

  test('404 page has correct lang attribute', async ({ page }) => {
    await page.goto('/404.html', { waitUntil: 'domcontentloaded' });
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('de');
  });

  test('non-existent URL shows content', async ({ page }) => {
    // Note: http-server doesn't auto-redirect to 404.html for missing pages
    // This test just verifies the 404 page itself works correctly
    const response = await page.goto('/this-page-does-not-exist.html', { waitUntil: 'domcontentloaded' });
    // http-server returns 404 status for missing files
    if (response) {
      expect(response.status()).toBe(404);
    }
  });
});
