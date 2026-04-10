/**
 * Screen Manager
 *
 * Shows one <section class="screen"> at a time by toggling [hidden].
 * Looks up screens by their data-screen attribute.
 */

export class ScreenManager {
  constructor(rootSelector = '#app') {
    this.root = document.querySelector(rootSelector);
    this.screens = new Map();
    this.root.querySelectorAll('.screen').forEach((el) => {
      const name = el.dataset.screen;
      if (name) this.screens.set(name, el);
    });
    this.current = null;
  }

  show(name) {
    if (!this.screens.has(name)) {
      console.warn(`[screens] unknown screen: ${name}`);
      return;
    }
    this.screens.forEach((el, key) => {
      const isTarget = key === name;
      el.hidden = !isTarget;
      el.classList.remove('is-active');
    });
    const target = this.screens.get(name);
    // Force reflow so re-adding the class restarts the CSS animation
    void target.offsetWidth;
    target.classList.add('is-active');
    this.current = name;
  }

  get(name) {
    return this.screens.get(name);
  }
}
