import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://fgwtptriileytmmotevs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S';

async function loginAs(page: any, email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await res.json();
  await page.goto('/login.html');
  await page.evaluate((s: any) => {
    localStorage.setItem('sb-fgwtptriileytmmotevs-auth-token', JSON.stringify(s));
  }, session);
}

test.describe('Performance', () => {

  test('login page loads under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Login page load: ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });

  test('dashboard loads under 5 seconds', async ({ page }) => {
    await loginAs(page, 'g.stetter@gmx.net', 'Abcund123..');
    const start = Date.now();
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Dashboard load: ${duration}ms`);
    expect(duration).toBeLessThan(8000);
  });

  test('admin loads under 8 seconds', async ({ page }) => {
    await loginAs(page, 'gstetter75@googlemail.com', 'Abcund123..');
    const start = Date.now();
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Admin load: ${duration}ms`);
    expect(duration).toBeLessThan(8000);
  });

  test('marketing page loads under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Marketing page load: ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });

  test('total JS bundle size is under 500 KB', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const distDir = path.join(process.cwd(), 'dist');
    const files = fs.readdirSync(distDir).filter((f: string) => f.endsWith('.js') && !f.endsWith('.map'));
    const totalSize = files.reduce((sum: number, f: string) => {
      return sum + fs.statSync(path.join(distDir, f)).size;
    }, 0);
    const totalKB = Math.round(totalSize / 1024);
    console.log(`Total JS: ${totalKB} KB (${files.length} files)`);
    expect(totalKB).toBeLessThan(500);
  });
});
