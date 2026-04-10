import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve(__dirname, '../../dist');

function fileSize(filename: string): number {
  return fs.statSync(path.join(distDir, filename)).size;
}

function getAllDistJs(): string[] {
  return fs.readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
}

describe('Bundle Size Audit', () => {

  it('dashboard bundle is under 150 KB', () => {
    const size = fileSize('dashboard.bundle.js');
    expect(size).toBeLessThan(150 * 1024);
  });

  it('admin bundle is under 150 KB', () => {
    const size = fileSize('admin.bundle.js');
    expect(size).toBeLessThan(150 * 1024);
  });

  it('sales bundle is under 100 KB', () => {
    const size = fileSize('sales.bundle.js');
    expect(size).toBeLessThan(100 * 1024);
  });

  it('settings bundle is under 80 KB', () => {
    const size = fileSize('settings.bundle.js');
    expect(size).toBeLessThan(80 * 1024);
  });

  it('shared chunks exist', () => {
    const chunks = getAllDistJs().filter(f => f.startsWith('chunk-'));
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it('total bundle size is under 500 KB', () => {
    const allJs = getAllDistJs();
    const totalSize = allJs.reduce((sum, f) => sum + fileSize(f), 0);
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  it('manifest.json exists', () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
  });
});
