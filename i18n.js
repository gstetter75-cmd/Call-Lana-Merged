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
    'hero.badge': 'Deine KI-Telefonagentin',
    'hero.title': 'Schluss mit nervigen Bandansagen',
    'hero.subtitle': 'Entdecke Lana, deine intelligente KI-Telefonagentin.',
    'hero.lead': 'Lana versteht deine Anrufer wirklich – dank NLP und natürlichem Dialog. Kein „Drücken Sie die 1" mehr. Einfach natürlich sprechen, rund um die Uhr, DSGVO-konform.',
    'hero.cta.primary': 'Jetzt kostenlos testen →',
    'hero.cta.secondary': 'Demo anhören',

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

    // Trust & DSGVO
    'trust.label': 'SICHERHEIT & DATENSCHUTZ',
    'trust.title': 'Deine Daten sind bei uns sicher',
    'trust.gdpr.title': 'DSGVO-konform',
    'trust.gdpr.desc': 'Server bei Hetzner in Nürnberg, Deutschland. Volle Datenkontrolle.',
    'trust.encrypt.title': 'Ende-zu-Ende verschlüsselt',
    'trust.encrypt.desc': '256-Bit SSL. Alle Gespräche und Daten sind vollständig verschlüsselt.',
    'trust.euai.title': 'EU AI Act konform',
    'trust.euai.desc': 'OpenAI nur über Microsoft Azure EU-Server. Keine Daten verlassen Europa.',

    // Use-Cases
    'usecases.label': 'EINSATZBEREICHE',
    'usecases.title': 'Lana passt sich deinem Business an',
    'usecases.service.title': 'Dienstleister & Praxen',
    'usecases.service.desc': 'Terminbuchung per Telefon, automatische Kalenderintegration via Cal.com. Kein Anruf geht verloren.',
    'usecases.ecommerce.title': 'E-Commerce & Support',
    'usecases.ecommerce.desc': '24/7 Kundenservice, FAQ-Beantwortung, Bestellstatus – alles automatisiert.',
    'usecases.sales.title': 'Agenturen & Vertrieb',
    'usecases.sales.desc': 'Lead-Qualifizierung am Telefon, automatischer CRM-Push. Mehr Abschlüsse, weniger Aufwand.',

    // Integrations
    'integrations.label': 'INTEGRATIONEN',
    'integrations.title': 'Verbindet sich nahtlos mit deinen Tools',
    'integrations.subtitle': 'Lana arbeitet mit den Tools, die du bereits nutzt.',
    'integrations.more': 'Und viele weitere über Zapier und Make.com',

    // Features / Teaser Cards
    'feature.quick.title': 'In 30 Minuten live',
    'feature.quick.desc': 'Keine Programmierung. Rufnummer einrichten, Lana konfigurieren, starten.',
    'feature.gdpr.title': '100% DSGVO-konform',
    'feature.gdpr.desc': 'Server in Deutschland. Volle Datenkontrolle. EU AI Act konform.',
    'feature.pricing.title': 'Ab 99€/Monat',
    'feature.pricing.desc': '1.000 Inklusivminuten. Transparent. Fair. Jederzeit kündbar.',

    // Pricing
    'pricing.label': 'Preise',
    'pricing.title': 'Transparent. Fair. Skalierbar.',
    'pricing.subtitle': 'Starte ab 99€/Monat und wachse mit Call Lana. Kein Kleingedrucktes, keine versteckten Gebühren.',
    'pricing.monthly': 'Monatlich',
    'pricing.yearly': 'Jährlich',
    'pricing.save': '2 Monate gratis',
    'pricing.popular': 'Beliebteste Wahl',
    'pricing.solo': 'Solo',
    'pricing.team': 'Team',
    'pricing.business': 'Business',
    'pricing.permonth': '/ Monat',
    'pricing.individual': 'Individuell',
    'pricing.onrequest': 'Preis auf Anfrage',
    'pricing.startnow': 'Jetzt starten',
    'pricing.bookdemo': 'Demo buchen',
    'pricing.compare.label': 'Vergleich',
    'pricing.compare.title': 'Alle Features auf einen Blick',
    'pricing.faq.label': 'Fragen & Antworten',
    'pricing.faq.title': 'Häufige Fragen',
    'pricing.cta.title': 'Starte jetzt – ab 99€/Monat',
    'pricing.cta.subtitle': 'Keine Kreditkarte. Keine Vertragsbindung. 14 Tage kostenlos testen.',
    'pricing.cta.primary': 'Kostenlos starten',
    'pricing.cta.secondary': 'Demo buchen',

    // Funktionen page
    'funktionen.hero.label': 'Funktionen',
    'funktionen.hero.title': 'Alles, was deine KI <span class="g1">leisten kann</span>',
    'funktionen.hero.desc': 'Von der Stimmauswahl bis zum Echtzeit-Dashboard – Call Lana ist von Grund auf so gebaut, dass es in deinen Alltag passt und wirklich hilft.',
    'funktionen.hero.cta': 'Jetzt starten',
    'funktionen.core.label': 'Was Call Lana kann',
    'funktionen.core.title': 'Die wichtigsten <span class="g1">Funktionen</span>',
    'funktionen.cta.title': 'Alles klar – <span class="g1">starte jetzt</span>',
    'funktionen.cta.desc': 'Teste Call Lana 14 Tage lang kostenlos. Keine Kreditkarte, keine Vertragsbindung.',

    // Branchen page
    'branchen.hero.label': 'Branchen',
    'branchen.hero.title': 'Call Lana passt sich <span class="g1">deiner Welt</span> an',
    'branchen.hero.desc': 'Egal ob Arztpraxis, Hotellerie, Handwerk oder Kanzlei – unser KI-Assistent versteht deinen Alltag und entlastet dich dort, wo es am meisten hilft.',
    'branchen.cases.label': 'Anwendungsfälle',
    'branchen.cases.title': 'Wer von <span class="g1">Call Lana profitiert</span>',
    'branchen.cta.title': 'Für welche Branche <span class="g1">arbeitest du?</span>',
    'branchen.cta.desc': 'Buche eine persönliche Demo – wir zeigen dir, wie Call Lana genau für deinen Betrieb aussehen würde.',

    // Kontakt page
    'kontakt.hero.label': 'Kontakt',
    'kontakt.hero.title': 'Lass uns <span class="g1">sprechen</span>',
    'kontakt.hero.desc': 'Demo buchen, Fragen stellen oder direkt loslegen – wir sind für dich da. Antwort innerhalb von 24 Stunden garantiert.',
    'kontakt.form.title': 'Schreib uns',
    'kontakt.form.desc': 'Wir antworten innerhalb von 24 Stunden – versprochen.',
    'kontakt.form.submit': 'Nachricht senden →',

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
    'hero.badge': 'Your AI Phone Agent',
    'hero.title': 'No more annoying voice menus',
    'hero.subtitle': 'Meet Lana, your intelligent AI phone agent.',
    'hero.lead': 'Lana truly understands your callers – thanks to NLP and natural dialog. No more "press 1". Just speak naturally, 24/7, GDPR-compliant.',
    'hero.cta.primary': 'Try for free →',
    'hero.cta.secondary': 'Listen to Demo',

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

    // Trust & DSGVO
    'trust.label': 'SECURITY & DATA PROTECTION',
    'trust.title': 'Your data is safe with us',
    'trust.gdpr.title': 'GDPR-compliant',
    'trust.gdpr.desc': 'Servers at Hetzner in Nuremberg, Germany. Full data control.',
    'trust.encrypt.title': 'End-to-end encrypted',
    'trust.encrypt.desc': '256-bit SSL. All calls and data are fully encrypted.',
    'trust.euai.title': 'EU AI Act compliant',
    'trust.euai.desc': 'OpenAI only via Microsoft Azure EU servers. No data leaves Europe.',

    // Use-Cases
    'usecases.label': 'USE CASES',
    'usecases.title': 'Lana adapts to your business',
    'usecases.service.title': 'Service Providers & Practices',
    'usecases.service.desc': 'Phone appointment booking, automatic calendar integration via Cal.com. No call goes unanswered.',
    'usecases.ecommerce.title': 'E-Commerce & Support',
    'usecases.ecommerce.desc': '24/7 customer service, FAQ answers, order status – all automated.',
    'usecases.sales.title': 'Agencies & Sales',
    'usecases.sales.desc': 'Phone lead qualification, automatic CRM push. More deals, less effort.',

    // Integrations
    'integrations.label': 'INTEGRATIONS',
    'integrations.title': 'Connects seamlessly with your tools',
    'integrations.subtitle': 'Lana works with the tools you already use.',
    'integrations.more': 'And many more via Zapier and Make.com',

    // Features / Teaser Cards
    'feature.quick.title': 'Live in 30 minutes',
    'feature.quick.desc': 'No programming. Set up number, configure Lana, start.',
    'feature.gdpr.title': '100% GDPR-compliant',
    'feature.gdpr.desc': 'Servers in Germany. Full data control. EU AI Act compliant.',
    'feature.pricing.title': 'From €99/month',
    'feature.pricing.desc': '1,000 included minutes. Transparent. Fair. Cancel anytime.',

    // Pricing
    'pricing.label': 'Pricing',
    'pricing.title': 'Transparent. Fair. Scalable.',
    'pricing.subtitle': 'Start from €99/month and grow with Call Lana. No fine print, no hidden fees.',
    'pricing.monthly': 'Monthly',
    'pricing.yearly': 'Yearly',
    'pricing.save': '2 months free',
    'pricing.popular': 'Most Popular',
    'pricing.solo': 'Solo',
    'pricing.team': 'Team',
    'pricing.business': 'Business',
    'pricing.permonth': '/ month',
    'pricing.individual': 'Custom',
    'pricing.onrequest': 'Price on request',
    'pricing.startnow': 'Start now',
    'pricing.bookdemo': 'Book demo',
    'pricing.compare.label': 'Comparison',
    'pricing.compare.title': 'All features at a glance',
    'pricing.faq.label': 'Questions & Answers',
    'pricing.faq.title': 'Frequently Asked Questions',
    'pricing.cta.title': 'Start now – from €99/month',
    'pricing.cta.subtitle': 'No credit card. No contract. 14-day free trial.',
    'pricing.cta.primary': 'Start for free',
    'pricing.cta.secondary': 'Book demo',

    // Funktionen page
    'funktionen.hero.label': 'Features',
    'funktionen.hero.title': 'Everything your AI <span class="g1">can do</span>',
    'funktionen.hero.desc': 'From voice selection to real-time dashboard – Call Lana is built from the ground up to fit your daily workflow and truly help.',
    'funktionen.hero.cta': 'Get started',
    'funktionen.core.label': 'What Call Lana can do',
    'funktionen.core.title': 'The key <span class="g1">features</span>',
    'funktionen.cta.title': 'All clear – <span class="g1">start now</span>',
    'funktionen.cta.desc': 'Try Call Lana free for 14 days. No credit card, no contract.',

    // Branchen page
    'branchen.hero.label': 'Industries',
    'branchen.hero.title': 'Call Lana adapts to <span class="g1">your world</span>',
    'branchen.hero.desc': 'Whether medical practice, hospitality, trades, or law firm – our AI assistant understands your daily routine and helps where it matters most.',
    'branchen.cases.label': 'Use Cases',
    'branchen.cases.title': 'Who benefits from <span class="g1">Call Lana</span>',
    'branchen.cta.title': 'Which industry <span class="g1">are you in?</span>',
    'branchen.cta.desc': 'Book a personal demo – we\'ll show you how Call Lana would look for your business.',

    // Kontakt page
    'kontakt.hero.label': 'Contact',
    'kontakt.hero.title': 'Let\'s <span class="g1">talk</span>',
    'kontakt.hero.desc': 'Book a demo, ask questions, or get started right away – we\'re here for you. Response within 24 hours guaranteed.',
    'kontakt.form.title': 'Write to us',
    'kontakt.form.desc': 'We respond within 24 hours – promised.',
    'kontakt.form.submit': 'Send message →',

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
