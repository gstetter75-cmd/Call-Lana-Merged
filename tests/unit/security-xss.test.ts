import { describe, it, expect } from 'vitest';

// Mirror sanitization logic from js/modules/utils.js
// sanitizeHtml uses DOM textContent approach (escapes all HTML)
function sanitizeHtml(str: any): string {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// sanitizeAttr manually replaces dangerous characters
function sanitizeAttr(str: any): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;');
}

describe('XSS Prevention – sanitizeHtml', () => {

  it('escapes <script> tags', () => {
    const result = sanitizeHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes onclick attributes in HTML', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">test</div>');
    expect(result).not.toContain('<div');
    expect(result).toContain('&lt;div');
  });

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('escapes img onerror payloads', () => {
    const result = sanitizeHtml('<img src=x onerror="alert(1)">');
    expect(result).not.toContain('<img');
  });

  it('escapes SVG XSS payloads', () => {
    const result = sanitizeHtml('<svg onload="alert(1)">');
    expect(result).not.toContain('<svg');
  });

  it('preserves safe text content', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
    expect(sanitizeHtml('Preis: 149€')).toBe('Preis: 149€');
  });
});

describe('XSS Prevention – sanitizeAttr', () => {

  it('escapes double quotes', () => {
    const result = sanitizeAttr('" onmouseover="alert(1)');
    expect(result).not.toContain('"');
    expect(result).toContain('&quot;');
  });

  it('escapes angle brackets', () => {
    const result = sanitizeAttr('<script>alert(1)</script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('escapes single quotes', () => {
    const result = sanitizeAttr("' onmouseover='alert(1)");
    expect(result).toContain('&#39;');
  });

  it('escapes backslashes', () => {
    const result = sanitizeAttr('\\"><script>');
    expect(result).toContain('&#92;');
  });

  it('handles null/undefined', () => {
    expect(sanitizeAttr(null)).toBe('');
    expect(sanitizeAttr(undefined)).toBe('');
  });

  it('preserves safe attribute values', () => {
    expect(sanitizeAttr('user-123')).toBe('user-123');
    expect(sanitizeAttr('simple text')).toBe('simple text');
  });
});
