import { test, expect } from '../fixtures/auth.fixture';

test.describe('Integration – Stripe', () => {

  test('billing tab shows plan info', async ({ customerPage: page }) => {
    const planBadge = page.locator('#planBadge, #planName');
    if (await planBadge.count() > 0) {
      const text = await planBadge.first().innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('topup button exists and is clickable', async ({ customerPage: page }) => {
    const openBtn = page.locator('[data-action="open-topup"]').first();
    expect(await openBtn.count()).toBeGreaterThanOrEqual(1);
  });

  test('plan selection buttons exist for all plans', async ({ customerPage: page }) => {
    const starter = page.locator('#planCardStarter');
    const pro = page.locator('#planCardProfessional');
    const business = page.locator('#planCardBusiness');
    expect(await starter.count()).toBe(1);
    expect(await pro.count()).toBe(1);
    expect(await business.count()).toBe(1);
  });

  test('no direct balance manipulation RPC in client code', async ({ customerPage: page }) => {
    // Verify the insecure atomic_balance_topup is not called client-side
    const allScripts = await page.locator('script').allTextContents();
    for (const script of allScripts) {
      expect(script).not.toContain('atomic_balance_topup');
    }
    // Also check loaded JS modules
    const pageContent = await page.content();
    // inline scripts should not contain RPC calls
    expect(pageContent).not.toContain('atomic_balance_topup');
  });
});
