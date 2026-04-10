/**
 * Card Pack Configuration
 *
 * Three pack tiers with their cost, card count range, drop weights,
 * and pity mechanics. Pack-exclusive cards are defined in
 * packExclusives.js with a `pack` field that references these ids.
 *
 * Pity Rules:
 *   - `guaranteedRarity`: at least one card in the pack will be at this
 *     rarity or higher (used for Frenzy → guaranteed Epic).
 *   - `pityLegendaryEvery`: every Nth pack opened of this type is
 *     guaranteed to drop a Legendary (Frenzy = every 5th).
 */

export const PACKS = Object.freeze({
  mythic: {
    id: 'mythic',
    label: 'Mythic',
    cost: 20,
    cardCountMin: 3,
    cardCountMax: 5,
    rarityWeights: { common: 70, uncommon: 25, rare: 5 },
    guaranteedRarity: null,
    pityLegendaryEvery: null,
    description: 'Common to Rare cards. The starter chest.',
  },
  arcane: {
    id: 'arcane',
    label: 'Arcane',
    cost: 30,
    cardCountMin: 3,
    cardCountMax: 5,
    rarityWeights: { uncommon: 65, rare: 30, epic: 5 },
    guaranteedRarity: null,
    pityLegendaryEvery: null,
    description: 'Uncommon to Epic. Tactical synergy cards.',
  },
  frenzy: {
    id: 'frenzy',
    label: 'Frenzy',
    cost: 50,
    cardCountMin: 3,
    cardCountMax: 5,
    rarityWeights: { rare: 60, epic: 35, legendary: 5 },
    guaranteedRarity: 'epic', // Always at least one Epic
    pityLegendaryEvery: 5,    // Every 5th = guaranteed Legendary
    description: 'Rare to Legendary. Game-changing power spike.',
  },
});

export const PACK_ORDER = ['mythic', 'arcane', 'frenzy'];

/** Look up a pack by id; returns null if not found. */
export function getPack(id) {
  return PACKS[id] ?? null;
}
