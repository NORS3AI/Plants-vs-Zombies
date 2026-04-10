/**
 * Bootstrap
 *
 * Initializes the state machine, screen manager, and game loop.
 * Wires DOM event handlers to state transitions.
 *
 * Phase 1 scope: state flow, screen swapping, theme, save skeleton,
 * grid render. No combat / shop / cards yet — those land in Phases 4–8.
 */

import { StateMachine, STATES } from './game/state.js';
import { GameLoop } from './game/loop.js';
import { Save } from './game/save.js';
import { renderGrid } from './game/grid.js';
import { getDifficulty, DIFFICULTIES } from './game/difficulty.js';
import { ScreenManager } from './ui/screens.js';

// ---------- Boot ----------
const screens = new ScreenManager('#app');
const state = new StateMachine();

// In-memory current run (mirrors Save.loadRun() once started)
let currentRun = null;
let countdownValue = 5;
let countdownTimer = 0;

// ---------- Settings (theme, audio toggles) ----------
function applySettings(settings) {
  document.documentElement.dataset.theme = settings.theme || 'dark';
  const themeSel = document.getElementById('setting-theme');
  const musicCb = document.getElementById('setting-music');
  const soundsCb = document.getElementById('setting-sounds');
  if (themeSel) themeSel.value = settings.theme;
  if (musicCb) musicCb.checked = !!settings.music;
  if (soundsCb) soundsCb.checked = !!settings.sounds;
}

const settings = Save.loadSettings();
applySettings(settings);

// ---------- HUD Sync ----------
function syncHUD() {
  if (!currentRun) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('hud-round', currentRun.round);
  set('hud-gold', currentRun.gold);
  set('hud-hp', currentRun.aetherRootHP);
  set('hud-difficulty', getDifficulty(currentRun.difficulty)?.label ?? '—');
  set('hud-round-combat', currentRun.round);
  set('hud-gold-combat', currentRun.gold);
  set('hud-hp-combat', currentRun.aetherRootHP);
}

// ---------- State Registrations ----------
state.register(STATES.MENU, {
  enter() { screens.show('menu'); },
});

state.register(STATES.DIFFICULTY, {
  enter() {
    screens.show('difficulty');
    // Reflect Endless lock state from meta
    const meta = Save.loadMeta();
    const endlessBtn = document.querySelector('[data-difficulty="endless"]');
    if (endlessBtn && meta.endlessUnlocked) {
      endlessBtn.disabled = false;
      endlessBtn.classList.remove('locked');
      endlessBtn.querySelector('.diff-meta').textContent = '100 HP · 5 Gold';
    }
  },
});

state.register(STATES.SHOP, {
  enter() {
    screens.show('shop');
    syncHUD();
    renderGrid(document.getElementById('grid-container'));
  },
});

state.register(STATES.COUNTDOWN, {
  enter() {
    screens.show('countdown');
    countdownValue = 5;
    countdownTimer = 0;
    paintCountdown();
  },
  update(dt) {
    countdownTimer += dt;
    if (countdownTimer >= 1) {
      countdownTimer = 0;
      countdownValue--;
      if (countdownValue < 0) {
        state.transition(STATES.COMBAT);
      } else {
        paintCountdown();
      }
    }
  },
});

state.register(STATES.COMBAT, {
  enter() {
    screens.show('combat');
    syncHUD();
    renderGrid(document.getElementById('grid-container-combat'));
  },
});

state.register(STATES.ROUND_END, {
  enter() {
    screens.show('round_end');
    if (currentRun) {
      currentRun.round += 1;
      Save.saveRun(currentRun);
    }
  },
});

state.register(STATES.GAME_OVER, {
  enter() {
    screens.show('game_over');
    const el = document.getElementById('game-over-round');
    if (el && currentRun) el.textContent = currentRun.round;
    Save.clearRun();
    currentRun = null;
  },
});

state.register(STATES.SETTINGS, {
  enter() { screens.show('settings'); },
});

function paintCountdown() {
  const el = document.getElementById('countdown-number');
  if (!el) return;
  el.textContent = countdownValue === 0 ? 'GO!' : countdownValue;
  // Re-trigger the zoom animation by toggling a class
  el.style.animation = 'none';
  void el.offsetWidth; // force reflow
  el.style.animation = '';
}

// ---------- Run Lifecycle ----------
function startNewRun(difficultyId) {
  const d = getDifficulty(difficultyId);
  if (!d || d.locked) return;
  currentRun = {
    difficulty: d.id,
    round: 1,
    gold: d.startGold,
    aetherRootHP: d.playerHP,
    aetherRootMaxHP: d.playerHP,
    deck: [],
    grid: [],
  };
  Save.saveRun(currentRun);
  state.transition(STATES.SHOP);
}

// ---------- DOM Event Wiring ----------
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  const difficulty = e.target.closest('[data-difficulty]')?.dataset.difficulty;

  if (difficulty) {
    startNewRun(difficulty);
    return;
  }

  switch (action) {
    case 'start-game':
      state.transition(STATES.DIFFICULTY);
      break;
    case 'open-settings':
      state.transition(STATES.SETTINGS);
      break;
    case 'back-to-menu':
      state.transition(STATES.MENU);
      break;
    case 'start-countdown':
      state.transition(STATES.COUNTDOWN);
      break;
    case 'end-round':
      state.transition(STATES.ROUND_END);
      break;
    case 'next-round':
      state.transition(STATES.SHOP);
      break;
    case 'save-game':
      if (currentRun) Save.saveRun(currentRun);
      Save.saveSettings(readSettingsFromDOM());
      flashToast('Game saved');
      break;
    case 'reset-game':
      if (confirm('Reset all save data? This cannot be undone.')) {
        Save.resetAll();
        currentRun = null;
        applySettings(Save.loadSettings());
        state.transition(STATES.MENU);
      }
      break;
  }
});

// Settings change handlers
document.addEventListener('change', (e) => {
  if (e.target.id === 'setting-theme') {
    document.documentElement.dataset.theme = e.target.value;
    Save.saveSettings(readSettingsFromDOM());
  }
  if (e.target.id === 'setting-music' || e.target.id === 'setting-sounds') {
    Save.saveSettings(readSettingsFromDOM());
  }
});

function readSettingsFromDOM() {
  return {
    theme: document.getElementById('setting-theme')?.value || 'dark',
    music: !!document.getElementById('setting-music')?.checked,
    sounds: !!document.getElementById('setting-sounds')?.checked,
  };
}

function flashToast(msg) {
  // Lightweight inline toast — replaced with proper UI in Phase 12
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--bg-elev); color: var(--accent); padding: 0.75rem 1.25rem;
    border: 1px solid var(--accent); border-radius: 8px; z-index: 9999;
    font-size: 0.9rem; box-shadow: var(--shadow);
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ---------- Game Loop ----------
const loop = new GameLoop({
  update: (dt) => state.update(dt),
  render: () => state.render(),
});

// ---------- Start ----------
state.transition(STATES.MENU);
loop.start();

// Expose for dev console debugging (remove in v1.0)
window.__pvz = { state, Save, currentRun: () => currentRun, DIFFICULTIES };
console.log('[pvz] Phase 1 boot complete. Use window.__pvz for debug.');
