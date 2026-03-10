// Dynamic component loader for shared Nav, Footer, Sidebar
const Components = {
  cache: {},

  async load(elementId, componentPath) {
    try {
      if (!this.cache[componentPath]) {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        this.cache[componentPath] = await response.text();
      }
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = this.cache[componentPath];
      }
    } catch (err) {
      console.error(`Component load error (${componentPath}):`, err);
    }
  },

  async loadNav(containerId = 'nav-container') {
    await this.load(containerId, 'components/nav.html');
    this.initMobileMenu();
    this.highlightActiveNavLink();
  },

  async loadFooter(containerId = 'footer-container') {
    await this.load(containerId, 'components/footer.html');
  },

  async loadSidebar(containerId = 'sidebar-container', profile = null) {
    await this.load(containerId, 'components/sidebar.html');
    if (profile) {
      this.updateSidebarUser(profile);
      this.filterSidebarByRole(profile);
    }
    this.initSidebarToggle();
  },

  updateSidebarUser(profile) {
    const nameEl = document.querySelector('.sb-user-name');
    const emailEl = document.querySelector('.sb-user-email');
    const avatarEl = document.querySelector('.sb-avatar');
    if (nameEl) nameEl.textContent = AuthGuard.getDisplayName(profile);
    if (emailEl) emailEl.textContent = profile.email || '';
    if (avatarEl) avatarEl.textContent = AuthGuard.getInitials(profile);
  },

  filterSidebarByRole(profile) {
    const role = profile.role;
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowedRoles = el.dataset.role.split(',');
      el.style.display = allowedRoles.includes(role) ? '' : 'none';
    });
  },

  initMobileMenu() {
    const btn = document.querySelector('.mob-btn');
    const nav = document.querySelector('.nav-links');
    if (btn && nav) {
      btn.addEventListener('click', () => nav.classList.toggle('open'));
    }
  },

  highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.style.color = 'var(--tx)';
        link.style.fontWeight = '700';
      }
    });
  },

  initSidebarToggle() {
    const hamburger = document.querySelector('.topbar-hamburger');
    const sidebar = document.querySelector('.sidebar');
    const closeBtn = document.querySelector('.sb-close');

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }
  },

  // Toast notification system
  toast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.cl-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `cl-toast cl-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Loading overlay
  showLoading(container) {
    const overlay = document.createElement('div');
    overlay.className = 'cl-loading-overlay';
    overlay.innerHTML = '<div class="cl-spinner"></div>';
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (container) {
      container.style.position = 'relative';
      container.appendChild(overlay);
    }
    return overlay;
  },

  hideLoading(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
};

window.Components = Components;
