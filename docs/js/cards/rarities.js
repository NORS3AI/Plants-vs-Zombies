/**
 * Rarity Configuration
 *
 * Source-of-truth for the 6 rarity tiers. Each rarity defines:
 * - Display label and color (matches CSS variables)
 * - dropWeight: chance of appearing in the regular shop randomizer
 * - costMin/costMax: random buy cost range
 * - sellMin/sellMax: random sell value range
 *
 * Pack drop rates are NOT defined here — they live in packs.js since
 * each pack has its own weighted distribution.
 */

export const RARITIES = Object.freeze({
  trash: {
    id: 'trash',
    label: 'Trash',
    color: '#6b7280',
    cssVar: '--rarity-trash',
    dropWeight: 80,
    costMin: 2,
    costMax: 4,
    sellMin: 1,
    sellMax: 3,
    tier: 0,
  },
  common: {
    id: 'common',
    label: 'Common',
    color: '#e5e7eb',
    cssVar: '--rarity-common',
    dropWeight: 50,
    costMin: 3,
    costMax: 5,
    sellMin: 2,
    sellMax: 4,
    tier: 1,
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    color: '#4ade80',
    cssVar: '--rarity-uncommon',
    dropWeight: 30,
    costMin: 4,
    costMax: 7,
    sellMin: 3,
    sellMax: 5,
    tier: 2,
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    color: '#60a5fa',
    cssVar: '--rarity-rare',
    dropWeight: 15,
    costMin: 5,
    costMax: 8,
    sellMin: 4,
    sellMax: 7,
    tier: 3,
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    color: '#a855f7',
    cssVar: '--rarity-epic',
    dropWeight: 10,
    costMin: 6,
    costMax: 9,
    sellMin: 5,
    sellMax: 8,
    tier: 4,
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    color: '#d4af37',
    cssVar: '--rarity-legendary',
    dropWeight: 5,
    costMin: 15,
    costMax: 15, // Fixed at 15
    sellMin: 6,
    sellMax: 10,
    tier: 5,
  },
});

export const RARITY_ORDER = ['trash', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Look up a rarity by id; returns null if not found. */
export function getRarity(id) {
  return RARITIES[id] ?? null;
}

/** Get the next rarity tier up (used by Magic Mushroom evolve spell). */
export function getNextRarity(id) {
  const idx = RARITY_ORDER.indexOf(id);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) return null;
  return RARITIES[RARITY_ORDER[idx + 1]];
}
