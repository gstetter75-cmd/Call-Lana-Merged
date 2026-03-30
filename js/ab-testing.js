// Simple A/B testing framework — no external dependencies.
// Persists variant assignments in localStorage.
// Tracks exposure events to Supabase audit_logs.

(function initAbTesting() {
  'use strict';

  const STORAGE_KEY = 'ab_tests';
  const tracked = new Set();

  function getAssignments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveAssignments(assignments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // localStorage may be full or disabled
    }
  }

  function pickVariant(variants) {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  function getUserId() {
    try {
      const stored = JSON.parse(localStorage.getItem('sb-fgwtptriileytmmotevs-auth-token') || 'null');
      return stored?.user?.id || null;
    } catch {
      return null;
    }
  }

  function trackExposure(testName, variant) {
    const trackingKey = testName + ':' + variant;
    if (tracked.has(trackingKey)) return;
    tracked.add(trackingKey);

    try {
      if (typeof supabaseClient === 'undefined') return;
      supabaseClient.from('audit_logs').insert({
        action: 'ab_test_exposure',
        entity_type: 'ab_test',
        entity_id: null,
        changes: {
          test_name: testName,
          variant: variant,
          page: location.href,
          user_id: getUserId(),
          timestamp: new Date().toISOString(),
        },
      }).then(() => {});
    } catch {
      // Silently fail — tracking must not break the page
    }
  }

  /**
   * Assigns and returns a variant for the given test.
   * The assignment is persistent per browser (localStorage).
   *
   * @param {string} testName - Unique test identifier
   * @param {string[]} variants - Array of variant names, e.g. ['A', 'B']
   * @returns {string} The assigned variant
   */
  function abTest(testName, variants) {
    if (!testName || !Array.isArray(variants) || variants.length === 0) {
      throw new Error('abTest requires a testName and a non-empty variants array');
    }

    const assignments = getAssignments();

    if (!(testName in assignments) || !variants.includes(assignments[testName])) {
      assignments[testName] = pickVariant(variants);
      saveAssignments(assignments);
    }

    const variant = assignments[testName];
    trackExposure(testName, variant);
    return variant;
  }

  // Expose globally
  window.abTest = abTest;
})();
