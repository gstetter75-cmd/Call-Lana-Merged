// Shared configuration for all dashboards
const CONFIG = {
  PLANS: {
    starter:      { label: 'Starter',      price: 149 },
    professional: { label: 'Professional', price: 299 },
    business:     { label: 'Business',     price: 599 },
    // Legacy plan names (mapped to current)
    solo:         { label: 'Starter',      price: 149 },
    team:         { label: 'Professional', price: 299 },
  },

  COMMISSION_RATE: 0.05,

  getPlanPrice(plan) {
    const key = (plan || 'starter').toLowerCase();
    return (this.PLANS[key] || this.PLANS.starter).price;
  },

  getPlanLabel(plan) {
    const key = (plan || 'starter').toLowerCase();
    return (this.PLANS[key] || this.PLANS.starter).label;
  }
};

window.CONFIG = CONFIG;
