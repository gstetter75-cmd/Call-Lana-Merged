// Dashboard shared components: sidebar loader, toast, modal helpers
const Components = {
  async loadSidebar(containerId, profile) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const resp = await fetch('components/sidebar.html');
      if (!resp.ok) throw new Error('Sidebar fetch failed');
      container.innerHTML = await resp.text();
    } catch (err) {
      Logger.error('Components.loadSidebar', err);
      container.innerHTML = '<aside class="sidebar"><div class="sb-top"><span style="color:var(--tx3);padding:16px;font-size:12px;">Sidebar konnte nicht geladen werden.</span></div></aside>';
      return;
    }

    const sidebar = container.querySelector('.sidebar');
    if (!sidebar) return;

    // Filter sections by role
    const role = profile?.role || 'customer';
    sidebar.querySelectorAll('[data-role]').forEach(el => {
      const allowedRoles = el.dataset.role.split(',').map(r => r.trim());
      if (!allowedRoles.includes(role) && !allowedRoles.includes('superadmin') && role !== 'superadmin') {
        el.style.display = 'none';
      }
      // Superadmin sees everything
      if (role === 'superadmin') {
        el.style.display = '';
      }
    });

    // Set user info
    const nameEl = sidebar.querySelector('.sb-user-name');
    const emailEl = sidebar.querySelector('.sb-user-email');
    const avatarEl = sidebar.querySelector('.sb-avatar');

    if (nameEl) nameEl.textContent = AuthGuard.getDisplayName(profile);
    if (emailEl) emailEl.textContent = profile?.email || '';
    if (avatarEl) avatarEl.textContent = AuthGuard.getInitials(profile);

    // Highlight active page
    const currentPage = location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const hash = location.hash.replace('#', '');
    sidebar.querySelectorAll('.sb-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      const page = item.dataset.page || '';
      const isActive = href.includes(currentPage) || page === hash;
      item.classList.toggle('active', isActive);
    });

    // Close button (mobile)
    sidebar.querySelector('.sb-close')?.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });

    // Hamburger toggle
    document.querySelector('.topbar-hamburger')?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  },

  toast(message, type) {
    // Remove existing toast
    document.querySelectorAll('.cl-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    const typeClass = type === 'error' ? 'cl-toast-error' : type === 'warning' ? 'cl-toast-warning' : type === 'info' ? 'cl-toast-info' : 'cl-toast-success';
    toast.className = 'cl-toast ' + typeClass;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

window.Components = Components;
