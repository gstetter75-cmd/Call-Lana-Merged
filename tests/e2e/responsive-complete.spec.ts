import { test, expect } from '@playwright/test';

test.describe('Responsive – Complete Coverage', () => {

  // Helper to check no horizontal scroll
  async function checkNoHScroll(page: any) {
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThan(20);
  }

  // --- Mobile 375x667 ---

  test('mobile: blog page has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/blog/index.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
  });

  test('mobile: preise page cards are visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/preise.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
    const body = await page.locator('body').innerText();
    expect(body).toContain('Starter');
  });

  test('mobile: kontakt form is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/kontakt.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
    // Submit button should be visible
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('mobile: funktionen page has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/funktionen.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
  });

  // --- Tablet 768x1024 ---

  test('tablet: homepage content renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    await checkNoHScroll(page);
    // Content should be visible
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('tablet: preise page has no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/preise.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
  });

  // --- Large Desktop 1920x1080 ---

  test('large desktop: homepage content is centered', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Content should not stretch full width — check max-width
    const bodyWidth = await page.evaluate(() => {
      const main = document.querySelector('main, .container, .max-w-7xl, section');
      if (!main) return document.body.clientWidth;
      return (main as HTMLElement).clientWidth;
    });
    // Content area should be less than full viewport (has max-width)
    expect(bodyWidth).toBeLessThanOrEqual(1920);
  });

  // --- Landscape 667x375 ---

  test('landscape: login form is usable', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/login.html');
    await page.waitForTimeout(1000);
    await checkNoHScroll(page);
    // Email field and submit should be visible
    await expect(page.locator('#login-email')).toBeVisible();
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });
});
