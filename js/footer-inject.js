// Lightweight footer injection for static pages (legal, 404)
// No dependencies — replaces inline footer duplication
(function() {
  var footer = document.querySelector('footer');
  if (!footer || footer.dataset.injected) return;
  footer.dataset.injected = '1';
  footer.innerHTML =
    '<div class="footer-grid">' +
      '<div class="footer-brand"><a href="index.html" class="logo"><picture><source srcset="logo-footer.webp" type="image/webp"><img src="logo-footer.png" alt="Call Lana" height="28"></picture></a><p>Der KI-Telefonassistent auf Deutsch. DSGVO-konform, skalierbar, sofort einsatzbereit.</p></div>' +
      '<div class="footer-col"><h4>Produkt</h4><ul><li><a href="funktionen.html">Funktionen</a></li><li><a href="branchen.html">Branchen</a></li><li><a href="preise.html">Preise</a></li></ul></div>' +
      '<div class="footer-col"><h4>Rechtliches</h4><ul><li><a href="impressum.html">Impressum</a></li><li><a href="datenschutz.html">Datenschutz</a></li><li><a href="agb.html">AGB</a></li><li><a href="avv.html">AVV</a></li></ul></div>' +
      '<div class="footer-col"><h4>Konto</h4><ul><li><a href="registrierung.html">Registrieren</a></li><li><a href="login.html">Login</a></li><li><a href="dashboard.html">Dashboard</a></li></ul></div>' +
    '</div>' +
    '<div class="footer-bottom"><p class="footer-copy">\u00a9 2025\u20132026 Call Lana \u2014 Alle Rechte vorbehalten</p></div>';
})();
