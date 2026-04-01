import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: ['js/**/*.js'],
      exclude: ['js/homepage.js', 'js/ab-testing.js', 'js/footer-inject.js'],
    },
  },
});
