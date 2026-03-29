# Call Lana — Test Report
**Datum:** 2026-03-29 19:30
**Branch:** main
**Commit:** fa89d7d

## Zusammenfassung

| Kategorie | Bestanden | Fehlgeschlagen | Übersprungen | Gesamt |
|-----------|-----------|----------------|--------------|--------|
| Unit      | 5 | 0 | 0 | 5 |
| E2E       | 167 | 18 | 1 | 186 |
| **Total** | **172** | **18** | **1** | **191** |

## Status: ROT ❌

## Fehlgeschlagene Tests
- ✘   87 [chromium] › tests/e2e/public-pages.spec.ts:41:7 › Public Pages › branchen page loads with content (6.1m)
- ✘   97 [chromium] › tests/e2e/quality-checks.spec.ts:8:7 › Quality Checks › homepage has no console errors (3.6s)
- ✘  105 [chromium] › tests/e2e/quality-checks.spec.ts:58:7 › Quality Checks › no horizontal scroll on mobile homepage (2.2s)
- ✘  111 [chromium] › tests/e2e/quality-checks.spec.ts:134:11 › Authenticated Quality Checks › admin page has no console errors (1.0m)
- ✘  113 [chromium] › tests/e2e/rbac.spec.ts:22:7 › Role-Based Access Control › customer is redirected away from sales.html (2.6m)
- ✘  127 [chromium] › tests/e2e/registration.spec.ts:18:7 › Registration Flow › password mismatch shows error (51.1s)
- ✘  136 [chromium] › tests/e2e/responsive.spec.ts:42:7 › Responsive & Mobile › dashboard sidebar collapses on mobile (1.6m)
- ✘  146 [chromium] › tests/e2e/sales.spec.ts:26:7 › Sales CRM › pipeline shows kanban board (1.5m)
- ✘  156 [chromium] › tests/e2e/seo-pwa.spec.ts:12:9 › SEO & PWA › /preise.html has meta description (8.0m)
- ✘  162 [chromium] › tests/e2e/seo-pwa.spec.ts:12:9 › SEO & PWA › /agb.html has meta description (46.0s)
- ✘  171 [chromium] › tests/e2e/seo-pwa.spec.ts:85:7 › SEO & PWA › protected pages have noindex (3.6m)
- ✘  173 [chromium] › tests/e2e/settings.spec.ts:5:7 › Settings › settings page loads with profile tab (1.4h)
- ✘  174 [chromium] › tests/e2e/settings.spec.ts:13:7 › Settings › profile tab has save button (15.7s)
- ✘  175 [chromium] › tests/e2e/settings.spec.ts:20:7 › Settings › security tab has password fields (7.4m)
- ✘  176 [chromium] › tests/e2e/settings.spec.ts:28:7 › Settings › notifications tab has toggle switches (1.0h)
- ✘  177 [chromium] › tests/e2e/settings.spec.ts:37:7 › Settings › emergency tab has phone field (15.6s)
- ✘  184 [chromium] › tests/e2e/theme-shortcuts.spec.ts:24:7 › Theme & Shortcuts › global search opens with keyboard shortcut or button (11.4s)
- ✘  185 [chromium] › tests/e2e/theme-shortcuts.spec.ts:38:7 › Theme & Shortcuts › global search filters results when typing (30.1s)
- [chromium] › tests/e2e/public-pages.spec.ts:41:7 › Public Pages › branchen page loads with content
- Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
- [chromium] › tests/e2e/quality-checks.spec.ts:8:7 › Quality Checks › homepage has no console errors
- Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoHaveLength[2m([22m[32mexpected[39m[2m)[22m
- [chromium] › tests/e2e/quality-checks.spec.ts:58:7 › Quality Checks › no horizontal scroll on mobile homepage
- Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m
- [chromium] › tests/e2e/quality-checks.spec.ts:134:11 › Authenticated Quality Checks › admin page has no console errors
- Error: page.click: Test ended.
- [chromium] › tests/e2e/rbac.spec.ts:22:7 › Role-Based Access Control › customer is redirected away from sales.html
- Error: page.waitForURL: Test ended.
- [chromium] › tests/e2e/registration.spec.ts:18:7 › Registration Flow › password mismatch shows error
- Error: browserContext.close: Test ended.
- [pid=75484][err] [0329/183732.797773:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183736.753914:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183740.420079:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183743.912629:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183747.702903:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183751.148192:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183754.806562:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183758.391250:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183803.029727:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183807.612227:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183807.733351:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183813.539396:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183813.664167:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183825.099612:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183825.263627:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183831.122780:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [pid=75484][err] [0329/183832.313304:INFO:CONSOLE:9] "[auth.getUser] AuthSessionMissingError: Auth session missing!", source: http://localhost:8080/js/logger.js (9)
- [chromium] › tests/e2e/responsive.spec.ts:42:7 › Responsive & Mobile › dashboard sidebar collapses on mobile
- Error: page.goto: Test ended.
- [chromium] › tests/e2e/sales.spec.ts:26:7 › Sales CRM › pipeline shows kanban board ───────────
- TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
- [chromium] › tests/e2e/seo-pwa.spec.ts:12:9 › SEO & PWA › /preise.html has meta description ───
- [chromium] › tests/e2e/seo-pwa.spec.ts:12:9 › SEO & PWA › /agb.html has meta description ─────
- Error: locator.getAttribute: Test timeout of 30000ms exceeded.
- [chromium] › tests/e2e/seo-pwa.spec.ts:85:7 › SEO & PWA › protected pages have noindex ───────
- [chromium] › tests/e2e/settings.spec.ts:5:7 › Settings › settings page loads with profile tab
- [chromium] › tests/e2e/settings.spec.ts:13:7 › Settings › profile tab has save button ────────
- [chromium] › tests/e2e/settings.spec.ts:20:7 › Settings › security tab has password fields ───
- [chromium] › tests/e2e/settings.spec.ts:28:7 › Settings › notifications tab has toggle switches
- [chromium] › tests/e2e/settings.spec.ts:37:7 › Settings › emergency tab has phone field ──────
- [chromium] › tests/e2e/theme-shortcuts.spec.ts:24:7 › Theme & Shortcuts › global search opens with keyboard shortcut or button
- Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- [chromium] › tests/e2e/theme-shortcuts.spec.ts:38:7 › Theme & Shortcuts › global search filters results when typing
- Error: locator.fill: Target page, context or browser has been closed
