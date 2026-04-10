import { test as base, expect, Page } from '@playwright/test';

// Auth fixture: provides logged-in pages for different roles
type AuthFixtures = {
  customerPage: Page;
  adminPage: Page;
};

async function loginAs(page: Page, email: string, password: string, expectedUrl: string) {
  await page.goto('/login.html');
  await page.waitForSelector('#login-email', { state: 'visible', timeout: 10_000 });

  // Dismiss cookie banner first — it can overlay the form
  try {
    const cookieBtn = page.locator('button:has-text("Alle akzeptieren"), button:has-text("Nur notwendige"), #cookie-accept');
    await cookieBtn.first().click({ timeout: 3000 });
    await page.waitForTimeout(500);
  } catch { /* no cookie banner */ }

  // Fill login form — use type() for more reliable input
  await page.locator('#login-email').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').click();
  await page.locator('#login-password').type(password, { delay: 20 });
  await page.waitForTimeout(500);

  // Verify password field has value before submitting
  const pwValue = await page.locator('#login-password').inputValue();
  if (!pwValue) {
    // Retry with evaluate as fallback
    await page.evaluate(([sel, val]) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }, ['#login-password', password]);
  }

  // Click submit
  await page.locator('form button[type="submit"]').first().click();

  // Wait for redirect after login
  await page.waitForURL(`**/${expectedUrl}*`, { timeout: 20_000 });
  // Wait for auth-pending to be removed (content visible)
  await page.waitForFunction(() => !document.body.classList.contains('auth-pending'), { timeout: 10_000 });
}

export const test = base.extend<AuthFixtures>({
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(
      page,
      process.env.TEST_CUSTOMER_EMAIL || '',
      process.env.TEST_CUSTOMER_PASSWORD || '',
      'dashboard.html'
    );
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(
      page,
      process.env.TEST_ADMIN_EMAIL || '',
      process.env.TEST_ADMIN_PASSWORD || '',
      'admin.html'
    );
    await use(page);
    await context.close();
  },
});

export { expect };
