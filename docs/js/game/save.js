/**
 * Save System
 *
 * Persists settings, the active run, and meta progression to localStorage.
 * Three top-level keys, each independently loadable:
 *   pvz:settings  → theme, music, sounds, volume
 *   pvz:run       → difficulty, round, gold, deck, grid, aetherRootHP
 *   pvz:meta      → endlessUnlocked, leaderboard, tutorialDone
 */

const KEYS = Object.freeze({
  SETTINGS: 'pvz:settings',
  RUN: 'pvz:run',
  META: 'pvz:meta',
});

const DEFAULT_SETTINGS = {
  theme: 'dark',
  music: true,
  sounds: true,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

const DEFAULT_RUN = {
  difficulty: null,
  round: 1,
  gold: 5,
  aetherRootHP: 100,
  aetherRootMaxHP: 100,
  deck: [],
  grid: [],
  // Run-totals (persist across rounds)
  totalKills: 0,
  totalGoldEarned: 0,
  totalPlantsLost: 0,
  // Last completed round's stats (for the round-end summary screen)
  lastRoundStats: null,
};

const DEFAULT_META = {
  endlessUnlocked: false,
  tutorialDone: false,
  leaderboard: [],
  packsOpened: { mythic: 0, arcane: 0, frenzy: 0 },
};

function safeParse(raw, fallback) {
  if (!raw) return { ...fallback };
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[save] failed to parse, using defaults:', e);
    return { ...fallback };
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[save] failed to write ${key}:`, e);
    return false;
  }
}

export const Save = {
  loadSettings() {
    return safeParse(localStorage.getItem(KEYS.SETTINGS), DEFAULT_SETTINGS);
  },

  saveSettings(settings) {
    return safeWrite(KEYS.SETTINGS, settings);
  },

  loadRun() {
    return safeParse(localStorage.getItem(KEYS.RUN), DEFAULT_RUN);
  },

  saveRun(run) {
    return safeWrite(KEYS.RUN, run);
  },

  hasRun() {
    return !!localStorage.getItem(KEYS.RUN);
  },

  clearRun() {
    localStorage.removeItem(KEYS.RUN);
  },

  loadMeta() {
    return safeParse(localStorage.getItem(KEYS.META), DEFAULT_META);
  },

  saveMeta(meta) {
    return safeWrite(KEYS.META, meta);
  },

  /** Wipe all save data (Reset Game). */
  resetAll() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

export { KEYS, DEFAULT_SETTINGS, DEFAULT_RUN, DEFAULT_META };
