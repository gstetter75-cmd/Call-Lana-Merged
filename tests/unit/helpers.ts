import fs from 'fs';
import path from 'path';

// Load a browser JS file by wrapping declarations to assign to window
export function loadBrowserScript(relativePath: string): void {
  const code = fs.readFileSync(path.resolve(__dirname, '../../', relativePath), 'utf-8');
  // Strip ES module import/export statements (not supported in new Function())
  let patched = code.replace(/^import\s+.*?['"];?\s*$/gm, '// [import stripped]');
  patched = patched.replace(/^export\s+(default\s+)?/gm, '');
  // Replace top-level var/const/let declarations with window assignments
  patched = patched.replace(/^(var|const|let)\s+(\w+)\s*=/gm, 'window.$2 =');
  // Replace top-level function declarations: keep local var + assign to window
  // e.g. "function foo(" → "var foo = window.foo = function("
  patched = patched.replace(/^function\s+(\w+)\s*\(/gm, 'var $1 = window.$1 = function(');
  // Same for async function declarations
  patched = patched.replace(/^async\s+function\s+(\w+)\s*\(/gm, 'var $1 = window.$1 = async function(');
  // Execute with window globals available — also pass location for hostname checks
  const fn = new Function('window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location', patched);
  fn(window, document, window.localStorage, window.sessionStorage, window.navigator, window.location);
}
