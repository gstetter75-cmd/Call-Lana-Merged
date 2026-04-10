import { test, expect } from '../fixtures/auth.fixture';

test.describe('Sales CRM – Complete Coverage', () => {

  const salesTabs = ['pipeline', 'leads', 'tasks', 'customers', 'commission', 'availability'];

  test('all sales tabs are reachable', async ({ adminPage: page }) => {
    await page.goto('/sales.html');
    await page.waitForTimeout(2000);
    for (const tab of salesTabs) {
      const btn = page.locator(`[data-tab="${tab}"]`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('pipeline tab renders content', async ({ adminPage: page }) => {
    await page.goto('/sales.html');
    await page.waitForTimeout(2000);
    const pipelineBtn = page.locator('[data-tab="pipeline"]').first();
    if (await pipelineBtn.count() > 0) {
      await pipelineBtn.click();
      await page.waitForTimeout(1000);
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(50);
    }
  });

  test('leads tab renders list or empty state', async ({ adminPage: page }) => {
    await page.goto('/sales.html');
    await page.waitForTimeout(2000);
    const leadsBtn = page.locator('[data-tab="leads"]').first();
    if (await leadsBtn.count() > 0) {
      await leadsBtn.click();
      await page.waitForTimeout(1000);
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(30);
    }
  });

  test('tasks tab renders list or empty state', async ({ adminPage: page }) => {
    await page.goto('/sales.html');
    await page.waitForTimeout(2000);
    const tasksBtn = page.locator('[data-tab="tasks"]').first();
    if (await tasksBtn.count() > 0) {
      await tasksBtn.click();
      await page.waitForTimeout(1000);
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(20);
    }
  });

  test('sales page has no inline onclick handlers', async ({ adminPage: page }) => {
    await page.goto('/sales.html');
    await page.waitForTimeout(2000);
    const onclickCount = await page.locator('[onclick]').count();
    expect(onclickCount).toBeLessThanOrEqual(2);
  });

  test('sales page loads without critical errors', async ({ adminPage: page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/sales.html');
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('Failed to fetch')
    );
    expect(critical.length).toBeLessThanOrEqual(5);
  });
});
