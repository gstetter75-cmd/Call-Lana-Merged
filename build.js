#!/usr/bin/env node
// ==========================================
// Call Lana Build Script — esbuild bundler
// Usage: node build.js [--watch]
//
// Bundles ES Module entrypoints from js/entries/*.js into dist/*.bundle.js.
// esbuild resolves all imports, tree-shakes unused code, and minifies.
// ==========================================

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const pages = ['dashboard', 'admin', 'sales', 'settings'];

// Create dist directory
if (!fs.existsSync('dist')) fs.mkdirSync('dist');

async function build() {
  const startTime = Date.now();
  let totalSize = 0;

  for (const page of pages) {
    const entryPoint = `js/entries/${page}.js`;
    const outfile = `dist/${page}.bundle.js`;

    if (!fs.existsSync(entryPoint)) {
      console.warn(`  ⚠ Skipping missing entrypoint: ${entryPoint}`);
      continue;
    }

    try {
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile,
        target: ['es2020'],
        format: 'iife',  // Wrap in IIFE for browser compat (no module loader needed)
        charset: 'utf8',
        // Supabase is loaded from CDN, mark as external
        external: [],
        // Define for dead code elimination
        define: {
          'process.env.NODE_ENV': '"production"',
        },
      });

      const size = fs.statSync(outfile).size;
      totalSize += size;
      console.log(`  ✓ ${outfile} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ ${outfile} failed:`, err.message);
    }
  }

  console.log(`\n  Total: ${(totalSize / 1024).toFixed(1)} KB in ${Date.now() - startTime}ms`);
}

console.log('Building Call Lana bundles...\n');
build().then(() => {
  console.log('\n  Done! Bundles are in dist/');
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
