// i18n — Lightweight internationalization module
// Default language: German (de). Supports URL param ?lang=en for English.

const translations = {
  de: {
    // Navigation
    'nav.features': 'Funktionen',
    'nav.industries': 'Branchen',
    'nav.pricing': 'Preise',
    'nav.contact': 'Kontakt',
    'nav.about': 'Über uns',
    'nav.login': 'Anmelden',
    'nav.register': 'Registrieren',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden',
    'nav.blog': 'Blog',

    // CTAs
    'cta.tryFree': 'Kostenlos testen',
    'cta.startNow': 'Jetzt starten',
    'cta.learnMore': 'Mehr erfahren',
    'cta.bookDemo': 'Demo buchen',
    'cta.openDashboard': 'Dashboard öffnen',
    'cta.contact': 'Kontakt aufnehmen',

    // Common
    'common.loading': 'Laden...',
    'common.error': 'Ein Fehler ist aufgetreten.',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
  },

  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.industries': 'Industries',
    'nav.pricing': 'Pricing',
    'nav.contact': 'Contact',
    'nav.about': 'About us',
    'nav.login': 'Sign in',
    'nav.register': 'Sign up',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign out',
    'nav.blog': 'Blog',

    // CTAs
    'cta.tryFree': 'Try for free',
    'cta.startNow': 'Get started',
    'cta.learnMore': 'Learn more',
    'cta.bookDemo': 'Book a demo',
    'cta.openDashboard': 'Open dashboard',
    'cta.contact': 'Get in touch',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.next': 'Next',
  },
};

const SUPPORTED_LANGUAGES = Object.keys(translations);
const DEFAULT_LANGUAGE = 'de';

function detectLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
    return urlLang;
  }

  const stored = localStorage.getItem('call-lana-lang');
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANGUAGE;
}

let currentLanguage = detectLanguage();

function t(key) {
  const lang = translations[currentLanguage];
  if (lang && lang[key] !== undefined) {
    return lang[key];
  }
  const fallback = translations[DEFAULT_LANGUAGE];
  if (fallback && fallback[key] !== undefined) {
    return fallback[key];
  }
  return key;
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    throw new Error(`Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }
  currentLanguage = lang;
  localStorage.setItem('call-lana-lang', lang);
}

function getLanguage() {
  return currentLanguage;
}

function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

window.i18n = Object.freeze({
  t,
  setLanguage,
  getLanguage,
  getSupportedLanguages,
});
