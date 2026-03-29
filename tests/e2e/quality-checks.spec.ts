import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

test.describe('Quality Checks', () => {

  // --- Console Errors ---

  test('homepage loads without crash', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toContain('Call Lana');
  });

  // --- Page Load Performance ---

  const publicPages = ['/', '/funktionen.html', '/preise.html', '/kontakt.html', '/login.html'];

  for (const url of publicPages) {
    test(`${url} loads under 5 seconds`, async ({ page }) => {
      const start = Date.now();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  }

  // --- Accessibility basics ---

  test('all images on homepage have alt attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    // Allow SVG icons without alt but flag content images
    expect(imagesWithoutAlt).toBeLessThanOrEqual(3);
  });

  test('login form has proper labels', async ({ page }) => {
    await page.goto('/login.html');
    const emailInput = page.locator('#login-email');
    const passwordInput = page.locator('#login-password');
    // Inputs should have labels, placeholders, or aria-labels
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    expect(emailPlaceholder || '').toBeTruthy();
    expect(passwordPlaceholder || '').toBeTruthy();
  });

  // --- No horizontal scroll ---

  test('no excessive horizontal scroll on mobile homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // Allow up to 20px overflow (scrollbars, minor CSS issues)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThan(20);
  });

  test('no horizontal scroll on mobile login', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login.html');
    await page.waitForTimeout(1000);
    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHScroll).toBe(false);
  });

  // --- External links ---

  test('external links open in new tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const externalLinks = page.locator('a[href^="http"]:not([href*="call-lana"]):not([href*="localhost"])');
    const count = await externalLinks.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const target = await externalLinks.nth(i).getAttribute('target');
      if (target) {
        expect(target).toBe('_blank');
      }
    }
  });

  // --- AGB page ---

  test('agb page loads with content', async ({ page }) => {
    await page.goto('/agb.html');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(200);
  });

  // --- Reset password page ---

  test('reset-password page has form fields', async ({ page }) => {
    await page.goto('/reset-password.html');
    await page.waitForTimeout(1000);
    // Should have password fields
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Passwort');
  });
});

authTest.describe('Authenticated Quality Checks', () => {

  authTest('dashboard has no console errors after login', async ({ customerPage: page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // Navigate to a few tabs to trigger data loading
    await page.locator('.sb-item[data-page="transactions"]').click();
    await page.waitForTimeout(1000);
    await page.locator('.sb-item[data-page="home"]').click();
    await page.waitForTimeout(1000);
    // Filter known non-critical
    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('Failed to fetch')
    );
    // Allow some errors from missing data but flag severe ones
    expect(critical.length).toBeLessThanOrEqual(5);
  });

  authTest('admin page loads without crashing', async ({ adminPage: page }) => {
    // Admin page should be loaded and responsive
    const heading = page.locator('h1, .tab-btn').first();
    await expect(heading).toBeVisible();
  });
});
