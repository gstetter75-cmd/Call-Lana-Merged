// Global Modal System: open, close, ESC key, overlay click

export function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('active');
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}

export function initModalListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay.active');
      if (openModals.length > 0) {
        closeModal(openModals[openModals.length - 1].id);
      }
    }
  });

  document.addEventListener('click', (e) => {
    // Overlay click to close
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
      closeModal(e.target.id);
      return;
    }
    // data-close-modal attribute on buttons (replaces onclick="closeModal('...')")
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      closeModal(closeBtn.dataset.closeModal);
      return;
    }
    // .modal-close buttons close their parent overlay
    const modalClose = e.target.closest('.modal-close');
    if (modalClose) {
      const overlay = modalClose.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    }
  });
}
