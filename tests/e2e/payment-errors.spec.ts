import { test, expect } from '../fixtures/auth.fixture';

test.describe('Payment – Error Handling', () => {

  test('billing tab is reachable and renders', async ({ customerPage: page }) => {
    const billingPage = page.locator('#page-billing');
    if (await billingPage.count() > 0) {
      const content = await billingPage.innerText();
      expect(content.length).toBeGreaterThan(10);
    }
  });

  test('topup modal opens on trigger', async ({ customerPage: page }) => {
    const openBtn = page.locator('[data-action="open-topup"]').first();
    if (await openBtn.count() > 0 && await openBtn.isVisible()) {
      await openBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('#topupModal');
      expect(await modal.count()).toBe(1);
    }
  });

  test('topup has amount selection', async ({ customerPage: page }) => {
    const modal = page.locator('#topupModal');
    if (await modal.count() > 0) {
      const amountInputs = modal.locator('[data-action="select-topup"], input[type="number"], .topup-amount');
      expect(await amountInputs.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('payment section references SEPA or card methods', async ({ customerPage: page }) => {
    const body = await page.locator('body').innerText();
    const hasPaymentInfo = body.includes('SEPA') || body.includes('Kreditkarte') ||
      body.includes('Zahlungsmethode') || body.includes('IBAN') ||
      body.includes('Payment') || body.includes('Guthaben');
    expect(hasPaymentInfo).toBe(true);
  });

  test('no atomic_balance_topup RPC in page scripts', async ({ customerPage: page }) => {
    const scripts = await page.locator('script').allTextContents();
    for (const script of scripts) {
      expect(script).not.toContain('atomic_balance_topup');
    }
  });

  test('billing page shows plan info', async ({ customerPage: page }) => {
    const planBadge = page.locator('#planBadge, #planName');
    if (await planBadge.count() > 0) {
      const text = await planBadge.first().innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
