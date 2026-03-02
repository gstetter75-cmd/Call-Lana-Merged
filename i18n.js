// ==========================================
// Call Lana i18n (Internationalization)
// ==========================================
// Einfaches Multi-Language System ohne Frameworks

const translations = {
  de: {
    // Navigation
    'nav.home': 'Start',
    'nav.features': 'Funktionen',
    'nav.industries': 'Branchen',
    'nav.pricing': 'Preise',
    'nav.contact': 'Kontakt',
    'nav.dashboard': 'Zum Dashboard',
    
    // Hero
    'hero.badge': 'KI-Power aus Deutschland',
    'hero.title': 'Nie wieder verpasste Anrufe',
    'hero.subtitle': 'Dein KI-Assistent auf Deutsch',
    'hero.lead': 'Call Lana übernimmt deine Anrufe rund um die Uhr – auf Deutsch, DSGVO-konform und sofort einsatzbereit. In 30 Minuten live.',
    'hero.cta.primary': 'Zum Dashboard →',
    'hero.cta.secondary': 'Alle Funktionen',
    
    // Trusted Companies
    'trusted.title': 'Vertraut von führenden Unternehmen',
    
    // Stats
    'stats.calls': 'Bearbeitete Anrufe',
    'stats.response': 'Durchschn. Reaktionszeit',
    'stats.uptime': 'Verfügbarkeit',
    
    // Demo
    'demo.title': 'Demo sofort testen',
    'demo.subtitle': 'Ruf unsere Demo-Nummer an und erlebe Call Lana live:',
    'demo.button': 'Kopieren',
    'demo.copied': '✓ Nummer kopiert! Jetzt anrufen.',
    'demo.legal': 'Kostenlos • Keine Registrierung nötig • Sofort verfügbar',
    
    // Features
    'feature.quick.title': 'In 30 Minuten live',
    'feature.quick.desc': 'Keine Programmierung, kein IT-Wissen. Einfach Nummer einrichten und starten.',
    'feature.gdpr.title': '100% DSGVO-konform',
    'feature.gdpr.desc': 'Server in Deutschland. Volle Datenkontrolle. Zertifiziert nach höchsten Standards.',
    'feature.pricing.title': 'Ab 0€ starten',
    'feature.pricing.desc': 'Keine Setup-Gebühr. Transparent. Fair. Jederzeit kündbar.',
    
    // Footer
    'footer.product': 'Produkt',
    'footer.legal': 'Rechtliches',
    'footer.account': 'Konto',
    'footer.copyright': 'Copyright 2026 by Call Lana – Alle Rechte vorbehalten',
    'footer.tagline': 'Der KI-Telefonassistent auf Deutsch. DSGVO-konform, skalierbar, sofort einsatzbereit.',
    
    // Login
    'login.title': 'Willkommen zurück',
    'login.subtitle': 'Noch kein Konto?',
    'login.register': 'Jetzt kostenlos registrieren →',
    'login.email': 'E-Mail-Adresse',
    'login.password': 'Passwort',
    'login.remember': 'Angemeldet bleiben',
    'login.forgot': 'Passwort vergessen?',
    'login.button': 'Zum Dashboard →',
    'login.loading': 'Anmeldung läuft...',
    
    // Trust badges
    'trust.ssl': '256-Bit SSL',
    'trust.gdpr': 'DSGVO',
    
    // Dashboard
    'dashboard.logout': 'Abmelden',
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.industries': 'Industries',
    'nav.pricing': 'Pricing',
    'nav.contact': 'Contact',
    'nav.dashboard': 'To Dashboard',
    
    // Hero
    'hero.badge': 'AI-Powered from Germany',
    'hero.title': 'Never miss another call',
    'hero.subtitle': 'Your AI Assistant in German',
    'hero.lead': 'Call Lana handles your calls 24/7 – in German, GDPR-compliant and ready immediately. Live in 30 minutes.',
    'hero.cta.primary': 'To Dashboard →',
    'hero.cta.secondary': 'All Features',
    
    // Trusted Companies
    'trusted.title': 'Trusted by leading companies',
    
    // Stats
    'stats.calls': 'Processed Calls',
    'stats.response': 'Avg. Response Time',
    'stats.uptime': 'Availability',
    
    // Demo
    'demo.title': 'Test Demo Now',
    'demo.subtitle': 'Call our demo number and experience Call Lana live:',
    'demo.button': 'Copy',
    'demo.copied': '✓ Number copied! Call now.',
    'demo.legal': 'Free • No registration • Available immediately',
    
    // Features
    'feature.quick.title': 'Live in 30 minutes',
    'feature.quick.desc': 'No programming, no IT knowledge. Just set up and start.',
    'feature.gdpr.title': '100% GDPR-compliant',
    'feature.gdpr.desc': 'Servers in Germany. Full data control. Highest standards.',
    'feature.pricing.title': 'Start from €0',
    'feature.pricing.desc': 'No setup fee. Transparent. Fair. Cancel anytime.',
    
    // Footer
    'footer.product': 'Product',
    'footer.legal': 'Legal',
    'footer.account': 'Account',
    'footer.copyright': 'Copyright 2026 by Call Lana – All rights reserved',
    'footer.tagline': 'AI phone assistant in German. GDPR-compliant, scalable, ready to use.',
    
    // Login
    'login.title': 'Welcome back',
    'login.subtitle': "Don't have an account?",
    'login.register': 'Register for free →',
    'login.email': 'Email address',
    'login.password': 'Password',
    'login.remember': 'Stay logged in',
    'login.forgot': 'Forgot password?',
    'login.button': 'To Dashboard →',
    'login.loading': 'Logging in...',
    
    // Trust badges
    'trust.ssl': '256-Bit SSL',
    'trust.gdpr': 'GDPR',
    
    // Dashboard
    'dashboard.logout': 'Logout',
  }
};

// ==========================================
// Simple i18n Class
// ==========================================
class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('calllana_language') || 'de';
    document.documentElement.lang = this.currentLang;
  }
  
  setLanguage(lang) {
    if (!translations[lang]) lang = 'de';
    this.currentLang = lang;
    localStorage.setItem('calllana_language', lang);
    document.documentElement.lang = lang;
    this.translatePage();
  }
  
  t(key) {
    return translations[this.currentLang]?.[key] || translations['de']?.[key] || key;
  }
  
  translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.innerHTML = this.t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });
  }
}

const i18n = new I18n();

document.addEventListener('DOMContentLoaded', () => {
  i18n.translatePage();
});

window.i18n = i18n;
