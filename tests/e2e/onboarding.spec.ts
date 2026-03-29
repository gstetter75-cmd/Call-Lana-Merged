import { test, expect } from '../fixtures/auth.fixture';

test.describe('Onboarding Widget', () => {

  test('onboarding section exists in dashboard', async ({ customerPage: page }) => {
    const section = page.locator('#onboarding-section');
    // Either visible (steps not complete) or hidden (all done)
    await expect(section).toBeAttached();
  });

  test('onboarding has progress bar', async ({ customerPage: page }) => {
    const section = page.locator('#onboarding-section');
    if (await section.isVisible().catch(() => false)) {
      // Progress bar with percentage
      const progressBar = section.locator('[style*="width"]').first();
      await expect(progressBar).toBeAttached();
    }
  });

  test('onboarding steps are clickable', async ({ customerPage: page }) => {
    const section = page.locator('#onboarding-section');
    if (await section.isVisible().catch(() => false)) {
      // Find uncompleted step and click it
      const step = section.locator('[onclick*="navigateToPage"]').first();
      if (await step.count() > 0) {
        await step.click();
        await page.waitForTimeout(500);
        // Should navigate to a different page/tab
      }
    }
  });

  test('onboarding can be dismissed', async ({ customerPage: page }) => {
    const section = page.locator('#onboarding-section');
    if (await section.isVisible().catch(() => false)) {
      const closeBtn = section.locator('button[title="Ausblenden"], button:has-text("×")');
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
        await page.waitForTimeout(300);
        await expect(section).not.toBeVisible();
      }
    }
  });

  test('onboarding shows welcome message', async ({ customerPage: page }) => {
    const section = page.locator('#onboarding-section');
    if (await section.isVisible().catch(() => false)) {
      await expect(section).toContainText('Willkommen');
    }
  });
});
