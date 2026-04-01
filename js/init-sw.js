// Service worker registration — extracted from inline script for CSP compliance
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
