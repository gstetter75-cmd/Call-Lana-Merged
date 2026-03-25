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
      if (role === 'superadmin') {
        // Superadmin sees everything
        el.style.display = '';
      } else if (!allowedRoles.includes(role)) {
        el.style.display = 'none';
      }
    });

    // Set logo link to role-based home
    const logoLink = sidebar.querySelector('.sb-logo');
    if (logoLink) logoLink.href = AuthGuard.getHomeUrl(profile);

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

// Global error handler — shows offline/error banner
(function initErrorHandler() {
  let banner = null;

  function showBanner(msg) {
    if (banner) return;
    banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:300;background:var(--red,#dc2626);color:white;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;font-family:Manrope,sans-serif;';
    const textNode = document.createTextNode(msg + ' ');
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Schließen';
    closeBtn.style.cssText = 'background:rgba(255,255,255,.2);border:none;color:white;padding:4px 12px;border-radius:6px;cursor:pointer;margin-left:12px;font-family:inherit;';
    closeBtn.onclick = () => { banner.remove(); banner = null;  };
    banner.appendChild(textNode);
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
  }

  function hideBanner() {
    if (banner) { banner.remove(); banner = null;  }
  }

  window.addEventListener('offline', () => showBanner('Keine Internetverbindung. Bitte prüfe deine Verbindung.'));
  window.addEventListener('online', () => { hideBanner(); Components.toast('Verbindung wiederhergestellt', 'success'); });

  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason || '');
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      showBanner('Verbindungsfehler. Bitte Seite neu laden.');
    }
  });
})();

window.Components = Components;
