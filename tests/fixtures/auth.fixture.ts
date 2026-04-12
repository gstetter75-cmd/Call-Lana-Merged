import { test as base, expect, Page } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

type AuthFixtures = {
  customerPage: Page;
  adminPage: Page;
};

async function loginViaApi(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function setSession(page: Page, session: any) {
  await page.goto('/login.html');
  await page.evaluate((s: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(s));
  }, session);
}

export const test = base.extend<AuthFixtures>({
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = process.env.TEST_CUSTOMER_EMAIL || 'g.stetter@gmx.net';
    const password = process.env.TEST_CUSTOMER_PASSWORD || 'Abcund123..';
    const session = await loginViaApi(email, password);
    if (session.access_token) {
      await setSession(page, session);
    }
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = process.env.TEST_ADMIN_EMAIL || 'gstetter75@googlemail.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'Abcund123..';
    const session = await loginViaApi(email, password);
    if (session.access_token) {
      await setSession(page, session);
    }
    await use(page);
    await context.close();
  },
});

export { expect };
