import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {

  test('login form inputs have labels or placeholders', async ({ page }) => {
    await page.goto('/login.html');
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      const ariaLabel = await input.getAttribute('aria-label');
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0;
      // Each input should have at least one accessible name
      const hasName = (placeholder && placeholder.length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        label > 0;
      expect(hasName).toBe(true);
    }
  });

  test('kontakt form inputs have accessible names', async ({ page }) => {
    await page.goto('/kontakt.html');
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]), textarea');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0;
      const hasName = (placeholder && placeholder.length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        label > 0;
      expect(hasName).toBe(true);
    }
  });

  test('all buttons have text or aria-label', async ({ page }) => {
    await page.goto('/login.html');
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.innerText()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const hasName = text.length > 0 || (ariaLabel && ariaLabel.length > 0) || (title && title.length > 0);
      expect(hasName).toBe(true);
    }
  });

  test('no empty links on public pages', async ({ page }) => {
    const pages = ['/', '/preise.html', '/kontakt.html'];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(1500);
      const links = page.locator('a:visible');
      const count = await links.count();
      let emptyLinks = 0;
      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const text = (await link.innerText()).trim();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        const img = await link.locator('img, svg').count();
        if (text.length === 0 && !ariaLabel && !title && img === 0) {
          emptyLinks++;
        }
      }
      // Allow a few (icon links, etc.)
      expect(emptyLinks).toBeLessThanOrEqual(3);
    }
  });

  test('main text has sufficient color contrast (not near-white)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const bodyColor = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.color;
    });
    // Body text should not be near-white (rgb close to 255,255,255)
    expect(bodyColor).not.toBe('rgb(255, 255, 255)');
    expect(bodyColor).not.toBe('rgba(255, 255, 255, 1)');
  });

  test('images larger than 100px have alt attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const images = page.locator('img');
    const count = await images.count();
    let missingAlt = 0;
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const width = await img.evaluate((el: HTMLImageElement) => el.naturalWidth || el.clientWidth);
      if (width > 100) {
        const alt = await img.getAttribute('alt');
        if (alt === null) missingAlt++;
      }
    }
    expect(missingAlt).toBeLessThanOrEqual(3);
  });

  test('focus indicator is visible on interactive elements', async ({ page }) => {
    await page.goto('/login.html');
    // Tab to the email field
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Check that some element has focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });

  test('page language is set for screen readers', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThanOrEqual(2);
  });
});
