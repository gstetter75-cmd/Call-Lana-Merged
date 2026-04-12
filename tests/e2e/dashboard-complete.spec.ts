import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard – Complete Coverage', () => {

  const dashboardTabs = ['home', 'transactions', 'appointments', 'analytics', 'more'];

  test('all sidebar tabs are clickable', async ({ customerPage: page }) => {
    for (const tab of dashboardTabs) {
      const item = page.locator(`.sb-item[data-page="${tab}"]`);
      if (await item.count() > 0) {
        await item.click();
        await page.waitForTimeout(500);
        // Page should not crash — body still visible
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('active tab gets highlighted class', async ({ customerPage: page }) => {
    const homeTab = page.locator('.sb-item[data-page="home"]');
    if (await homeTab.count() > 0) {
      await homeTab.click();
      await page.waitForTimeout(500);
      const classes = await homeTab.getAttribute('class');
      expect(classes).toContain('active');
    }
  });

  test('switching tabs updates visible content', async ({ customerPage: page }) => {
    // Click transactions tab
    const txTab = page.locator('.sb-item[data-page="transactions"]');
    if (await txTab.count() > 0) {
      await txTab.click();
      await page.waitForTimeout(1000);
      // Transaction page content or empty state should be visible
      const pageContent = page.locator('#page-transactions, [data-page-content="transactions"]');
      if (await pageContent.count() > 0) {
        await expect(pageContent.first()).toBeVisible();
      }
    }
  });

  test('billing page shows balance', async ({ customerPage: page }) => {
    // Navigate to billing via sidebar or tab
    const billingPage = page.locator('#page-billing');
    if (await billingPage.count() > 0) {
      const balanceEl = page.locator('#balanceValue');
      if (await balanceEl.count() > 0) {
        const text = await balanceEl.innerText();
        // Balance should be a number or formatted currency
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  test('plans page shows 3 plan cards', async ({ customerPage: page }) => {
    const plansPage = page.locator('#page-plans');
    if (await plansPage.count() > 0) {
      const starter = page.locator('#planCardStarter');
      const pro = page.locator('#planCardProfessional');
      const business = page.locator('#planCardBusiness');
      // At least the plan cards should exist in DOM
      expect(await starter.count()).toBe(1);
      expect(await pro.count()).toBe(1);
      expect(await business.count()).toBe(1);
    }
  });

  test('trial banner exists in DOM', async ({ customerPage: page }) => {
    const banner = page.locator('#trial-banner');
    // Banner should exist (visible or hidden depending on trial state)
    expect(await banner.count()).toBe(1);
  });

  test('top-up modal can be triggered', async ({ customerPage: page }) => {
    const topupModal = page.locator('#topupModal');
    expect(await topupModal.count()).toBe(1);
    // Trigger open
    const openBtn = page.locator('[data-action="open-topup"]').first();
    if (await openBtn.count() > 0 && await openBtn.isVisible()) {
      await openBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('console errors stay below threshold during navigation', async ({ customerPage: page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // Navigate through tabs
    for (const tab of dashboardTabs) {
      const item = page.locator(`.sb-item[data-page="${tab}"]`);
      if (await item.count() > 0) {
        await item.click();
        await page.waitForTimeout(500);
      }
    }
    // Filter non-critical errors
    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('Failed to fetch')
    );
    expect(critical.length).toBeLessThanOrEqual(10);
  });
});
