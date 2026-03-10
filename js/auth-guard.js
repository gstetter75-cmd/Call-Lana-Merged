// Auth Guard - Role-based access control and redirects
const AuthGuard = {
  ROLES: { SUPERADMIN: 'superadmin', SALES: 'sales', CUSTOMER: 'customer' },

  ROLE_PAGES: {
    superadmin: ['admin.html', 'dashboard.html', 'sales.html', 'settings.html'],
    sales: ['sales.html', 'settings.html'],
    customer: ['dashboard.html', 'settings.html']
  },

  ROLE_HOME: {
    superadmin: 'admin.html',
    sales: 'sales.html',
    customer: 'dashboard.html'
  },

  async init() {
    const session = await window.clanaAuth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    const profile = await this.getProfile();
    if (!profile) {
      // Session exists but profile fetch failed — build a minimal fallback
      // instead of redirecting to login (which causes a redirect loop)
      const user = await window.clanaAuth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email,
          role: 'customer',
          first_name: user.user_metadata?.firstName || '',
          last_name: user.user_metadata?.lastName || '',
          organizations: null
        };
      }
      window.location.href = 'login.html';
      return null;
    }
    return profile;
  },

  async getProfile() {
    try {
      const user = await window.clanaAuth.getUser();
      if (!user) return null;

      // First try with organization join
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*, organizations(name, plan)')
        .eq('id', user.id)
        .single();

      if (error) {
        // Fallback: try without organization join
        const { data: profileOnly, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        return { ...profileOnly, organizations: null };
      }
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  },

  async requireRole(allowedRoles) {
    const profile = await this.init();
    if (!profile) return null;

    if (!allowedRoles.includes(profile.role)) {
      const home = this.ROLE_HOME[profile.role] || 'login.html';
      window.location.href = home;
      return null;
    }
    return profile;
  },

  async requireSuperadmin() {
    return this.requireRole([this.ROLES.SUPERADMIN]);
  },

  async requireSales() {
    return this.requireRole([this.ROLES.SUPERADMIN, this.ROLES.SALES]);
  },

  async requireCustomer() {
    return this.requireRole([this.ROLES.SUPERADMIN, this.ROLES.CUSTOMER]);
  },

  isSuperadmin(profile) {
    return profile && profile.role === this.ROLES.SUPERADMIN;
  },

  isSales(profile) {
    return profile && profile.role === this.ROLES.SALES;
  },

  isCustomer(profile) {
    return profile && profile.role === this.ROLES.CUSTOMER;
  },

  getDisplayName(profile) {
    if (!profile) return 'User';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.first_name || profile.email || 'User';
  },

  getInitials(profile) {
    if (!profile) return '?';
    const first = (profile.first_name || '')[0] || '';
    const last = (profile.last_name || '')[0] || '';
    return (first + last).toUpperCase() || '?';
  }
};

window.AuthGuard = AuthGuard;
