#!/usr/bin/env node
// ==========================================
// Call Lana Build Script — esbuild bundler with code splitting
// Usage: node build.js [--watch]
//
// Bundles ES Module entrypoints with shared chunks.
// Shared code (db modules, utils, auth) is extracted into chunk files
// that are loaded once and shared across pages.
// ==========================================

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const pages = ['dashboard', 'admin', 'sales', 'settings'];
const entryPoints = pages
  .map(p => `js/entries/${p}.js`)
  .filter(f => fs.existsSync(f));

// Create dist directory
if (!fs.existsSync('dist')) fs.mkdirSync('dist');

async function build() {
  const startTime = Date.now();

  // Clean old chunks (keep source maps for debugging)
  const oldFiles = fs.readdirSync('dist').filter(f => f.endsWith('.js') || f.endsWith('.js.map'));
  oldFiles.forEach(f => fs.unlinkSync(path.join('dist', f)));

  await esbuild.build({
    entryPoints,
    bundle: true,
    splitting: true,       // Extract shared code into chunk files
    format: 'esm',         // Required for splitting
    minify: true,
    sourcemap: true,
    outdir: 'dist',
    target: ['es2020'],
    charset: 'utf8',
    entryNames: '[name].bundle',
    chunkNames: 'chunk-[hash]',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  // Report sizes
  let totalSize = 0;
  const distFiles = fs.readdirSync('dist').filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  const bundles = distFiles.filter(f => f.includes('.bundle.'));
  const chunks = distFiles.filter(f => f.startsWith('chunk-'));

  for (const f of bundles) {
    const size = fs.statSync(path.join('dist', f)).size;
    totalSize += size;
    console.log(`  ✓ dist/${f} (${(size / 1024).toFixed(1)} KB)`);
  }

  let chunkTotal = 0;
  for (const f of chunks) {
    chunkTotal += fs.statSync(path.join('dist', f)).size;
  }
  if (chunks.length > 0) {
    console.log(`  ✓ ${chunks.length} shared chunks (${(chunkTotal / 1024).toFixed(1)} KB)`);
    totalSize += chunkTotal;
  }

  console.log(`\n  Total: ${(totalSize / 1024).toFixed(1)} KB in ${Date.now() - startTime}ms`);
}

function writeManifest() {
  const distFiles = fs.readdirSync('dist').filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  const manifest = { buildTime: Date.now(), version: Date.now().toString(36), files: {} };

  for (const f of distFiles) {
    manifest.files[f] = fs.statSync(path.join('dist', f)).size;
  }

  fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
  return manifest.version;
}

console.log('Building Call Lana bundles...\n');
build().then(() => {
  const v = writeManifest();
  console.log(`\n  Done! (version: ${v})`);
  if (isWatch) {
    console.log('  Watching for changes...');
    fs.watch('js', { recursive: true }, () => {
      console.log('\n  Rebuilding...');
      build().catch(console.error);
    });
  }
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
