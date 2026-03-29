#!/usr/bin/env node
// Generate test report from unit + e2e test output
const fs = require('fs');
const { execSync } = require('child_process');

const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

let unitOutput = '', e2eOutput = '';
try { unitOutput = fs.readFileSync('test-output-unit.txt', 'utf-8'); } catch {}
try { e2eOutput = fs.readFileSync('test-output-e2e.txt', 'utf-8'); } catch {}

// Parse unit test results
const unitMatch = unitOutput.match(/(\d+) passed/);
const unitFail = unitOutput.match(/(\d+) failed/);
const unitPass = unitMatch ? parseInt(unitMatch[1]) : 0;
const unitFailed = unitFail ? parseInt(unitFail[1]) : 0;

// Parse e2e test results
const e2eMatch = e2eOutput.match(/(\d+) passed/);
const e2eFail = e2eOutput.match(/(\d+) failed/);
const e2eSkip = e2eOutput.match(/(\d+) skipped/);
const e2ePass = e2eMatch ? parseInt(e2eMatch[1]) : 0;
const e2eFailed = e2eFail ? parseInt(e2eFail[1]) : 0;
const e2eSkipped = e2eSkip ? parseInt(e2eSkip[1]) : 0;

const totalPass = unitPass + e2ePass;
const totalFail = unitFailed + e2eFailed;
const status = totalFail === 0 ? 'GRUEN' : 'ROT';

// Extract failed test names (lines with ✘ or containing "failed" marker)
const failedTests = [];
for (const line of e2eOutput.split('\n')) {
  // Playwright marks failures with specific patterns
  if (/^\s+\d+\)\s+\[chromium\]/.test(line) || /✘|FAILED|Error:/.test(line)) {
    const cleaned = line.trim().replace(/^\d+\)\s*/, '');
    if (cleaned.length > 5 && !failedTests.includes(cleaned)) {
      failedTests.push(cleaned);
    }
  }
}

const report = `# Call Lana — Test Report
**Datum:** ${now}
**Branch:** ${branch}
**Commit:** ${commit}

## Zusammenfassung

| Kategorie | Bestanden | Fehlgeschlagen | Übersprungen | Gesamt |
|-----------|-----------|----------------|--------------|--------|
| Unit      | ${unitPass} | ${unitFailed} | 0 | ${unitPass + unitFailed} |
| E2E       | ${e2ePass} | ${e2eFailed} | ${e2eSkipped} | ${e2ePass + e2eFailed + e2eSkipped} |
| **Total** | **${totalPass}** | **${totalFail}** | **${e2eSkipped}** | **${totalPass + totalFail + e2eSkipped}** |

## Status: ${status} ${totalFail === 0 ? '✅' : '❌'}

${failedTests.length > 0 ? `## Fehlgeschlagene Tests
${failedTests.map(t => `- ${t}`).join('\n')}` : 'Alle Tests bestanden!'}
`;

fs.writeFileSync('test-report.md', report);
console.log(report);
console.log('Report gespeichert: test-report.md');
