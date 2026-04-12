import { test, expect } from '@playwright/test';

/* ================================================================
   New Features — E2E Tests
   Blog, Pricing Calculator, Analytics, SEO, JS Features, WhatsApp
   ================================================================ */

// ── Blog Tests ──────────────────────────────────────────────────

test.describe('Blog', () => {

  const blogArticles = [
    '/blog/ki-telefonassistent-handwerk.html',
    '/blog/handwerker-anrufe-verpassen.html',
    '/blog/telefonservice-handwerker-kosten.html',
    '/blog/automatische-terminbuchung-handwerker.html',
    '/blog/ki-telefon-handwerksbetrieb.html',
  ];

  test('blog index page loads at /blog/', async ({ page }) => {
    const response = await page.goto('/blog/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('blog index has 5 article cards', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const cards = page.locator('.blog-card');
    await expect(cards).toHaveCount(5);
  });

  for (const articleUrl of blogArticles) {
    test(`article link ${articleUrl} returns 200`, async ({ page }) => {
      const response = await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response?.status()).toBe(200);
    });
  }

  for (const articleUrl of blogArticles) {
    test(`${articleUrl} has Article schema JSON-LD`, async ({ page }) => {
      await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const scripts = page.locator('script[type="application/ld+json"]');
      const count = await scripts.count();
      let foundArticle = false;
      for (let i = 0; i < count; i++) {
        const text = await scripts.nth(i).textContent();
        if (text) {
          const data = JSON.parse(text);
          if (data['@type'] === 'Article') {
            foundArticle = true;
            expect(data['@context']).toBe('https://schema.org');
            expect(data.headline).toBeTruthy();
            break;
          }
        }
      }
      expect(foundArticle).toBe(true);
    });
  }
});

// ── Pricing Calculator Tests ────────────────────────────────────

test.describe('Pricing Calculator', () => {

  test('preise.html has the savings calculator section', async ({ page }) => {
    await page.goto('/preise.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const calculator = page.locator('#callsPerDay');
    await expect(calculator).toBeAttached();
  });

  test('slider inputs exist for calls and duration', async ({ page }) => {
    await page.goto('/preise.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const callsSlider = page.locator('input[type="range"]#callsPerDay');
    const durationSlider = page.locator('input[type="range"]#callDuration');
    await expect(callsSlider).toBeAttached();
    await expect(durationSlider).toBeAttached();
  });

  test('calculator shows recommendation text', async ({ page }) => {
    await page.goto('/preise.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const recommendation = page.locator('#recommendationBadge');
    await expect(recommendation).toBeAttached();
    // Trigger calculation by waiting for initial script run
    await page.waitForTimeout(500);
    const text = await recommendation.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ── Analytics Tests ─────────────────────────────────────────────

test.describe('Analytics — Plausible', () => {

  const pagesWithPlausible = [
    '/',
    '/preise.html',
    '/blog/',
  ];

  for (const url of pagesWithPlausible) {
    test(`${url} has Plausible analytics script tag`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const plausible = page.locator('script[data-domain][src*="plausible"]');
      await expect(plausible).toBeAttached();
    });
  }
});

// ── SEO Tests (extended) ────────────────────────────────────────

test.describe('SEO — Extended', () => {

  test('llms.txt is accessible and contains "Call Lana"', async ({ page }) => {
    const response = await page.goto('/llms.txt');
    expect(response?.status()).toBe(200);
    const text = await page.textContent('body');
    expect(text).toContain('Call Lana');
  });

  const blogArticles = [
    '/blog/ki-telefonassistent-handwerk.html',
    '/blog/handwerker-anrufe-verpassen.html',
    '/blog/telefonservice-handwerker-kosten.html',
    '/blog/automatische-terminbuchung-handwerker.html',
    '/blog/ki-telefon-handwerksbetrieb.html',
  ];

  for (const articleUrl of blogArticles) {
    test(`${articleUrl} has BreadcrumbList schema`, async ({ page }) => {
      await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const scripts = page.locator('script[type="application/ld+json"]');
      const count = await scripts.count();
      let foundBreadcrumb = false;
      for (let i = 0; i < count; i++) {
        const text = await scripts.nth(i).textContent();
        if (text) {
          const data = JSON.parse(text);
          if (data['@type'] === 'BreadcrumbList') {
            foundBreadcrumb = true;
            expect(data.itemListElement?.length).toBeGreaterThan(0);
            break;
          }
        }
      }
      expect(foundBreadcrumb).toBe(true);
    });
  }

  for (const articleUrl of blogArticles) {
    test(`${articleUrl} has canonical URL`, async ({ page }) => {
      await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain('call-lana.de');
    });
  }
});

// ── New JS Features ─────────────────────────────────────────────

test.describe('New JS Features', () => {

  test('index.html loads ab-testing.js', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const script = page.locator('script[src*="ab-testing"]');
    await expect(script).toBeAttached();
  });

  const dashboardPages = [
    '/dashboard.html',
    '/admin.html',
    '/sales.html',
    '/settings.html',
  ];

  for (const url of dashboardPages) {
    test(`${url} loads error-tracker.js`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const script = page.locator('script[src*="error-tracker"]');
      await expect(script).toBeAttached();
    });
  }

  test('settings page has referral tab', async ({ page }) => {
    await page.goto('/settings.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const referralLink = page.locator('[data-tab="referral"]');
    await expect(referralLink).toBeAttached();
    const referralTab = page.locator('#tab-referral');
    await expect(referralTab).toBeAttached();
  });
});

// ── WhatsApp Widget ─────────────────────────────────────────────

test.describe('WhatsApp Widget', () => {

  test('kontakt.html has WhatsApp floating button', async ({ page }) => {
    await page.goto('/kontakt.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const whatsappBtn = page.locator('#whatsapp-btn');
    await expect(whatsappBtn).toBeAttached();
    const href = await whatsappBtn.getAttribute('href');
    expect(href).toContain('wa.me');
  });
});
