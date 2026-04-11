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
import { Save, DEFAULT_RUN } from './game/save.js';
import { getDifficulty, DIFFICULTIES } from './game/difficulty.js';
import { AudioManager } from './game/audio.js';
import * as Combat from './game/combat.js';
import * as AetherSpells from './game/aetherSpells.js';
import { ScreenManager } from './ui/screens.js';
import { confirmModal } from './ui/modal.js';
import * as Cards from './cards/index.js';
import * as Shop from './ui/shop.js';
import * as Placement from './ui/placement.js';
import * as CombatView from './ui/combatView.js';
import * as Tutorial from './ui/tutorial.js';
import * as Leaderboard from './game/leaderboard.js';

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
  const devModeCb = document.getElementById('setting-dev-mode');
  const devHint = document.getElementById('dev-mode-hint');

  if (themeSel) themeSel.value = settings.theme;
  if (musicCb) musicCb.checked = !!settings.music;
  if (soundsCb) soundsCb.checked = !!settings.sounds;
  if (musicVol) musicVol.value = Math.round((settings.musicVolume ?? 0.6) * 100);
  if (sfxVol) sfxVol.value = Math.round((settings.sfxVolume ?? 0.8) * 100);
  if (devModeCb) devModeCb.checked = !!settings.devMode;
  if (devHint) devHint.hidden = !settings.devMode;

  // Show/hide all dev-gold buttons across screens based on the setting
  document.querySelectorAll('.dev-gold-btn').forEach((btn) => {
    btn.hidden = !settings.devMode;
  });

  audio.setSettings({
    music: settings.music,
    sounds: settings.sounds,
    musicVolume: settings.musicVolume,
    sfxVolume: settings.sfxVolume,
  });
}

const settings = Save.loadSettings();
applySettings(settings);

// Initialize shop + placement with audio + run-mutation callback
function onRunChange() {
  if (currentRun) Save.saveRun(currentRun);
  syncHUD();
  if (state.current === STATES.SHOP) {
    Shop.renderShop(currentRun);
    Placement.renderPlacement(currentRun);
  }
}

Shop.initShop({ audio, onChange: onRunChange, onFirstBuy: () => Tutorial.trigger('first_buy'), onFirstPack: () => Tutorial.trigger('first_pack') });
Placement.initPlacement({ audio, onChange: onRunChange, onFirstPlace: () => Tutorial.trigger('first_place') });
CombatView.setCombatViewAudio(audio);
Tutorial.initTutorial({ audio });

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
  // New sticky left sidebar (hud-sb-*)
  set('hud-sb-round', formatRound(currentRun));
  set('hud-sb-gold', currentRun.gold);
  set('hud-sb-hp', `${currentRun.aetherRootHP}/${currentRun.aetherRootMaxHP}`);
  set('hud-sb-difficulty', getDifficulty(currentRun.difficulty)?.label ?? '—');
  applyHpColor(
    document.getElementById('hud-sb-hp'),
    currentRun.aetherRootHP,
    currentRun.aetherRootMaxHP,
  );
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
    if (currentRun) {
      Shop.renderShop(currentRun);
      Placement.renderPlacement(currentRun);
      Tutorial.trigger('first_shop');
    }
  },
  exit() {
    // Drop any pending placement selection when leaving the shop screen
    if (currentRun) Placement.clearSelection(currentRun);
    Tutorial.clearPopup();
  },
});

state.register(STATES.COUNTDOWN, {
  enter() {
    screens.show('countdown');
    countdownValue = 5;
    countdownTimer = 0;
    paintCountdown();
    audio.playSfx('tick');
    Tutorial.trigger('first_countdown');
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
    // Reset fast-forward speed to 1× at the start of every round so
    // the button state matches the game state.
    Combat.setSpeedMultiplier(1);
    updateSpeedButton();
    if (!currentRun) return;
    Combat.initCombat(currentRun, {
      onGoldChange: () => syncHUD(),
      onAetherHit: () => {
        syncHUD();
        audio.playSfx('damage');
      },
      onZombieKilled: () => Tutorial.trigger('first_zombie_kill'),
      onPlantKilled: () => {
        syncHUD();
        Tutorial.trigger('first_plant_death');
      },
      onBossSpawn: () => Tutorial.trigger('first_boss'),
      onSpellCast: () => Tutorial.trigger('first_spell'),
      onRoundComplete: () => endRound(),
      onGameOver: () => {
        audio.playSfx('gameover');
        state.transition(STATES.GAME_OVER);
      },
    });
    CombatView.initCombatView(
      document.getElementById('grid-container-combat'),
      currentRun,
    );
  },
  update(dt) {
    Combat.tickCombat(dt);
  },
  render() {
    const s = Combat.getCombatState();
    if (s) CombatView.renderCombatFrame(s);
  },
  exit() {
    Combat.resetCombat();
    CombatView.resetCombatView();
    Combat.setSpeedMultiplier(1);
  },
});

/**
 * Sync the fast-forward button label to the current speed multiplier.
 * Only meaningful while the combat screen is visible.
 */
function updateSpeedButton() {
  const btn = document.getElementById('speed-btn');
  if (!btn) return;
  const speed = Combat.getSpeedMultiplier();
  btn.textContent = speed === 1 ? '▶ 1×' : speed === 2 ? '▶▶ 2×' : '▶▶▶ 3×';
  btn.classList.toggle('speed-active', speed > 1);
}

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
    // Pre-fill name input with last-used name and focus it
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.value = Leaderboard.getLastName();
      // Wait a frame so the fade-in animation doesn't swallow focus
      setTimeout(() => nameInput.focus({ preventScroll: true }), 250);
    }
    // Clear rank banner from previous game-overs
    const rankEl = document.getElementById('game-over-rank');
    if (rankEl) { rankEl.hidden = true; rankEl.textContent = ''; }
    // Re-show name entry (may have been hidden after a previous submit)
    const entry = document.querySelector('#screen-game-over .name-entry');
    if (entry) entry.hidden = false;
  },
});

state.register(STATES.VICTORY, {
  enter() {
    screens.show('victory');
    paintVictory();
    audio.playSfx('go');
    const nameInput = document.getElementById('victory-name-input');
    if (nameInput) {
      nameInput.value = Leaderboard.getLastName();
      setTimeout(() => nameInput.focus({ preventScroll: true }), 400);
    }
    const entry = document.querySelector('#screen-victory .name-entry');
    if (entry) entry.hidden = false;
  },
});

state.register(STATES.LEADERBOARD, {
  enter() {
    screens.show('leaderboard');
    renderLeaderboard();
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

  // Leaderboard: enabled when any entries exist OR endless is unlocked
  const lbBtn = document.getElementById('leaderboard-button');
  if (lbBtn) {
    const meta = Save.loadMeta();
    const hasEntries = Leaderboard.hasEntries();
    lbBtn.disabled = !meta.endlessUnlocked && !hasEntries;
    if (!lbBtn.disabled) lbBtn.title = 'View your best runs';
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
  // Deep-copy DEFAULT_RUN so nested objects/arrays aren't shared across runs
  currentRun = JSON.parse(JSON.stringify(DEFAULT_RUN));
  currentRun.difficulty = d.id;
  currentRun.gold = d.startGold;
  currentRun.aetherRootHP = d.playerHP;
  currentRun.aetherRootMaxHP = d.playerHP;
  Save.saveRun(currentRun);
  Tutorial.setRun(currentRun);
  state.transition(STATES.SHOP);
}

/**
 * End the current round. Snapshots the accumulated per-round stats
 * (already populated by combat.js during the round) into lastRoundStats,
 * resets per-round accumulators, increments round counter.
 *
 * Totals (totalKills/totalGoldEarned/totalPlantsLost) are written
 * directly by combat.js on each kill/death so that game-over mid-round
 * still shows accurate totals.
 */
function endRound() {
  if (!currentRun) return;

  const stats = {
    round: currentRun.round,
    goldEarned: currentRun.lastRoundGoldEarned ?? 0,
    kills: currentRun.lastRoundKills ?? 0,
    plantsLost: currentRun.lastRoundPlantsLost ?? 0,
  };
  currentRun.lastRoundStats = stats;

  // Reset per-round accumulators
  currentRun.lastRoundGoldEarned = 0;
  currentRun.lastRoundKills = 0;
  currentRun.lastRoundPlantsLost = 0;

  // Strip transient (per-round) buffs — Nectar Rush, Aether Bloom, etc.
  Combat.clearTransientBuffs(currentRun);

  // Advance round counter for the next round
  currentRun.round += 1;
  Save.saveRun(currentRun);

  state.transition(STATES.ROUND_END);
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
 * Handle a round 10 victory: unlock Endless, show victory screen,
 * prompt for leaderboard name entry.
 */
function handleRound10Victory() {
  if (!currentRun) return;
  // Mark the run as a completed victory for the leaderboard
  currentRun.victory = true;
  const meta = Save.loadMeta();
  const wasUnlocked = meta.endlessUnlocked;
  if (!wasUnlocked) {
    meta.endlessUnlocked = true;
    Save.saveMeta(meta);
  }
  // Show the unlock banner only the first time
  const unlockBanner = document.getElementById('victory-unlock');
  if (unlockBanner) unlockBanner.hidden = wasUnlocked;
  state.transition(STATES.VICTORY);
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

function paintVictory() {
  if (!currentRun) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('victory-difficulty', getDifficulty(currentRun.difficulty)?.label ?? '—');
  set('victory-kills', currentRun.totalKills);
  set('victory-gold', currentRun.totalGoldEarned);
  set('victory-plants', currentRun.totalPlantsLost);
}

// ---------- Score submission ----------
function submitScore({ victory }) {
  if (!currentRun) return;
  const inputId = victory ? 'victory-name-input' : 'player-name-input';
  const input = document.getElementById(inputId);
  const name = (input?.value || '').trim() || 'Anonymous';
  Leaderboard.setLastName(name);
  const rank = Leaderboard.addEntry({
    name,
    difficulty: currentRun.difficulty,
    round: currentRun.round,
    kills: currentRun.totalKills,
    gold: currentRun.totalGoldEarned,
    victory: !!victory,
  });
  flashToast(`Score submitted — rank #${rank}`);
  // Hide the name entry block after submission
  const entrySelector = victory
    ? '#screen-victory .name-entry'
    : '#screen-game-over .name-entry';
  const entry = document.querySelector(entrySelector);
  if (entry) entry.hidden = true;
  if (!victory) {
    const rankEl = document.getElementById('game-over-rank');
    if (rankEl) {
      rankEl.hidden = false;
      rankEl.textContent = `Leaderboard rank: #${rank}`;
    }
  } else {
    // After victory submit, clear the run and go back to menu so the
    // player can enter Endless mode.
    Save.clearRun();
    currentRun = null;
    state.transition(STATES.MENU);
  }
}

// ---------- Leaderboard rendering ----------
function renderLeaderboard() {
  const filter = document.getElementById('leaderboard-filter');
  const selected = filter?.value || 'all';
  const rowsHost = document.getElementById('leaderboard-rows');
  const emptyEl = document.getElementById('leaderboard-empty');
  if (!rowsHost) return;
  rowsHost.innerHTML = '';

  const entries = Leaderboard.getEntries({ difficulty: selected });
  if (entries.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  entries.forEach((entry, i) => {
    const tr = document.createElement('tr');
    if (entry.victory) tr.classList.add('row-victory');

    const rank = document.createElement('td');
    rank.className = 'col-rank';
    rank.textContent = String(i + 1);
    tr.appendChild(rank);

    const name = document.createElement('td');
    name.className = 'col-name';
    name.textContent = entry.name;
    tr.appendChild(name);

    const diff = document.createElement('td');
    diff.className = 'col-diff';
    diff.textContent = getDifficulty(entry.difficulty)?.label ?? entry.difficulty;
    tr.appendChild(diff);

    const round = document.createElement('td');
    round.className = 'col-round';
    round.textContent = String(entry.round);
    tr.appendChild(round);

    const kills = document.createElement('td');
    kills.className = 'col-kills';
    kills.textContent = String(entry.kills);
    tr.appendChild(kills);

    const gold = document.createElement('td');
    gold.className = 'col-gold';
    gold.textContent = String(entry.gold);
    tr.appendChild(gold);

    rowsHost.appendChild(tr);
  });
}

function resumeRun() {
  if (!Save.hasRun()) return;
  currentRun = Save.loadRun();
  Tutorial.setRun(currentRun);
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
      state.transition(STATES.LEADERBOARD);
      break;
    case 'submit-score':
      submitScore({ victory: false });
      break;
    case 'submit-victory':
      submitScore({ victory: true });
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
    case 'toggle-speed':
      // Only meaningful during idle combat, not countdown / shop
      if (state.current === STATES.COMBAT) {
        Combat.cycleSpeedMultiplier();
        updateSpeedButton();
      }
      break;
    case 'dev-gold':
      // Dev-mode cheat: +10 gold per tap. Only wired when
      // settings.devMode is true (the button is hidden otherwise,
      // but check again here defensively).
      if (Save.loadSettings().devMode && currentRun) {
        currentRun.gold += 10;
        syncHUD();
        Save.saveRun(currentRun);
        audio.playSfx('click');
      }
      break;
    case 'start-countdown':
      state.transition(STATES.COUNTDOWN);
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

// Escape clears placement selection (if in shop)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.current === STATES.SHOP && currentRun) {
    Placement.clearSelection(currentRun);
  }
  // Enter on name inputs submits the score
  if (e.key === 'Enter') {
    if (e.target && e.target.id === 'player-name-input') {
      e.preventDefault();
      submitScore({ victory: false });
    } else if (e.target && e.target.id === 'victory-name-input') {
      e.preventDefault();
      submitScore({ victory: true });
    }
  }
});

// Settings + leaderboard filter change handlers
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
  if (e.target.id === 'leaderboard-filter') {
    renderLeaderboard();
  }
  if (e.target.id === 'setting-dev-mode') {
    handleDevModeToggle(e.target);
  }
});

/**
 * Handle a dev-mode checkbox toggle. Enabling requires the 4-digit
 * unlock code (1337); disabling is instant and password-free.
 */
function handleDevModeToggle(checkbox) {
  if (checkbox.checked) {
    // Trying to enable — prompt for the code
    // eslint-disable-next-line no-alert
    const code = window.prompt('Enter 4-digit dev mode code:');
    if (code === '1337') {
      const s = readSettingsFromDOM();
      s.devMode = true;
      Save.saveSettings(s);
      applySettings(s);
      flashToast('🛠 Dev mode enabled');
    } else {
      // Wrong or cancelled — revert the checkbox
      checkbox.checked = false;
      if (code !== null) flashToast('Incorrect code');
    }
  } else {
    // Disabling: no password needed
    const s = readSettingsFromDOM();
    s.devMode = false;
    Save.saveSettings(s);
    applySettings(s);
    flashToast('Dev mode disabled');
  }
}

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
  // devMode is loaded from persisted settings, NOT the checkbox directly
  // (the checkbox is a user-facing control that goes through a password
  // flow before being saved). This way a half-typed enable doesn't leak
  // into the saved settings.
  const persistedDevMode = !!Save.loadSettings().devMode;
  return {
    theme: document.getElementById('setting-theme')?.value || 'dark',
    music: !!document.getElementById('setting-music')?.checked,
    sounds: !!document.getElementById('setting-sounds')?.checked,
    musicVolume: (musicVolRaw !== undefined ? Number(musicVolRaw) : 60) / 100,
    sfxVolume: (sfxVolRaw !== undefined ? Number(sfxVolRaw) : 80) / 100,
    devMode: persistedDevMode,
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

// Show/hide the sticky left HUD sidebar based on which state is active.
// Only visible during SHOP / COMBAT / ROUND_END so the round stats stay
// visible between the round summary and the next shop visit.
state.onChange((current) => {
  const sidebar = document.getElementById('hud-sidebar');
  if (!sidebar) return;
  const showIn = new Set([STATES.SHOP, STATES.COMBAT, STATES.ROUND_END]);
  sidebar.hidden = !(showIn.has(current) && currentRun);
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
  Placement,
  Combat,
  CombatView,
  AetherSpells,
  Tutorial,
  Leaderboard,
  currentRun: () => currentRun,
  DIFFICULTIES,
};
console.log('[pvz] v1.0.0 boot complete. Use window.__pvz for debug.');
console.log(`[pvz] Card database: ${Cards.ALL_CARDS.length} cards`);
