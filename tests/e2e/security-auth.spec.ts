import { test, expect } from '@playwright/test';

test.describe('Security – Auth Protection', () => {

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    // Clear any existing session
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard.html');
    // Should redirect to login or show auth-pending overlay
    await page.waitForTimeout(3000);
    const url = page.url();
    const isLoginOrPending = url.includes('login') ||
      await page.locator('.auth-pending, #login-email').count() > 0;
    expect(isLoginOrPending).toBe(true);
  });

  test('unauthenticated access to admin redirects to login', async ({ page }) => {
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/admin.html');
    await page.waitForTimeout(3000);
    const url = page.url();
    const isLoginOrPending = url.includes('login') ||
      await page.locator('.auth-pending, #login-email').count() > 0;
    expect(isLoginOrPending).toBe(true);
  });

  test('unauthenticated access to settings redirects to login', async ({ page }) => {
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/settings.html');
    await page.waitForTimeout(3000);
    const url = page.url();
    const isLoginOrPending = url.includes('login') ||
      await page.locator('.auth-pending, #login-email').count() > 0;
    expect(isLoginOrPending).toBe(true);
  });

  test('login form shows validation for empty fields', async ({ page }) => {
    await page.goto('/login.html');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // HTML5 validation or custom error should appear
    const emailField = page.locator('#login-email');
    const isInvalid = await emailField.evaluate(
      (el: HTMLInputElement) => !el.checkValidity()
    );
    expect(isInvalid).toBe(true);
  });

  test('password field uses type=password not text', async ({ page }) => {
    await page.goto('/login.html');
    const pwType = await page.locator('#login-password').getAttribute('type');
    expect(pwType).toBe('password');
  });

  test('registration password field uses type=password', async ({ page }) => {
    await page.goto('/registrierung.html');
    const pwType = await page.locator('#reg-password').getAttribute('type');
    expect(pwType).toBe('password');
  });
});
