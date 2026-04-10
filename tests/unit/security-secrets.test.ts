import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Recursively get all .js files in a directory
function getJsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...getJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Security – No Hardcoded Secrets', () => {
  const jsDir = path.resolve(__dirname, '../../js');
  const jsFiles = getJsFiles(jsDir);

  it('no Stripe secret keys (sk_live_, sk_test_) in js/ files', () => {
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/sk_live_[a-zA-Z0-9]{20,}/);
      expect(content).not.toMatch(/sk_test_[a-zA-Z0-9]{20,}/);
    }
  });

  it('no AWS access key patterns (AKIA) in js/ files', () => {
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    }
  });

  it('no hardcoded password assignments in js/ files', () => {
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Match: password = "...", password: "...", etc.
      expect(content).not.toMatch(/password\s*[:=]\s*['"][^'"]{8,}['"]/i);
    }
  });

  it('no private keys or tokens in js/ files', () => {
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/-----BEGIN (RSA |EC )?PRIVATE KEY-----/);
      expect(content).not.toMatch(/ghp_[a-zA-Z0-9]{36}/); // GitHub PAT
    }
  });
});
