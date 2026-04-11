/**
 * Modal System
 *
 * Promise-based modal that replaces native window.confirm/alert.
 * Buttons are configurable; the Promise resolves with the clicked
 * button's value (or null if dismissed via Escape/backdrop).
 *
 * Usage:
 *   const choice = await showModal({
 *     title: 'Reset Game',
 *     message: 'This wipes all save data. Continue?',
 *     buttons: [
 *       { label: 'Cancel', value: null, kind: 'default' },
 *       { label: 'Reset',  value: true, kind: 'danger'  },
 *     ],
 *   });
 */

let activeModal = null;

export function showModal({
  title,
  message,
  bodyHtml,
  buttons = [],
  dismissible = true,
  wide = false,
  showClose = false,
  extraClass = '',
}) {
  // Close any existing modal first
  if (activeModal) closeModal(null);

  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    if (title) backdrop.setAttribute('aria-label', title);

    const dialog = document.createElement('div');
    dialog.className =
      'modal-dialog' +
      (wide ? ' modal-dialog-wide' : '') +
      (extraClass ? ' ' + extraClass : '');

    // Optional red X close button in the top-right corner
    if (showClose) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close-x';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal(null);
      });
      dialog.appendChild(closeBtn);
    }

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'modal-title';
      titleEl.textContent = title;
      dialog.appendChild(titleEl);
    }

    if (message) {
      const msgEl = document.createElement('p');
      msgEl.className = 'modal-message';
      msgEl.textContent = message;
      dialog.appendChild(msgEl);
    }

    if (bodyHtml) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'modal-body';
      bodyEl.innerHTML = bodyHtml;
      dialog.appendChild(bodyEl);
    }

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (b.kind === 'danger' ? ' btn-danger' : b.kind === 'primary' ? ' btn-primary' : '');
      btn.textContent = b.label;
      btn.addEventListener('click', () => closeModal(b.value));
      actions.appendChild(btn);
    });

    dialog.appendChild(actions);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Focus first button for keyboard nav
    setTimeout(() => actions.querySelector('button')?.focus(), 0);

    function onKey(e) {
      if (e.key === 'Escape' && dismissible) closeModal(null);
    }
    function onBackdropClick(e) {
      if (e.target === backdrop && dismissible) closeModal(null);
    }
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', onBackdropClick);

    activeModal = {
      backdrop,
      resolve,
      cleanup: () => {
        document.removeEventListener('keydown', onKey);
        backdrop.removeEventListener('click', onBackdropClick);
        backdrop.remove();
      },
    };

    // Trigger fade-in next frame
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  });
}

function closeModal(value) {
  if (!activeModal) return;
  const m = activeModal;
  activeModal = null;
  m.backdrop.classList.remove('is-open');
  // Wait for fade-out before removing
  setTimeout(() => {
    m.cleanup();
    m.resolve(value);
  }, 150);
}

/** Convenience: yes/no confirmation. */
export function confirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return showModal({
    title,
    message,
    buttons: [
      { label: cancelLabel, value: false, kind: 'default' },
      { label: confirmLabel, value: true, kind: danger ? 'danger' : 'primary' },
    ],
  });
}
