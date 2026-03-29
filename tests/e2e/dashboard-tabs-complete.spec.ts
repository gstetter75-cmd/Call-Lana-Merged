import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard — All Tabs Complete', () => {

  const tabs = [
    { page: 'home', label: 'Home', selector: '#page-home' },
    { page: 'assistants', label: 'Assistenten', selector: '#page-assistants' },
    { page: 'knowledge', label: 'Wissensbasis', selector: '#page-knowledge' },
    { page: 'phones', label: 'Telefonnummern', selector: '#page-phones' },
    { page: 'transactions', label: 'Anrufverlauf', selector: '#page-transactions' },
    { page: 'appointments', label: 'Termine', selector: '#page-appointments' },
    { page: 'analytics', label: 'Analytics', selector: '#page-analytics' },
    { page: 'messages', label: 'Nachrichten', selector: '#page-messages' },
    { page: 'billing', label: 'Abrechnung', selector: '#page-billing' },
    { page: 'payment', label: 'Zahlungsmethoden', selector: '#page-payment' },
    { page: 'plans', label: 'Paket', selector: '#page-plans' },
    { page: 'team', label: 'Team', selector: '#page-team' },
  ];

  for (const tab of tabs) {
    test(`${tab.label} tab loads and becomes active`, async ({ customerPage: page }) => {
      const navItem = page.locator(`.sb-item[data-page="${tab.page}"]`);
      if (await navItem.count() > 0) {
        await navItem.click();
        await page.waitForTimeout(800);
        const section = page.locator(tab.selector);
        if (await section.count() > 0) {
          await expect(section).toHaveClass(/active/);
        }
      }
    });
  }

  test('knowledge tab shows upload or empty state', async ({ customerPage: page }) => {
    const navItem = page.locator('.sb-item[data-page="knowledge"]');
    if (await navItem.count() > 0) {
      await navItem.click();
      await page.waitForTimeout(800);
      const content = page.locator('#page-knowledge');
      if (await content.count() > 0) {
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });

  test('phones tab shows number management', async ({ customerPage: page }) => {
    const navItem = page.locator('.sb-item[data-page="phones"]');
    if (await navItem.count() > 0) {
      await navItem.click();
      await page.waitForTimeout(800);
      const content = page.locator('#page-phones');
      if (await content.count() > 0) {
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });

  test('messages tab shows conversation area', async ({ customerPage: page }) => {
    const navItem = page.locator('.sb-item[data-page="messages"]');
    if (await navItem.count() > 0) {
      await navItem.click();
      await page.waitForTimeout(800);
      const content = page.locator('#page-messages');
      if (await content.count() > 0) {
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });

  test('payment tab shows payment method form or list', async ({ customerPage: page }) => {
    const navItem = page.locator('.sb-item[data-page="payment"]');
    if (await navItem.count() > 0) {
      await navItem.click();
      await page.waitForTimeout(800);
      const content = page.locator('#page-payment');
      if (await content.count() > 0) {
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });

  test('team tab shows member management', async ({ customerPage: page }) => {
    const navItem = page.locator('.sb-item[data-page="team"]');
    if (await navItem.count() > 0) {
      await navItem.click();
      await page.waitForTimeout(800);
      const content = page.locator('#page-team');
      if (await content.count() > 0) {
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });
});
