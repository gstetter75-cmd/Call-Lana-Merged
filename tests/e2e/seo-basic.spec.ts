import { test, expect } from '@playwright/test';

const PAGES = ['/', '/preise.html', '/funktionen.html', '/kontakt.html', '/branchen.html'];

test.describe('SEO Basics', () => {
  for (const url of PAGES) {
    const name = url === '/' ? 'homepage' : url.replace('/', '').replace('.html', '');

    test(`${name} has title tag`, async ({ page }) => {
      await page.goto(url);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
      expect(title).toContain('Call Lana');
    });

    test(`${name} has meta description`, async ({ page }) => {
      await page.goto(url);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeGreaterThan(50);
    });
  }

  test('homepage has h1 tag', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThan(0);
  });

  test('homepage has Open Graph tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
  });

  test('all pages have lang="de"', async ({ page }) => {
    for (const url of PAGES) {
      await page.goto(url);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('de');
    }
  });
});
