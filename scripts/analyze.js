#!/usr/bin/env node
// ==========================================
// Project Analysis: Bundle, Code, Test metrics
// Run: node scripts/analyze.js
// ==========================================

const fs = require('fs');
const path = require('path');

function getFileSize(dir, filter) {
  const files = fs.readdirSync(dir).filter(filter);
  return files.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
}

function countLines(dir, ext) {
  let total = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(ext))) {
    total += fs.readFileSync(path.join(dir, f), 'utf-8').split('\n').length;
  }
  return total;
}

console.log('\n\x1b[1m📊 Call Lana Project Analysis\x1b[0m\n');

// Bundle analysis
const jsSize = getFileSize('dist', f => f.endsWith('.js') && !f.endsWith('.map'));
const mapSize = getFileSize('dist', f => f.endsWith('.map'));
const jsFiles = fs.readdirSync('dist').filter(f => f.endsWith('.js') && !f.endsWith('.map'));
const bundles = jsFiles.filter(f => f.includes('.bundle.'));
const chunks = jsFiles.filter(f => f.includes('chunk-'));

console.log('\x1b[36m── Bundles ──\x1b[0m');
for (const b of bundles.sort()) {
  const size = fs.statSync(path.join('dist', b)).size;
  console.log(`  ${b.padEnd(30)} ${(size/1024).toFixed(1)} KB`);
}
console.log(`  ${'Shared chunks (' + chunks.length + ')'.padEnd(30)} ${(chunks.reduce((s,f) => s + fs.statSync(path.join('dist',f)).size, 0)/1024).toFixed(1)} KB`);
console.log(`  ${'─'.repeat(45)}`);
console.log(`  ${'Total JS'.padEnd(30)} ${(jsSize/1024).toFixed(1)} KB`);
console.log(`  ${'Source maps'.padEnd(30)} ${(mapSize/1024).toFixed(1)} KB`);

// Source code
const srcFiles = fs.readdirSync('js').filter(f => f.endsWith('.js'));
const srcLines = countLines('js', '.js');
const moduleFiles = fs.readdirSync('js/modules').filter(f => f.endsWith('.js'));

console.log('\n\x1b[36m── Source Code ──\x1b[0m');
console.log(`  ${'JS files'.padEnd(30)} ${srcFiles.length}`);
console.log(`  ${'ESM modules'.padEnd(30)} ${moduleFiles.length}`);
console.log(`  ${'Total lines'.padEnd(30)} ${srcLines.toLocaleString('de-DE')}`);
console.log(`  ${'Avg lines/file'.padEnd(30)} ${Math.round(srcLines / srcFiles.length)}`);

const largest = srcFiles.map(f => ({
  name: f,
  lines: fs.readFileSync(path.join('js', f), 'utf-8').split('\n').length
})).sort((a,b) => b.lines - a.lines).slice(0, 5);
console.log(`  ${'Largest files:'.padEnd(30)}`);
for (const f of largest) {
  console.log(`    ${f.name.padEnd(28)} ${f.lines} lines`);
}

// Tests
const unitFiles = fs.readdirSync('tests/unit').filter(f => f.endsWith('.test.ts'));
const e2eFiles = fs.readdirSync('tests/e2e').filter(f => f.endsWith('.spec.ts'));
const unitLines = countLines('tests/unit', '.test.ts');
const e2eLines = countLines('tests/e2e', '.spec.ts');

console.log('\n\x1b[36m── Tests ──\x1b[0m');
console.log(`  ${'Unit test files'.padEnd(30)} ${unitFiles.length}`);
console.log(`  ${'E2E spec files'.padEnd(30)} ${e2eFiles.length}`);
console.log(`  ${'Unit test lines'.padEnd(30)} ${unitLines.toLocaleString('de-DE')}`);
console.log(`  ${'E2E test lines'.padEnd(30)} ${e2eLines.toLocaleString('de-DE')}`);
console.log(`  ${'Test/Source ratio'.padEnd(30)} ${((unitLines + e2eLines) / srcLines).toFixed(1)}x`);

// SQL
const sqlFiles = fs.readdirSync('sql').filter(f => f.endsWith('.sql'));
console.log('\n\x1b[36m── Database ──\x1b[0m');
console.log(`  ${'SQL migrations'.padEnd(30)} ${sqlFiles.length}`);

// Git
const { execSync } = require('child_process');
const commits = execSync('git log --oneline | wc -l', { encoding: 'utf-8' }).trim();
const contributors = execSync('git log --format="%aN" | sort -u | wc -l', { encoding: 'utf-8' }).trim();

console.log('\n\x1b[36m── Git ──\x1b[0m');
console.log(`  ${'Commits'.padEnd(30)} ${commits}`);
console.log(`  ${'Contributors'.padEnd(30)} ${contributors}`);

// Window exports count
const windowExports = srcFiles.reduce((s, f) => {
  const code = fs.readFileSync(path.join('js', f), 'utf-8');
  return s + (code.match(/window\.\w+ = \w+;/g) || []).length;
}, 0);
console.log('\n\x1b[36m── Architecture ──\x1b[0m');
console.log(`  ${'window.* exports'.padEnd(30)} ${windowExports}`);
console.log(`  ${'ESM modules'.padEnd(30)} ${moduleFiles.length}`);

console.log('');
