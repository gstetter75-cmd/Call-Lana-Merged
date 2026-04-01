// Post-bundle init for settings.html — extracted from inline script for CSP compliance
(function() {
  var initialized = false;
  document.querySelectorAll('.sn-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (item.getAttribute('data-tab') === 'referral' && !initialized) {
        initialized = true;
        if (typeof Referral !== 'undefined') Referral.init();
      }
    });
  });
  if (window.location.hash === '#referral' && typeof Referral !== 'undefined') { initialized = true; Referral.init(); }
})();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
