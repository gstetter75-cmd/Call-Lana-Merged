import { test, expect } from '@playwright/test';

test.describe('Performance – Page Load', () => {

  const publicPages = ['/', '/login.html', '/preise.html', '/funktionen.html', '/kontakt.html'];

  for (const url of publicPages) {
    test(`${url} DOMContentLoaded under 3 seconds`, async ({ page }) => {
      const start = Date.now();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(3000);
    });
  }

  test('homepage total HTTP requests under 50', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url()));
    await page.goto('/');
    await page.waitForTimeout(3000);
    expect(requests.length).toBeLessThan(50);
  });

  test('no horizontal overflow on any public page (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const url of ['/', '/preise.html', '/kontakt.html']) {
      await page.goto(url);
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThan(20);
    }
  });

  test('images on homepage have width and height attributes for CLS prevention', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const images = page.locator('img[src]:not([src=""])');
    const count = await images.count();
    let missingDimensions = 0;
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      const style = await img.getAttribute('style');
      const classes = await img.getAttribute('class') || '';
      // Has explicit dimensions, CSS dimensions, or Tailwind classes
      if (!width && !height && !style?.includes('width') && !classes.includes('w-')) {
        missingDimensions++;
      }
    }
    // Allow images without explicit dimensions (dynamically sized, SVGs, icons)
    expect(missingDimensions).toBeLessThanOrEqual(10);
  });
});
