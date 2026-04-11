#!/usr/bin/env node
// Uptime monitoring: checks key endpoints and outputs JSON results.
// Run via cron or GitHub Actions. Exit code 1 if any check fails.

const ENDPOINTS = [
  {
    name: 'Website',
    url: 'https://call-lana.de/',
    expectedStatus: [200],
  },
  {
    name: 'VAPI Webhook',
    url: 'https://fgwtptriileytmmotevs.supabase.co/functions/v1/vapi-webhook',
    expectedStatus: [401, 405], // unauthorized or method not allowed = alive
  },
  {
    name: 'Supabase REST',
    url: 'https://fgwtptriileytmmotevs.supabase.co/rest/v1/',
    expectedStatus: [401], // unauthorized = alive
  },
];

async function checkEndpoint({ name, url, expectedStatus }) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
    const latencyMs = Date.now() - start;
    const alive = expectedStatus.includes(res.status);
    return { name, url, status: res.status, alive, latencyMs };
  } catch (err) {
    return { name, url, status: null, alive: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function main() {
  const results = await Promise.all(ENDPOINTS.map(checkEndpoint));
  const allAlive = results.every((r) => r.alive);

  const report = {
    timestamp: new Date().toISOString(),
    allHealthy: allAlive,
    checks: results,
  };

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(allAlive ? 0 : 1);
}

main();
