/**
 * Leaderboard Module
 *
 * Local-storage leaderboard tracking the best runs per player. Each
 * entry records the difficulty, highest round reached, total kills,
 * total gold earned, player name, and date.
 *
 * Storage lives on `meta.leaderboard` (already declared in Phase 0
 * defaults). This module provides add / query / filter / clear helpers
 * that sort and enforce a max size.
 */

import { Save } from './save.js';

const MAX_ENTRIES = 50;

/**
 * Add a new score. Returns the inserted entry's rank (1-indexed) so
 * the UI can highlight "You placed #3!".
 *
 * @param {object} score
 *   - name: string
 *   - difficulty: string (matches DIFFICULTIES id)
 *   - round: number (highest round reached)
 *   - kills: number
 *   - gold: number (total gold earned)
 *   - victory: boolean (Round 10 boss slain)
 */
export function addEntry(score) {
  const meta = Save.loadMeta();
  const list = Array.isArray(meta.leaderboard) ? meta.leaderboard.slice() : [];

  const entry = {
    name: (score.name || 'Anonymous').slice(0, 20),
    difficulty: score.difficulty || 'normal',
    round: Math.max(1, score.round | 0),
    kills: score.kills | 0,
    gold: score.gold | 0,
    victory: !!score.victory,
    date: Date.now(),
  };

  list.push(entry);

  // Primary sort: highest round, then earliest date (ties favor earlier)
  list.sort((a, b) => {
    if (b.round !== a.round) return b.round - a.round;
    return a.date - b.date;
  });

  // Cap to MAX_ENTRIES
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;

  meta.leaderboard = list;
  Save.saveMeta(meta);

  // 1-indexed rank of the inserted entry
  const rank = list.findIndex((e) => e === entry) + 1;
  return rank;
}

/**
 * Read leaderboard entries, optionally filtered by difficulty.
 */
export function getEntries({ difficulty } = {}) {
  const meta = Save.loadMeta();
  let list = Array.isArray(meta.leaderboard) ? meta.leaderboard.slice() : [];
  if (difficulty && difficulty !== 'all') {
    list = list.filter((e) => e.difficulty === difficulty);
  }
  return list;
}

/** Check whether any entries exist. */
export function hasEntries() {
  return getEntries().length > 0;
}

/** Clear all leaderboard entries. */
export function clear() {
  const meta = Save.loadMeta();
  meta.leaderboard = [];
  Save.saveMeta(meta);
}

/** Get the player's personal best across all difficulties. */
export function getPersonalBest() {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries[0]; // already sorted by highest round
}

/** Saved player name (last used) for pre-filling name input. */
export function getLastName() {
  const meta = Save.loadMeta();
  return meta.lastPlayerName || '';
}

export function setLastName(name) {
  const meta = Save.loadMeta();
  meta.lastPlayerName = (name || '').slice(0, 20);
  Save.saveMeta(meta);
}
