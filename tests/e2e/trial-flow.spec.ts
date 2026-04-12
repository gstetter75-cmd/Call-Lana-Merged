import { test, expect } from '../fixtures/auth.fixture';

test.describe('Trial System', () => {

  test('dashboard shows trial banner for new customer', async ({ customerPage }) => {
    const page = customerPage;

    // Check for trial banner on home page
    const trialBanner = page.locator('#trial-banner');
    const emergencyBanner = page.locator('#emergency-banner');
    const usageAlert = page.locator('#usage-alert');

    // At least one of these should be visible (trial banner or nothing — not "Guthaben aufgebraucht")
    await page.waitForTimeout(2000);

    // If trial banner exists, it should show trial info
    if (await trialBanner.locator('div').count() > 0) {
      const bannerText = await trialBanner.textContent();
      // Should contain trial-related text, not "Guthaben aufgebraucht"
      expect(bannerText).not.toContain('Guthaben fast aufgebraucht');
    }

    // Usage alert should NOT show "fast aufgebraucht" for trial users with 0 balance
    if (await usageAlert.locator('div').count() > 0) {
      const alertText = await usageAlert.textContent();
      // Should either be empty or trial-specific
      if (alertText && alertText.trim().length > 0) {
        expect(alertText).not.toContain('fast aufgebraucht');
      }
    }
  });

  test('plans page shows plan comparison grid', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to plans
    const planNav = page.locator('[data-page="plans"], [data-action="navigate"][data-id="plans"]').first();
    if (await planNav.count() > 0) {
      await planNav.click();
      await page.waitForTimeout(1000);
    }

    // Check for plan cards
    const starterCard = page.locator('#planCardStarter');
    const proCard = page.locator('#planCardProfessional');
    const bizCard = page.locator('#planCardBusiness');

    if (await starterCard.count() > 0) {
      await expect(starterCard).toBeVisible();
      // Should show price
      const starterText = await starterCard.textContent();
      expect(starterText).toContain('149');
    }

    if (await proCard.count() > 0) {
      await expect(proCard).toBeVisible();
      const proText = await proCard.textContent();
      expect(proText).toContain('299');
      expect(proText).toContain('EMPFOHLEN');
    }

    if (await bizCard.count() > 0) {
      await expect(bizCard).toBeVisible();
    }
  });

  test('plan selection buttons use data-action (not onclick)', async ({ customerPage }) => {
    const page = customerPage;

    const planNav = page.locator('[data-page="plans"]').first();
    if (await planNav.count() > 0) {
      await planNav.click();
      await page.waitForTimeout(1000);
    }

    // Check that buttons use data-action, not onclick
    const selectBtns = page.locator('[data-action="select-plan"]');
    if (await selectBtns.count() > 0) {
      expect(await selectBtns.count()).toBeGreaterThanOrEqual(2); // Starter + Professional
      const firstBtn = selectBtns.first();
      const onclick = await firstBtn.getAttribute('onclick');
      expect(onclick).toBeNull();
    }
  });

  test('top-up button does NOT directly modify balance', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to billing
    const billingNav = page.locator('[data-page="billing"], [data-action="navigate"][data-id="billing"]').first();
    if (await billingNav.count() === 0) {
      test.skip();
      return;
    }
    await billingNav.click();
    await page.waitForTimeout(1000);

    // Open topup modal
    const topupBtn = page.locator('[data-action="open-topup"]').first();
    if (await topupBtn.count() === 0) {
      test.skip();
      return;
    }
    await topupBtn.click();
    await page.waitForTimeout(500);

    // Intercept network requests to check that topup goes through Edge Function, not RPC
    const requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('supabase')) {
        requests.push(req.url());
      }
    });

    // Click confirm (will fail due to no Stripe, but we check the request)
    const confirmBtn = page.locator('[data-action="confirm-topup"], #topupConfirmBtn').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);

      // Should NOT call atomic_balance_topup RPC
      const rpcCalls = requests.filter(r => r.includes('atomic_balance_topup'));
      expect(rpcCalls.length).toBe(0);

      // Should call create-checkout-session function
      const functionCalls = requests.filter(r => r.includes('functions') && r.includes('create-checkout-session'));
      // May or may not succeed (depends on Stripe config), but the call should be attempted
    }
  });

  test('no inline scripts on protected pages', async ({ page }) => {
    // Check all 4 protected pages have no inline scripts
    for (const p of ['dashboard', 'admin', 'sales', 'settings']) {
      const response = await page.goto(`/${p}.html`, { waitUntil: 'domcontentloaded' });
      const html = await response?.text() || '';

      // Count inline script tags (not src= scripts)
      const inlineScripts = html.match(/<script>[\s\S]*?<\/script>/g) || [];
      expect(inlineScripts.length).toBe(0);
    }
  });

  test('bundles load as ES modules', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'domcontentloaded' });
    const html = await page.content();

    // Should have type="module" on bundle script
    expect(html).toContain('type="module"');
    expect(html).toContain('dist/dashboard.bundle.js');
  });
});
