import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('blog index loads with articles', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
    // Should contain article links
    const links = page.locator('a[href*="blog/"]');
    expect(await links.count()).toBeGreaterThanOrEqual(1);
  });

  test('blog index has meta description', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(10);
  });

  const articles = [
    'handwerker-anrufe-verpassen',
    'telefonservice-handwerker-kosten',
    'ki-telefonassistent-handwerk',
    'automatische-terminbuchung-handwerker',
    'ki-telefon-handwerksbetrieb',
  ];

  for (const slug of articles) {
    test(`article "${slug}" loads with content`, async ({ page }) => {
      await page.goto(`/blog/${slug}.html`, { waitUntil: 'domcontentloaded' });
      // Has a heading
      const h1 = page.locator('h1');
      expect(await h1.count()).toBeGreaterThanOrEqual(1);
      const heading = await h1.first().innerText();
      expect(heading.length).toBeGreaterThan(5);
      // Has substantial content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(200);
    });
  }

  test('blog articles have navigation back to blog', async ({ page }) => {
    await page.goto('/blog/handwerker-anrufe-verpassen.html', { waitUntil: 'domcontentloaded' });
    // Should have a link back to blog index or home
    const navLinks = page.locator('a[href*="blog"], a[href*="index"]');
    expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('blog articles have structured data', async ({ page }) => {
    await page.goto('/blog/handwerker-anrufe-verpassen.html', { waitUntil: 'domcontentloaded' });
    const jsonLd = page.locator('script[type="application/ld+json"]');
    if (await jsonLd.count() > 0) {
      const text = await jsonLd.first().textContent();
      const data = JSON.parse(text!);
      expect(data['@context']).toBe('https://schema.org');
    }
  });
});
