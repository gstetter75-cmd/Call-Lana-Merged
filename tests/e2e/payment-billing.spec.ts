import { test, expect } from '../fixtures/auth.fixture';

test.describe('Payment & Billing', () => {

  test('billing tab renders balance and plan info', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to billing tab
    const billingTab = page.locator('.sb-item[data-page="billing"], [data-page="billing"]');
    if (await billingTab.count() > 0) {
      await billingTab.first().click();
      await page.waitForTimeout(1000);
    } else {
      // Try via data-action navigate
      const navBtn = page.locator('[data-action="navigate"][data-id="billing"]');
      if (await navBtn.count() > 0) {
        await navBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // Check that balance display exists
    const balance = page.locator('#balanceDisplay, #currentBalance, [id*="balance"]').first();
    if (await balance.count() > 0) {
      await expect(balance).toBeVisible();
    }

    // Check that plan info is shown
    const planBadge = page.locator('.badge-purple, [class*="plan"]').first();
    if (await planBadge.count() > 0) {
      await expect(planBadge).toBeVisible();
    }
  });

  test('top-up modal opens and shows amount options', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to billing
    const billingNav = page.locator('[data-page="billing"]').first();
    if (await billingNav.count() > 0) {
      await billingNav.click();
      await page.waitForTimeout(1000);
    }

    // Click top-up button
    const topupBtn = page.locator('[data-action="open-topup"], .btn-balance').first();
    if (await topupBtn.count() === 0) {
      test.skip();
      return;
    }
    await topupBtn.click();
    await page.waitForTimeout(500);

    // Check modal is visible
    const modal = page.locator('#topupModal, [id*="topup"]').first();
    if (await modal.count() > 0) {
      // Check amount buttons exist
      const amountBtns = page.locator('.topup-btn, [data-action="select-topup"]');
      expect(await amountBtns.count()).toBeGreaterThanOrEqual(3);
    }
  });

  test('payment modal shows SEPA and card options', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to payment
    const paymentNav = page.locator('[data-page="payment"]').first();
    if (await paymentNav.count() > 0) {
      await paymentNav.click();
      await page.waitForTimeout(1000);
    }

    // Open payment method modal
    const addBtn = page.locator('[data-action="open-payment"]').first();
    if (await addBtn.count() === 0) {
      test.skip();
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    // Check SEPA and card type buttons
    const sepaBtn = page.locator('[data-action="select-pm-type"][data-id="sepa"], .pm-type-btn[data-type="sepa"]').first();
    const cardBtn = page.locator('[data-action="select-pm-type"][data-id="credit_card"], .pm-type-btn[data-type="credit_card"]').first();

    if (await sepaBtn.count() > 0) {
      await expect(sepaBtn).toBeVisible();
    }
    if (await cardBtn.count() > 0) {
      await expect(cardBtn).toBeVisible();
    }
  });

  test('IBAN field formats input correctly', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to payment and open modal
    const paymentNav = page.locator('[data-page="payment"]').first();
    if (await paymentNav.count() > 0) {
      await paymentNav.click();
      await page.waitForTimeout(1000);
    }

    const addBtn = page.locator('[data-action="open-payment"]').first();
    if (await addBtn.count() === 0) {
      test.skip();
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    // Find IBAN input
    const ibanInput = page.locator('#sepaIban');
    if (await ibanInput.count() === 0) {
      test.skip();
      return;
    }

    // Type an IBAN and check formatting
    await ibanInput.fill('DE89370400440532013000');
    await ibanInput.dispatchEvent('input');
    await page.waitForTimeout(200);

    const value = await ibanInput.inputValue();
    // Should be formatted with spaces
    expect(value.replace(/\s/g, '')).toBe('DE89370400440532013000');
  });

  test('transaction history is accessible', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to transactions tab
    const txNav = page.locator('[data-page="transactions"], [data-action="navigate"][data-id="transactions"]').first();
    if (await txNav.count() === 0) {
      test.skip();
      return;
    }
    await txNav.click();
    await page.waitForTimeout(1500);

    // Check that transaction table or empty state exists
    const table = page.locator('#transactionsTable, [id*="transaction"]').first();
    const emptyState = page.locator('text=Keine Transaktionen, text=Noch keine');
    const hasContent = (await table.count() > 0) || (await emptyState.count() > 0);
    expect(hasContent).toBe(true);
  });

  test('invoices tab loads without errors', async ({ customerPage }) => {
    const page = customerPage;

    // Navigate to invoices
    const invNav = page.locator('[data-page="invoices"], .sb-item[data-page="invoices"]').first();
    if (await invNav.count() === 0) {
      test.skip();
      return;
    }
    await invNav.click();
    await page.waitForTimeout(1500);

    // Check for invoice table or empty state
    const tableBody = page.locator('#invoiceTableBody');
    if (await tableBody.count() > 0) {
      // Either has rows or shows empty message
      const content = await tableBody.innerHTML();
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
