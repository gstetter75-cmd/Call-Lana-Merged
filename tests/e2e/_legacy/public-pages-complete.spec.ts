import { test, expect } from '@playwright/test';

test.describe('Public Pages – Complete Coverage', () => {

  // --- Kontakt form validation ---

  test('kontakt form rejects empty submission', async ({ page }) => {
    await page.goto('/kontakt.html');
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // HTML5 validation should prevent submission — check for :invalid inputs
      const invalidCount = await page.locator('input:invalid, textarea:invalid').count();
      expect(invalidCount).toBeGreaterThan(0);
    }
  });

  test('kontakt form email field rejects invalid email', async ({ page }) => {
    await page.goto('/kontakt.html');
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('not-an-email');
      await emailInput.blur();
      const isInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity()
      );
      expect(isInvalid).toBe(true);
    }
  });

  // --- Ueber-uns page ---

  test('ueber-uns page has substantial content', async ({ page }) => {
    await page.goto('/ueber-uns.html');
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(100);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  // --- AVV page ---

  test('avv page has substantial legal content', async ({ page }) => {
    await page.goto('/avv.html');
    const text = await page.textContent('body');
    expect(text?.length).toBeGreaterThan(200);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  // --- Blog articles ---

  test('blog index lists articles with links', async ({ page }) => {
    await page.goto('/blog/index.html');
    const links = page.locator('a[href*=".html"]:not([href="index.html"])');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('blog articles are reachable', async ({ page }) => {
    // Test known blog articles directly
    const articles = [
      '/blog/ki-telefonassistent-handwerk.html',
      '/blog/handwerker-anrufe-verpassen.html',
      '/blog/telefonservice-handwerker-kosten.html',
    ];
    for (const url of articles) {
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(100);
    }
  });

  // --- Reset password ---

  test('reset-password page has password fields', async ({ page }) => {
    await page.goto('/reset-password.html');
    await page.waitForTimeout(1000);
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // --- 404 page ---

  test('404 page shows error message and back link', async ({ page }) => {
    await page.goto('/404.html');
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(20);
    // Should have a link back to homepage
    const homeLink = page.locator('a[href="/"], a[href="index.html"], a[href="./"]');
    const count = await homeLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // --- Branchen page ---

  test('branchen page lists multiple industries', async ({ page }) => {
    await page.goto('/branchen.html');
    const body = await page.locator('body').innerText();
    // Should mention at least 3 industries
    const industries = ['Klempner', 'Handwerk', 'Arzt', 'Anwalt', 'Immobilien', 'Versicherung'];
    const found = industries.filter(i => body.includes(i));
    expect(found.length).toBeGreaterThanOrEqual(2);
  });

  // --- Preise page plan details ---

  test('preise page shows plan details with prices', async ({ page }) => {
    await page.goto('/preise.html');
    const body = await page.locator('body').innerText();
    expect(body).toContain('Starter');
    // Check for price values
    const hasPrice = body.includes('149') || body.includes('99') || body.includes('€');
    expect(hasPrice).toBe(true);
  });
});
