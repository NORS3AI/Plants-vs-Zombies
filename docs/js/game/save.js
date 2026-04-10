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
  aetherRootShield: 0, // Phase 9: absorbed by incoming damage before HP

  // Owned cards (each is a card-instance with rolled sellValue + instanceId).
  // Max 10 entries enforced by shop logic.
  deck: [],

  // Aether-Root spells (live in side panel, separate from regular deck).
  aetherSpells: [],

  // Grid model (5×12 of cardInstanceIds or null). Phase 6 wires placement.
  grid: [],

  // Current 3-card shop offering. Persists across save/reload so the
  // shop doesn't reroll on page refresh; explicit Refresh button rerolls,
  // and entering SHOP at the start of a new round auto-rerolls (free).
  // Each: { cardId, cost, sold }
  shopRoll: [],
  shopRollRound: 0, // The round number when shopRoll was generated

  // Pity counters for the every-Nth-pack-guarantees-Legendary rule.
  packsOpened: { mythic: 0, arcane: 0, frenzy: 0 },

  // Run-totals (persist across rounds)
  totalKills: 0,
  totalGoldEarned: 0,
  totalPlantsLost: 0,

  // Last completed round's stats (for the round-end summary screen)
  lastRoundStats: null,

  // Phase 10: set of tutorial popup ids already shown this run.
  // Only populated when difficulty === 'tutorial'. Reset per run.
  tutorialSeen: {},

  // Lane/tile spells cast in shop mode that will fire at the start
  // of the next combat round. { type, row, col?, value, ... }
  pendingSpellEffects: [],
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
