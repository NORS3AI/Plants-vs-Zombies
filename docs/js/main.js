/**
 * Bootstrap
 *
 * Initializes the state machine, screen manager, audio, and game loop.
 * Wires DOM event handlers to state transitions.
 *
 * Phase 3 scope: full round flow with stats tracking, round-end summary,
 * game-over flow with debug damage, enriched difficulty cards, HP color
 * coding, "Round X / 10" formatting.
 */

const ROUNDS_TOTAL = 10; // Standard mode runs to round 10; Endless ignores this

import { StateMachine, STATES } from './game/state.js';
import { GameLoop } from './game/loop.js';
import { Save } from './game/save.js';
import { renderGrid } from './game/grid.js';
import { getDifficulty, DIFFICULTIES } from './game/difficulty.js';
import { AudioManager } from './game/audio.js';
import { ScreenManager } from './ui/screens.js';
import { confirmModal } from './ui/modal.js';
import * as Cards from './cards/index.js';
import * as Shop from './ui/shop.js';

// Validate the card database at boot (logs errors/warnings to console)
Cards.validateAndLog();

// ---------- Boot ----------
const screens = new ScreenManager('#app');
const state = new StateMachine();
const audio = new AudioManager();

// In-memory current run (mirrors Save.loadRun() once started)
let currentRun = null;
let countdownValue = 5;
let countdownTimer = 0;

// ---------- Settings ----------
function applySettings(settings) {
  document.documentElement.dataset.theme = settings.theme || 'dark';

  const themeSel = document.getElementById('setting-theme');
  const musicCb = document.getElementById('setting-music');
  const soundsCb = document.getElementById('setting-sounds');
  const musicVol = document.getElementById('setting-music-volume');
  const sfxVol = document.getElementById('setting-sfx-volume');

  if (themeSel) themeSel.value = settings.theme;
  if (musicCb) musicCb.checked = !!settings.music;
  if (soundsCb) soundsCb.checked = !!settings.sounds;
  if (musicVol) musicVol.value = Math.round((settings.musicVolume ?? 0.6) * 100);
  if (sfxVol) sfxVol.value = Math.round((settings.sfxVolume ?? 0.8) * 100);

  audio.setSettings({
    music: settings.music,
    sounds: settings.sounds,
    musicVolume: settings.musicVolume,
    sfxVolume: settings.sfxVolume,
  });
}

const settings = Save.loadSettings();
applySettings(settings);

// Initialize shop module with audio + run-mutation callback
Shop.initShop({
  audio,
  onChange: () => {
    if (currentRun) Save.saveRun(currentRun);
    syncHUD();
    if (state.current === STATES.SHOP) Shop.renderShop(currentRun);
  },
});

// ---------- HUD Sync ----------
function formatRound(run) {
  if (!run) return '—';
  return run.difficulty === 'endless' ? `${run.round}` : `${run.round} / ${ROUNDS_TOTAL}`;
}

function applyHpColor(el, hp, max) {
  if (!el) return;
  el.classList.remove('hud-hp-low', 'hud-hp-med');
  if (hp <= max * 0.25) el.classList.add('hud-hp-low');
  else if (hp <= max * 0.5) el.classList.add('hud-hp-med');
}

function syncHUD() {
  if (!currentRun) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('hud-round', formatRound(currentRun));
  set('hud-gold', currentRun.gold);
  set('hud-hp', `${currentRun.aetherRootHP} / ${currentRun.aetherRootMaxHP}`);
  set('hud-difficulty', getDifficulty(currentRun.difficulty)?.label ?? '—');
  set('hud-round-combat', formatRound(currentRun));
  set('hud-gold-combat', currentRun.gold);
  set('hud-hp-combat', `${currentRun.aetherRootHP} / ${currentRun.aetherRootMaxHP}`);

  applyHpColor(document.getElementById('hud-hp'), currentRun.aetherRootHP, currentRun.aetherRootMaxHP);
  applyHpColor(document.getElementById('hud-hp-combat'), currentRun.aetherRootHP, currentRun.aetherRootMaxHP);
}

// ---------- State Registrations ----------
state.register(STATES.MENU, {
  enter() {
    screens.show('menu');
    refreshMenuButtons();
  },
});

state.register(STATES.DIFFICULTY, {
  enter() {
    screens.show('difficulty');
    buildDifficultyCards();
  },
});

state.register(STATES.SHOP, {
  enter() {
    screens.show('shop');
    syncHUD();
    renderGrid(document.getElementById('grid-container'));
    if (currentRun) Shop.renderShop(currentRun);
  },
});

state.register(STATES.COUNTDOWN, {
  enter() {
    screens.show('countdown');
    countdownValue = 5;
    countdownTimer = 0;
    paintCountdown();
    audio.playSfx('tick');
  },
  update(dt) {
    countdownTimer += dt;
    if (countdownTimer >= 1) {
      countdownTimer = 0;
      countdownValue--;
      if (countdownValue <= 0) {
        // 5,4,3,2,1 each shown for 1s, then transition at t=5s
        audio.playSfx('go');
        state.transition(STATES.COMBAT);
      } else {
        paintCountdown();
        audio.playSfx('tick');
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
    paintRoundSummary();
  },
});

state.register(STATES.GAME_OVER, {
  enter() {
    screens.show('game_over');
    paintGameOver();
    audio.playSfx('gameover');
    Save.clearRun();
    // Note: keep currentRun in memory until user returns to menu so the
    // game-over screen can read its stats; cleared on back-to-menu.
  },
});

state.register(STATES.SETTINGS, {
  enter() {
    screens.show('settings');
    refreshSettingsButtons();
  },
});

// ---------- Difficulty Cards (built from DIFFICULTIES) ----------
function buildDifficultyCards() {
  const host = document.getElementById('difficulty-grid');
  if (!host) return;
  const meta = Save.loadMeta();
  host.innerHTML = '';
  for (const d of Object.values(DIFFICULTIES)) {
    const isLocked = d.locked && !(d.id === 'endless' && meta.endlessUnlocked);
    const btn = document.createElement('button');
    btn.className = 'diff-card' + (isLocked ? ' locked' : '');
    btn.dataset.difficulty = d.id;
    btn.disabled = isLocked;

    const name = document.createElement('span');
    name.className = 'diff-name';
    name.textContent = d.label;

    const metaEl = document.createElement('span');
    metaEl.className = 'diff-meta';
    if (isLocked) {
      metaEl.textContent = '🔒 Beat Round 10';
    } else {
      metaEl.textContent = `${d.playerHP} HP · ${d.startGold} Gold`;
    }

    btn.appendChild(name);
    btn.appendChild(metaEl);

    // Enemy multiplier subtext
    if (!isLocked) {
      const mods = document.createElement('span');
      mods.className = 'diff-mods';
      const hpPct = Math.round(d.enemyHPMul * 100);
      const dmgPct = Math.round(d.enemyDmgMul * 100);
      mods.textContent = `Enemy: ${hpPct}% HP · ${dmgPct}% DMG`;
      btn.appendChild(mods);
    }

    host.appendChild(btn);
  }
}

// ---------- Menu / Settings Reactivity ----------
function refreshMenuButtons() {
  // Resume button visible only when a saved run exists
  const resumeBtn = document.getElementById('resume-button');
  if (resumeBtn) resumeBtn.hidden = !Save.hasRun();

  // Leaderboard unlock follows endless unlock
  const lbBtn = document.getElementById('leaderboard-button');
  if (lbBtn) {
    const meta = Save.loadMeta();
    lbBtn.disabled = !meta.endlessUnlocked;
  }
}

function refreshSettingsButtons() {
  // Quit Run only visible when a run is in progress
  const quitBtn = document.getElementById('quit-run-button');
  if (quitBtn) quitBtn.hidden = !currentRun;
}

function paintCountdown() {
  const el = document.getElementById('countdown-number');
  if (!el) return;
  el.textContent = countdownValue;
  el.classList.remove('ticking');
  void el.offsetWidth;
  el.classList.add('ticking');
}

// ---------- Run Lifecycle ----------
function startNewRun(difficultyId) {
  const d = getDifficulty(difficultyId);
  if (!d) return;
  if (d.locked) {
    const meta = Save.loadMeta();
    if (!(d.id === 'endless' && meta.endlessUnlocked)) return;
  }
  currentRun = {
    difficulty: d.id,
    round: 1,
    gold: d.startGold,
    aetherRootHP: d.playerHP,
    aetherRootMaxHP: d.playerHP,
    deck: [],
    grid: [],
    totalKills: 0,
    totalGoldEarned: 0,
    totalPlantsLost: 0,
    lastRoundStats: null,
  };
  Save.saveRun(currentRun);
  state.transition(STATES.SHOP);
}

/**
 * End the current round. Records lastRoundStats, increments round counter,
 * and either advances to ROUND_END or — if this was the final round on a
 * non-endless run — to GAME_OVER (treated as a victory in Phase 8+).
 *
 * Phase 3 has no real combat, so the per-round stats are zeros. The data
 * pipeline is in place for Phase 7's combat engine to populate.
 */
function endRound() {
  if (!currentRun) return;

  // Build the per-round summary from accumulators (zeros for now)
  // In Phase 7+, the combat engine will populate these on the live run.
  const stats = {
    round: currentRun.round,
    goldEarned: currentRun.lastRoundGoldEarned ?? 0,
    kills: currentRun.lastRoundKills ?? 0,
    plantsLost: currentRun.lastRoundPlantsLost ?? 0,
  };
  currentRun.lastRoundStats = stats;
  currentRun.totalGoldEarned += stats.goldEarned;
  currentRun.totalKills += stats.kills;
  currentRun.totalPlantsLost += stats.plantsLost;

  // Reset per-round accumulators (Phase 7 will use these)
  currentRun.lastRoundGoldEarned = 0;
  currentRun.lastRoundKills = 0;
  currentRun.lastRoundPlantsLost = 0;

  // Advance round counter for the next round
  currentRun.round += 1;
  Save.saveRun(currentRun);

  state.transition(STATES.ROUND_END);
}

/** Apply damage to the Aether-Root. Triggers GAME_OVER at HP <= 0. */
function damageAetherRoot(amount) {
  if (!currentRun) return;
  currentRun.aetherRootHP = Math.max(0, currentRun.aetherRootHP - amount);
  Save.saveRun(currentRun);
  syncHUD();
  audio.playSfx('damage');
  if (currentRun.aetherRootHP <= 0) {
    state.transition(STATES.GAME_OVER);
  }
}

function paintRoundSummary() {
  if (!currentRun || !currentRun.lastRoundStats) return;
  const s = currentRun.lastRoundStats;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  // Title shows the round that JUST FINISHED, not the upcoming one
  set('round-end-title', `Round ${s.round} Complete`);
  set('summary-gold', `+${s.goldEarned}`);
  set('summary-kills', s.kills);
  set('summary-plants-lost', s.plantsLost);
  set('summary-hp', `${currentRun.aetherRootHP} / ${currentRun.aetherRootMaxHP}`);
  set('summary-total-gold', currentRun.gold);

  // Hide "Next Round" if we just beat the final round (handled in Phase 8 victory)
  const nextBtn = document.getElementById('next-round-button');
  if (nextBtn) {
    if (currentRun.difficulty !== 'endless' && s.round >= ROUNDS_TOTAL) {
      nextBtn.textContent = 'Victory!';
    } else {
      nextBtn.textContent = 'Next Round →';
    }
  }
}

/**
 * Handle a round 10 victory: unlock Endless, return to menu.
 * Phase 3 stub — Phase 8 will add a proper victory screen with stats.
 */
function handleRound10Victory() {
  const meta = Save.loadMeta();
  if (!meta.endlessUnlocked) {
    meta.endlessUnlocked = true;
    Save.saveMeta(meta);
    flashToast('🏆 Endless Mode unlocked!');
  } else {
    flashToast('Victory!');
  }
  Save.clearRun();
  currentRun = null;
  state.transition(STATES.MENU);
}

function paintGameOver() {
  if (!currentRun) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  // currentRun.round = the round they were playing when they died.
  // endRound() only increments round AFTER a successful round completion,
  // so this is the round they were on at death.
  set('game-over-round', `Round ${currentRun.round}`);
  set('game-over-difficulty', getDifficulty(currentRun.difficulty)?.label ?? '—');
  set('game-over-kills', currentRun.totalKills);
  set('game-over-gold', currentRun.totalGoldEarned);
  set('game-over-plants', currentRun.totalPlantsLost);
}

function resumeRun() {
  if (!Save.hasRun()) return;
  currentRun = Save.loadRun();
  state.transition(STATES.SHOP);
}

async function quitRun() {
  const confirmed = await confirmModal({
    title: 'Quit Run',
    message: 'Abandon the current run? Your save for this run will be cleared.',
    confirmLabel: 'Quit',
    danger: true,
  });
  if (!confirmed) return;
  Save.clearRun();
  currentRun = null;
  state.transition(STATES.MENU);
}

async function resetGame() {
  const confirmed = await confirmModal({
    title: 'Reset Game',
    message: 'This wipes all save data including settings, run, leaderboard, and unlocks. This cannot be undone.',
    confirmLabel: 'Reset Everything',
    danger: true,
  });
  if (!confirmed) return;
  Save.resetAll();
  currentRun = null;
  applySettings(Save.loadSettings());
  state.transition(STATES.MENU);
}

// ---------- DOM Event Wiring ----------
document.addEventListener('click', (e) => {
  // Lazy-init audio on first user click (browser autoplay policy)
  audio.init();

  const action = e.target.closest('[data-action]')?.dataset.action;
  const difficulty = e.target.closest('[data-difficulty]')?.dataset.difficulty;

  if (difficulty) {
    audio.playSfx('click');
    startNewRun(difficulty);
    return;
  }

  if (action) audio.playSfx(action.startsWith('back') || action === 'settings-back' ? 'back' : 'click');

  switch (action) {
    case 'start-game':
      state.transition(STATES.DIFFICULTY);
      break;
    case 'resume-game':
      resumeRun();
      break;
    case 'open-settings':
      state.transition(STATES.SETTINGS);
      break;
    case 'open-leaderboard':
      // Phase 11
      flashToast('Leaderboard arrives in Phase 11');
      break;
    case 'settings-back':
      // Return to previous screen if mid-run, otherwise menu
      if (currentRun && state.previous && state.previous !== STATES.SETTINGS) {
        state.transition(state.previous);
      } else {
        state.transition(STATES.MENU);
      }
      break;
    case 'refresh-shop':
      if (currentRun) Shop.refreshShop(currentRun);
      break;
    case 'start-countdown':
      state.transition(STATES.COUNTDOWN);
      break;
    case 'end-round':
      endRound();
      break;
    case 'debug-damage':
      damageAetherRoot(10);
      break;
    case 'next-round':
      // Round 10 victory check (Phase 3 stub — Phase 8 adds full victory screen)
      if (currentRun && currentRun.difficulty !== 'endless' && currentRun.round > ROUNDS_TOTAL) {
        handleRound10Victory();
      } else {
        state.transition(STATES.SHOP);
      }
      break;
    case 'back-to-menu':
      // currentRun was kept for game-over rendering; clear it now
      if (state.current === STATES.GAME_OVER) currentRun = null;
      state.transition(STATES.MENU);
      break;
    case 'save-game':
      if (currentRun) Save.saveRun(currentRun);
      Save.saveSettings(readSettingsFromDOM());
      flashToast('Game saved');
      break;
    case 'reset-game':
      resetGame();
      break;
    case 'quit-run':
      quitRun();
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
    const s = readSettingsFromDOM();
    Save.saveSettings(s);
    audio.setSettings(s);
  }
});

// Live volume slider handlers (use 'input' for instant feedback)
document.addEventListener('input', (e) => {
  if (e.target.id === 'setting-music-volume' || e.target.id === 'setting-sfx-volume') {
    const s = readSettingsFromDOM();
    Save.saveSettings(s);
    audio.setSettings(s);
  }
});

function readSettingsFromDOM() {
  // Use ?? not || so a slider value of 0 isn't treated as falsy and
  // overwritten with the default. (You should be able to mute via slider.)
  const musicVolRaw = document.getElementById('setting-music-volume')?.value;
  const sfxVolRaw = document.getElementById('setting-sfx-volume')?.value;
  return {
    theme: document.getElementById('setting-theme')?.value || 'dark',
    music: !!document.getElementById('setting-music')?.checked,
    sounds: !!document.getElementById('setting-sounds')?.checked,
    musicVolume: (musicVolRaw !== undefined ? Number(musicVolRaw) : 60) / 100,
    sfxVolume: (sfxVolRaw !== undefined ? Number(sfxVolRaw) : 80) / 100,
  };
}

function flashToast(msg) {
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
window.__pvz = {
  state,
  Save,
  audio,
  Cards,
  Shop,
  currentRun: () => currentRun,
  DIFFICULTIES,
};
console.log('[pvz] Phase 5 boot complete. Use window.__pvz for debug.');
console.log(`[pvz] Card database: ${Cards.ALL_CARDS.length} cards`);
