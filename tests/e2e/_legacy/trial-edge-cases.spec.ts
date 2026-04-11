import { test, expect } from '../fixtures/auth.fixture';

test.describe('Trial System – Edge Cases', () => {

  test('trial banner element exists in dashboard DOM', async ({ customerPage: page }) => {
    const banner = page.locator('#trial-banner');
    expect(await banner.count()).toBe(1);
  });

  test('plan comparison grid renders 3 plans', async ({ customerPage: page }) => {
    const starter = page.locator('#planCardStarter');
    const pro = page.locator('#planCardProfessional');
    const business = page.locator('#planCardBusiness');
    expect(await starter.count()).toBe(1);
    expect(await pro.count()).toBe(1);
    expect(await business.count()).toBe(1);
  });

  test('plan selection uses data-action not onclick', async ({ customerPage: page }) => {
    const onclickPlanButtons = page.locator('#planCardStarter [onclick], #planCardProfessional [onclick], #planCardBusiness [onclick]');
    expect(await onclickPlanButtons.count()).toBe(0);
  });

  test('balance display element exists', async ({ customerPage: page }) => {
    const balanceEl = page.locator('#balanceValue');
    expect(await balanceEl.count()).toBe(1);
  });

  test('topup modal exists and has close mechanism', async ({ customerPage: page }) => {
    const modal = page.locator('#topupModal');
    expect(await modal.count()).toBe(1);
    const closeBtn = page.locator('[data-action="close-topup"]');
    expect(await closeBtn.count()).toBeGreaterThanOrEqual(1);
  });

  test('trial expired overlay has upgrade CTA if visible', async ({ customerPage: page }) => {
    await page.waitForTimeout(2000);
    const overlay = page.locator('.trial-expired-overlay:visible, #trial-expired-overlay:visible');
    if (await overlay.count() > 0) {
      const cta = overlay.locator('a, button');
      expect(await cta.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
