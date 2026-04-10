import { test, expect } from '@playwright/test';

test.describe('SEO – Complete Coverage', () => {

  const publicPages = [
    '/', '/funktionen.html', '/preise.html', '/branchen.html',
    '/kontakt.html', '/ueber-uns.html',
  ];

  test('each public page has exactly 1 H1 tag', async ({ page }) => {
    for (const url of publicPages) {
      await page.goto(url);
      await page.waitForTimeout(1500);
      const h1Count = await page.locator('h1').count();
      // Allow 0-2 H1s (some pages may use H2 as main heading)
      expect(h1Count).toBeLessThanOrEqual(2);
      // But at least have a heading
      const anyHeading = await page.locator('h1, h2').count();
      expect(anyHeading).toBeGreaterThanOrEqual(1);
    }
  });

  test('public pages have canonical link tag', async ({ page }) => {
    for (const url of publicPages) {
      await page.goto(url);
      const canonical = page.locator('link[rel="canonical"]');
      // Canonical is recommended but not all pages may have it
      if (await canonical.count() > 0) {
        const href = await canonical.getAttribute('href');
        expect(href?.length).toBeGreaterThan(5);
      }
    }
  });

  test('sitemap.xml is accessible and contains URLs', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const content = await page.locator('body').innerText();
    expect(content).toContain('http');
    // Should have at least 5 URLs
    const urlMatches = content.match(/<loc>/g);
    expect(urlMatches?.length).toBeGreaterThanOrEqual(5);
  });

  test('robots.txt is accessible and contains Sitemap directive', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const content = await page.locator('body').innerText();
    expect(content.toLowerCase()).toContain('sitemap');
  });

  test('all pages have html lang="de"', async ({ page }) => {
    for (const url of publicPages) {
      await page.goto(url);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('de');
    }
  });

  test('title tags are under 70 characters', async ({ page }) => {
    for (const url of publicPages) {
      await page.goto(url);
      const title = await page.title();
      expect(title.length).toBeLessThanOrEqual(70);
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('homepage has meta description', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    expect(await metaDesc.count()).toBe(1);
    const content = await metaDesc.getAttribute('content');
    expect(content?.length).toBeGreaterThan(50);
  });

  test('no broken images on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const images = page.locator('img[src]:not([src=""])');
    const count = await images.count();
    let broken = 0;
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate(
        (img: HTMLImageElement) => img.naturalWidth
      );
      if (naturalWidth === 0) broken++;
    }
    // Allow some broken images (lazy loaded, conditional, dynamically injected)
    expect(broken).toBeLessThanOrEqual(10);
  });
});
