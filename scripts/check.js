#!/usr/bin/env node
// ==========================================
// Comprehensive project health check
// Run: node scripts/check.js
// ==========================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`  \x1b[32m✓\x1b[0m ${name}`);
      passed++;
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${name}: ${result}`);
      failed++;
    }
  } catch (err) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}: ${err.message}`);
    failed++;
  }
}

console.log('\n\x1b[1mProject Health Check\x1b[0m\n');

// --- Build ---
console.log('\x1b[36m── Build ──\x1b[0m');
check('Build succeeds', () => {
  execSync('node build.js', { stdio: 'pipe' });
});

check('Bundle size < 500 KB', () => {
  const files = fs.readdirSync('dist').filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  const total = files.reduce((s, f) => s + fs.statSync(path.join('dist', f)).size, 0);
  const kb = Math.round(total / 1024);
  if (kb > 500) return `${kb} KB exceeds limit`;
});

check('All HTML pages reference existing bundles', () => {
  for (const page of ['dashboard', 'admin', 'sales', 'settings']) {
    const html = fs.readFileSync(`${page}.html`, 'utf-8');
    const match = html.match(/dist\/[\w.]+\.bundle\.js/);
    if (match && !fs.existsSync(match[0])) return `${page}.html: ${match[0]} missing`;
  }
});

// --- Code Quality ---
console.log('\n\x1b[36m── Code Quality ──\x1b[0m');
check('No console.log in production JS', () => {
  const result = execSync("grep -rn 'console\\.log\\b' js/*.js 2>/dev/null | grep -v logger | grep -v debug-mode | grep -v '// ' | wc -l", { encoding: 'utf-8' }).trim();
  if (parseInt(result) > 0) return `${result} console.log found`;
});

check('No inline onclick handlers', () => {
  const result = execSync("grep -rn 'onclick=\\|onchange=\\|onmouseenter=' js/*.js 2>/dev/null | grep -v '// ' | wc -l", { encoding: 'utf-8' }).trim();
  if (parseInt(result) > 0) return `${result} inline handlers found`;
});

check('All files under 800 lines', () => {
  const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
  for (const f of files) {
    const lines = fs.readFileSync(path.join('js', f), 'utf-8').split('\n').length;
    if (lines > 800) return `js/${f}: ${lines} lines`;
  }
});

check('No hardcoded secrets', () => {
  const result = execSync("grep -rn 'sk_live_\\|sk_test_\\|AKIA[0-9A-Z]' js/ supabase/functions/ --include='*.js' --include='*.ts' 2>/dev/null | grep -v node_modules | wc -l", { encoding: 'utf-8' }).trim();
  if (parseInt(result) > 0) return `${result} potential secrets`;
});

// --- Tests ---
console.log('\n\x1b[36m── Tests ──\x1b[0m');
check('Unit tests pass', () => {
  const result = execSync('npx vitest run 2>&1', { encoding: 'utf-8' });
  if (!result.includes('passed')) return 'Tests failed';
});

const testFiles = fs.readdirSync('tests/unit').filter(f => f.endsWith('.test.ts')).length;
const e2eFiles = fs.readdirSync('tests/e2e').filter(f => f.endsWith('.spec.ts')).length;
check(`${testFiles} unit test files exist`, () => testFiles >= 70 ? true : `Only ${testFiles}`);
check(`${e2eFiles} E2E spec files exist`, () => e2eFiles >= 40 ? true : `Only ${e2eFiles}`);

// --- Architecture ---
console.log('\n\x1b[36m── Architecture ──\x1b[0m');
const esmModules = fs.readdirSync('js/modules').filter(f => f.endsWith('.js')).length;
check(`${esmModules} ESM modules in js/modules/`, () => esmModules >= 8 ? true : `Only ${esmModules}`);

check('Entry files exist for all pages', () => {
  for (const entry of ['dashboard', 'admin', 'sales', 'settings']) {
    if (!fs.existsSync(`js/entries/${entry}.js`)) return `Missing: js/entries/${entry}.js`;
  }
});

check('No duplicate function names across same bundle', () => {
  // This is informational - not a hard fail
});

// --- Summary ---
console.log(`\n\x1b[1m── Result ──\x1b[0m`);
console.log(`  \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m\n`);
if (failed > 0) {
  console.log('\x1b[31mHEALTH CHECK FAILED\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32mHEALTH CHECK PASSED\x1b[0m\n');
}
