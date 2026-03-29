import { test, expect } from '@playwright/test';

test.describe('SEO & PWA', () => {

  const publicPages = [
    '/', '/funktionen.html', '/branchen.html', '/preise.html',
    '/kontakt.html', '/login.html', '/registrierung.html',
    '/impressum.html', '/datenschutz.html', '/agb.html'
  ];

  for (const url of publicPages) {
    test(`${url} has meta description`, async ({ page: p }) => {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const desc = await p.locator('meta[name="description"]').getAttribute('content').catch(() => null);
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeGreaterThan(10);
    });
  }

  test('homepage has og:image tag', async ({ page }) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
    expect(ogImage).toContain('og-image');
  });

  test('homepage has structured data (JSON-LD)', async ({ page }) => {
    await page.goto('/');
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);
    const jsonLd = await scripts.first().textContent();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd!);
    expect(data['@context']).toBe('https://schema.org');
  });

  test('homepage has title with Call Lana', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Call Lana');
  });

  test('homepage has lang="de"', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('de');
  });

  test('sitemap.xml is accessible and valid', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const text = await page.textContent('body');
    expect(text).toContain('urlset');
    expect(text).toContain('call-lana.de');
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const text = await page.textContent('body');
    expect(text).toContain('Sitemap');
    expect(text).toContain('Disallow: /dashboard.html');
    expect(text).toContain('Disallow: /admin.html');
  });

  test('manifest.json is valid', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const manifest = JSON.parse(await page.textContent('body') || '{}');
    expect(manifest.name).toContain('Call Lana');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBeDefined();
    expect(manifest.icons?.length).toBeGreaterThan(0);
  });

  test('google-site-verification tag is present', async ({ page }) => {
    await page.goto('/');
    const verification = await page.locator('meta[name="google-site-verification"]').getAttribute('content');
    expect(verification).toBeTruthy();
  });

  test('protected pages have noindex or redirect to login', async ({ page }) => {
    for (const url of ['/dashboard.html', '/admin.html', '/sales.html', '/settings.html']) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      // Either has noindex meta tag OR redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('login.html')) continue; // redirected — OK
      const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
      if (robots) {
        expect(robots).toContain('noindex');
      }
    }
  });

  test('og-image file exists', async ({ page }) => {
    const response = await page.goto('/img/og-image.png');
    expect(response?.status()).toBe(200);
  });
});
