/**
 * Tutorial Mode
 *
 * Contextual first-time popups that fire at key moments during a
 * Tutorial-difficulty run. Each popup shows at most once per run
 * (tracked in `run.tutorialSeen`). Non-tutorial runs are no-ops.
 *
 * The popups are inline slide-in cards, NOT modals, so they don't
 * pause combat. Clicking "Got it" dismisses; cards also auto-dismiss
 * after AUTO_DISMISS_SEC seconds.
 */

const AUTO_DISMISS_SEC = 12;

const POPUPS = {
  first_shop: {
    title: 'Welcome to the Shop',
    body:
      'Tap a card to buy it. Your deck can hold up to 10 cards. If you don\'t like the offerings, refresh for 1 gold.',
  },
  first_buy: {
    title: 'First Purchase',
    body:
      'Great buy! Cards go to your deck below the shop. Tap a deck card to select it for placement.',
  },
  first_place: {
    title: 'Placement',
    body:
      'Your plant is now on the battlefield. Tap a placed card to set its targeting (First / Strongest / Weakest) or remove it.',
  },
  first_countdown: {
    title: 'Round Starting',
    body:
      'Plants fight automatically once combat begins. Watch your plant cast timers — you can only cast Aether-Root spells during the fight.',
  },
  first_zombie_kill: {
    title: 'First Kill!',
    body:
      'Every dead zombie drops gold. Use it to buy more cards between rounds. Economy plants like Sunflower generate extra gold over time.',
  },
  first_spell: {
    title: 'Aether-Root Spell Cast',
    body:
      'Spells have cooldowns or once-per-round limits. Save powerful spells (like Nature\'s Wrath) for boss phases.',
  },
  first_pack: {
    title: 'Card Pack Opened',
    body:
      'Packs contain exclusive cards you can\'t get from the shop. Frenzy packs (50g) guarantee at least one Epic and pity a Legendary every 5th open.',
  },
  first_boss: {
    title: 'BOSS!',
    body:
      'Bosses have 3× the HP and 2× the damage of regular zombies. When a boss spawns, remaining zombies get a +10% speed Frenzy buff.',
  },
  first_plant_death: {
    title: 'Plant Lost',
    body:
      'Plants that die stay gone for the rest of the round but return to your deck next round. Watch your lanes and fill gaps quickly.',
  },
};

// ---------- Module state ----------
let _run = null;
let _audio = null;
let _activeEl = null;
let _dismissTimer = null;

/** Initialize the tutorial module. */
export function initTutorial({ audio } = {}) {
  _audio = audio;
}

/** Set the current run; called from main.js on state transitions. */
export function setRun(run) {
  _run = run;
  // Clear active popup if we leave a run
  if (!run && _activeEl) dismiss();
}

/**
 * Trigger a tutorial popup by id. No-op if:
 *   - Not in tutorial difficulty
 *   - Popup already seen this run
 *   - Popup id unknown
 */
export function trigger(popupId) {
  if (!_run || _run.difficulty !== 'tutorial') return;
  const def = POPUPS[popupId];
  if (!def) return;
  if (!_run.tutorialSeen) _run.tutorialSeen = {};
  if (_run.tutorialSeen[popupId]) return;
  _run.tutorialSeen[popupId] = true;
  showPopup(def);
}

/**
 * Force-show a popup, ignoring the "seen" check. Useful for debugging.
 */
export function forceShow(popupId) {
  const def = POPUPS[popupId];
  if (!def) return;
  showPopup(def);
}

function showPopup({ title, body }) {
  // Dismiss any currently-active popup first
  if (_activeEl) dismiss();

  const el = document.createElement('div');
  el.className = 'tutorial-popup';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  const header = document.createElement('div');
  header.className = 'tutorial-popup-header';
  const icon = document.createElement('span');
  icon.className = 'tutorial-popup-icon';
  icon.textContent = '💡';
  const titleEl = document.createElement('h4');
  titleEl.className = 'tutorial-popup-title';
  titleEl.textContent = title;
  header.appendChild(icon);
  header.appendChild(titleEl);
  el.appendChild(header);

  const bodyEl = document.createElement('p');
  bodyEl.className = 'tutorial-popup-body';
  bodyEl.textContent = body;
  el.appendChild(bodyEl);

  const btn = document.createElement('button');
  btn.className = 'tutorial-popup-btn';
  btn.textContent = 'Got it';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });
  el.appendChild(btn);

  document.body.appendChild(el);
  _activeEl = el;
  _audio?.playSfx('click');

  // Trigger slide-in animation next frame
  requestAnimationFrame(() => el.classList.add('is-visible'));

  // Auto-dismiss after N seconds
  _dismissTimer = setTimeout(dismiss, AUTO_DISMISS_SEC * 1000);
}

function dismiss() {
  if (!_activeEl) return;
  const el = _activeEl;
  _activeEl = null;
  if (_dismissTimer) {
    clearTimeout(_dismissTimer);
    _dismissTimer = null;
  }
  el.classList.remove('is-visible');
  setTimeout(() => el.remove(), 250);
}

/** Dismiss the active popup (used from main.js on state transitions). */
export function clearPopup() {
  dismiss();
}

/** Returns true if the popup with this id has been shown this run. */
export function wasSeen(popupId) {
  return !!_run?.tutorialSeen?.[popupId];
}
