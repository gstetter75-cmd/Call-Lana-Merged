// Single Source of Truth for all pricing data.
export const PRICING = {
  plans: {
    starter: {
      key: 'starter',
      label: { de: 'Call Lana Starter', en: 'Call Lana Starter' },
      badge: { de: 'Starter', en: 'Starter' },
      desc: {
        de: 'Perfekt für kleine Handwerksbetriebe, die mit KI-Anrufbearbeitung starten wollen.',
        en: 'Perfect for small craft businesses starting with AI call handling.',
      },
      monthly: 149,
      yearly: 129,
      yearlyTotal: 1548,
      minutes: 340,
      overage: 0.39,
      features: {
        de: ['340 Inklusivminuten', 'Terminbuchung', 'Anrufzusammenfassung per E-Mail', 'Weiterleitung nach Geschäftszeiten'],
        en: ['340 included minutes', 'Appointment booking', 'Call summary by email', 'After-hours routing'],
      },
    },
    professional: {
      key: 'professional',
      label: { de: 'Call Lana Professional', en: 'Call Lana Professional' },
      badge: { de: 'Beliebteste Wahl', en: 'Most popular' },
      desc: {
        de: 'Volle KI-Rezeptionistin mit großzügigem Minutenkontingent für wachsende Betriebe.',
        en: 'Full AI receptionist with generous minutes for growing businesses.',
      },
      monthly: 299,
      yearly: 249,
      yearlyTotal: 2988,
      minutes: 560,
      overage: 0.39,
      features: {
        de: ['560 Inklusivminuten', 'Terminbuchung + Kalender-Sync', 'Echtzeit-Anrufweiterleitung', 'SMS + E-Mail-Zusammenfassungen', 'Individuelle Skripte', 'Prioritäts-Support'],
        en: ['560 included minutes', 'Booking + Calendar sync', 'Real-time call routing', 'SMS + Email summaries', 'Custom scripts', 'Priority support'],
      },
      highlighted: true,
    },
    business: {
      key: 'business',
      label: { de: 'Enterprise', en: 'Enterprise' },
      badge: { de: 'Individuell', en: 'Custom' },
      desc: {
        de: 'Maßgeschneidert für Betriebe mit hohem Anrufvolumen, mehreren Standorten oder speziellen Anforderungen.',
        en: 'Tailored for businesses with high call volume, multiple locations, or special requirements.',
      },
      monthly: null,
      yearly: null,
      customPricing: true,
      features: {
        de: ['Individuelles Minutenkontingent', 'Alles aus Pro', 'Mehrere Standorte', 'Persönlicher Ansprechpartner'],
        en: ['Custom minute allowance', 'Everything from Pro', 'Multiple locations', 'Dedicated account manager'],
      },
    },
  },

  formatPrice(cents, mode) {
    if (cents === null) return null;
    return cents + ' €';
  },

  getBillingData(mode) {
    const s = this.plans.starter;
    const p = this.plans.professional;
    if (mode === 'yearly') {
      return {
        lite: s.yearly + ' €', pro: p.yearly + ' €',
        liteOld: s.monthly + ' €', proOld: p.monthly + ' €',
        periodLabel: '/Monat',
        note: 'Jährliche Abrechnung · Starter ' + s.yearlyTotal.toLocaleString('de-DE') + ' €/Jahr · Professional ' + p.yearlyTotal.toLocaleString('de-DE') + ' €/Jahr',
      };
    }
    return {
      lite: s.monthly + ' €', pro: p.monthly + ' €',
      liteOld: '', proOld: '',
      periodLabel: '/Monat',
      note: '',
    };
  },
};
