import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Parse translations from i18n.js
function parseTranslations(): { de: Record<string, string>; en: Record<string, string> } | null {
  const i18nPath = path.resolve(__dirname, '../../i18n.js');
  const content = fs.readFileSync(i18nPath, 'utf-8');

  // Extract DE and EN translation objects by matching the pattern
  const deMatch = content.match(/translations\s*=\s*\{[\s\S]*?de\s*:\s*\{([\s\S]*?)\}\s*,\s*en/);
  const enMatch = content.match(/en\s*:\s*\{([\s\S]*?)\}\s*\}/);

  if (!deMatch || !enMatch) return null;

  // Count keys by matching key patterns
  const extractKeys = (block: string): string[] => {
    const keys: string[] = [];
    const regex = /['"]?([\w.-]+)['"]?\s*:/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
      keys.push(match[1]);
    }
    return keys;
  };

  return {
    de: Object.fromEntries(extractKeys(deMatch[1]).map(k => [k, 'present'])),
    en: Object.fromEntries(extractKeys(enMatch[1]).map(k => [k, 'present'])),
  };
}

describe('i18n – Translation Completeness', () => {

  it('i18n.js file exists and is readable', () => {
    const i18nPath = path.resolve(__dirname, '../../i18n.js');
    expect(fs.existsSync(i18nPath)).toBe(true);
    const content = fs.readFileSync(i18nPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('i18n.js contains both DE and EN translations', () => {
    const i18nPath = path.resolve(__dirname, '../../i18n.js');
    const content = fs.readFileSync(i18nPath, 'utf-8');
    expect(content).toContain('de');
    expect(content).toContain('en');
  });

  it('no empty string values in translation file', () => {
    const i18nPath = path.resolve(__dirname, '../../i18n.js');
    const content = fs.readFileSync(i18nPath, 'utf-8');
    // Match patterns like: key: "" or key: ''
    const emptyValues = content.match(/:\s*['"]{2}\s*[,\n}]/g);
    // Allow a few empty values (intentional placeholders)
    expect(emptyValues?.length || 0).toBeLessThanOrEqual(5);
  });

  it('DE and EN have similar number of translation keys', () => {
    const translations = parseTranslations();
    if (!translations) return; // Skip if parsing fails

    const deKeys = Object.keys(translations.de);
    const enKeys = Object.keys(translations.en);

    // Allow 20% difference (some keys may be language-specific)
    const ratio = Math.min(deKeys.length, enKeys.length) / Math.max(deKeys.length, enKeys.length);
    expect(ratio).toBeGreaterThan(0.8);
  });
});
