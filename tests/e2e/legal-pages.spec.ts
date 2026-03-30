import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  const legalPages = [
    { url: '/impressum.html', title: 'Impressum', heading: 'Impressum' },
    { url: '/datenschutz.html', title: 'Datenschutz', heading: 'Datenschutzerklärung' },
    { url: '/agb.html', title: 'AGB', heading: 'Allgemeine Geschäftsbedingungen' },
    { url: '/avv.html', title: 'AVV', heading: 'Auftragsverarbeitungsvertrag' },
  ];

  for (const page of legalPages) {
    test(`${page.title} page loads with heading`, async ({ page: p }) => {
      await p.goto(page.url, { waitUntil: 'domcontentloaded' });
      await expect(p.locator('h1')).toContainText(page.heading);
    });

    test(`${page.title} has meta description`, async ({ page: p }) => {
      await p.goto(page.url, { waitUntil: 'domcontentloaded' });
      const desc = await p.locator('meta[name="description"]').getAttribute('content');
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeGreaterThan(10);
    });

    test(`${page.title} has canonical URL`, async ({ page: p }) => {
      await p.goto(page.url, { waitUntil: 'domcontentloaded' });
      const canonical = await p.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('call-lana.de');
    });
  }

  test('Impressum contains required legal info', async ({ page }) => {
    await page.goto('/impressum.html', { waitUntil: 'domcontentloaded' });
    const text = await page.locator('.legal-content').innerText();
    expect(text).toContain('Call Lana GmbH');
    expect(text).toContain('Gero Stetter');
    expect(text).toContain('§ 5 DDG');
    expect(text).toContain('§ 18 Abs. 2 MStV');
    expect(text).toContain('info@call-lana.de');
  });

  test('Impressum links to AGB, Datenschutz, AVV', async ({ page }) => {
    await page.goto('/impressum.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="agb.html"]')).toBeVisible();
    await expect(page.locator('a[href="datenschutz.html"]')).toBeVisible();
    await expect(page.locator('a[href="avv.html"]')).toBeVisible();
  });

  test('AGB contains key paragraphs', async ({ page }) => {
    await page.goto('/agb.html', { waitUntil: 'domcontentloaded' });
    const text = await page.locator('.legal-content').innerText();
    expect(text).toContain('§ 1');
    expect(text).toContain('§ 15');
    expect(text).toContain('Geltungsbereich');
    expect(text).toContain('Schlussbestimmungen');
  });

  test('Datenschutz mentions DSGVO and subprocessors', async ({ page }) => {
    await page.goto('/datenschutz.html', { waitUntil: 'domcontentloaded' });
    const text = await page.locator('.legal-content').innerText();
    expect(text).toContain('DSGVO');
    expect(text).toContain('Supabase');
    expect(text).toContain('Stripe');
    expect(text).toContain('Auftragsverarbeitung');
  });

  test('Datenschutz links to AVV', async ({ page }) => {
    await page.goto('/datenschutz.html', { waitUntil: 'domcontentloaded' });
    const avvLinks = page.locator('a[href="avv.html"]');
    expect(await avvLinks.count()).toBeGreaterThan(0);
  });

  test('AVV contains Art. 28 DSGVO sections', async ({ page }) => {
    await page.goto('/avv.html', { waitUntil: 'domcontentloaded' });
    const text = await page.locator('.legal-content').innerText();
    expect(text).toContain('Art. 28 DSGVO');
    expect(text).toContain('Technische und organisatorische Maßnahmen');
    expect(text).toContain('Unterauftragnehmer');
    expect(text).toContain('Löschung');
  });

  test('AVV contains subprocessor table', async ({ page }) => {
    await page.goto('/avv.html', { waitUntil: 'domcontentloaded' });
    const table = page.locator('.sub-table, table');
    expect(await table.count()).toBeGreaterThan(0);
  });

  // Footer links on legal pages
  for (const lp of legalPages) {
    test(`${lp.title} footer contains legal links`, async ({ page: p }) => {
      await p.goto(lp.url, { waitUntil: 'domcontentloaded' });
      const footer = p.locator('footer');
      await expect(footer.locator('a[href="impressum.html"]')).toBeVisible();
      await expect(footer.locator('a[href="datenschutz.html"]')).toBeVisible();
      await expect(footer.locator('a[href="agb.html"]')).toBeVisible();
      await expect(footer.locator('a[href="avv.html"]')).toBeVisible();
    });
  }
});
