// Post-bundle init for dashboard.html — extracted from inline script for CSP compliance
document.addEventListener('DOMContentLoaded', function() {
  if (typeof KeyboardShortcuts !== 'undefined') KeyboardShortcuts.init({});
  if (document.getElementById('chart-calls-7days') && typeof DashboardCharts !== 'undefined') {
    setTimeout(function() { DashboardCharts.init(); }, 500);
  }
});

// Lazy-load jsPDF + invoice-pdf only when invoice tab is opened
(function() {
  var loaded = false;
  function loadJsPdf() {
    if (loaded) return;
    loaded = true;
    var s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
    s1.onload = function() {
      var s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
      s2.onload = function() {
        var s3 = document.createElement('script');
        s3.src = 'js/invoice-pdf.js';
        document.head.appendChild(s3);
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }
  document.addEventListener('click', function(e) {
    var t = e.target.closest('[data-tab="invoices"], .invoice-pdf-btn, [data-action*="pdf"]');
    if (t) loadJsPdf();
  });
  if (location.hash === '#invoices') loadJsPdf();
})();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
