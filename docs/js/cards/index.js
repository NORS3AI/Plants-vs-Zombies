/**
 * Card Database — Public API
 *
 * Re-exports all card data and provides query functions used by:
 *   - Phase 5 shop (rollShopCards, rollPackCards)
 *   - Phase 6 grid placement (getCard)
 *   - Phase 7 combat (card abilities/stats lookup)
 *   - Phase 9 Aether-Root spell side panel (getAetherRootSpells)
 *
 * All card definitions are immutable after import. The shop never mutates
 * the source cards — it works with copies if it needs per-instance state.
 */

import { RARITIES, RARITY_ORDER, getRarity, getNextRarity } from './rarities.js';
import { PACKS, PACK_ORDER, getPack } from './packs.js';
import { STANDARD_CARDS } from './standard.js';
import { PACK_EXCLUSIVE_CARDS } from './packExclusives.js';
import { AETHER_ROOT_SPELLS } from './aetherRoot.js';
import { FUSION_PLANTS } from './fusions.js';
import { validateCards, validateAndLog } from './validate.js';

// ============================================================
// EXPORTS — Re-export config + raw data
// ============================================================
export {
  RARITIES,
  RARITY_ORDER,
  getRarity,
  getNextRarity,
  PACKS,
  PACK_ORDER,
  getPack,
  STANDARD_CARDS,
  PACK_EXCLUSIVE_CARDS,
  AETHER_ROOT_SPELLS,
  FUSION_PLANTS,
  validateCards,
  validateAndLog,
};

/**
 * Every card in the database, regardless of source.
 * FUSION_PLANTS are merged-only (created at runtime by the placement
 * module when 3 identical plants land on the grid). They still need
 * to be in ALL_CARDS so getCard() can hydrate them.
 */
export const ALL_CARDS = [
  ...STANDARD_CARDS,
  ...PACK_EXCLUSIVE_CARDS,
  ...AETHER_ROOT_SPELLS,
  ...FUSION_PLANTS,
];

// O(1) id → card lookup
const CARD_INDEX = new Map(ALL_CARDS.map((c) => [c.id, c]));

// ============================================================
// QUERY API
// ============================================================

/** Look up a single card by id. Returns undefined if not found. */
export function getCard(id) {
  return CARD_INDEX.get(id);
}

/** All cards of a given rarity (across all categories). */
export function getCardsByRarity(rarity) {
  return ALL_CARDS.filter((c) => c.rarity === rarity);
}

/** All cards in a given category. */
export function getCardsByCategory(category) {
  return ALL_CARDS.filter((c) => c.category === category);
}

/** All pack-exclusive cards belonging to a specific pack. */
export function getCardsByPack(packId) {
  return PACK_EXCLUSIVE_CARDS.filter((c) => c.pack === packId).concat(
    AETHER_ROOT_SPELLS.filter((c) => c.pack === packId),
  );
}

/** Standard cards eligible for the regular shop randomizer. */
export function getShopEligibleCards() {
  return STANDARD_CARDS.filter((c) => !c.notInShop);
}

/** All Aether-Root side-panel spells. */
export function getAetherRootSpells() {
  return AETHER_ROOT_SPELLS;
}

// ============================================================
// RANDOMIZATION HELPERS
// ============================================================

/** Inclusive integer in [min, max]. */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Pick a random element from a non-empty array. */
function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Roll a random buy cost for a card.
 * Returns 0 if the card is not purchasable (e.g., Aether-Root spells).
 */
export function rollCost(card) {
  if (!card?.cost) return 0;
  return randInt(card.cost.min, card.cost.max);
}

/** Roll a random sell value for a card. Returns 0 if not sellable. */
export function rollSell(card) {
  if (!card?.sell) return 0;
  return randInt(card.sell.min, card.sell.max);
}

/**
 * Pick a random rarity by RARITIES.dropWeight.
 * Used by the regular 3-card shop randomizer.
 */
export function rollShopRarity() {
  const totalWeight = Object.values(RARITIES).reduce(
    (sum, r) => sum + r.dropWeight,
    0,
  );
  let roll = Math.random() * totalWeight;
  for (const rarity of Object.values(RARITIES)) {
    if (roll < rarity.dropWeight) return rarity.id;
    roll -= rarity.dropWeight;
  }
  return 'common';
}

/**
 * Roll a single card for the shop. Picks a rarity by weight, then a
 * random card of that rarity from the shop-eligible pool.
 */
export function rollShopCard() {
  const eligible = getShopEligibleCards();
  // Try up to 6 times (in case the chosen rarity has no eligible cards)
  for (let attempt = 0; attempt < 6; attempt++) {
    const rarity = rollShopRarity();
    const candidates = eligible.filter((c) => c.rarity === rarity);
    if (candidates.length > 0) return pickOne(candidates);
  }
  // Fallback: any common
  const fallback = eligible.filter((c) => c.rarity === 'common');
  return fallback.length > 0 ? pickOne(fallback) : eligible[0];
}

/** Roll N shop cards. Used by the Phase 5 shop refresh. */
export function rollShopCards(count = 3) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(rollShopCard());
  return out;
}

// ============================================================
// PACK ROLLING
// ============================================================

/**
 * Roll a single card from a pack's rarity distribution.
 * If the chosen rarity has no candidates in this pack, fall through.
 */
function rollPackCardOnce(pack) {
  const totalWeight = Object.values(pack.rarityWeights).reduce(
    (a, b) => a + b,
    0,
  );
  let roll = Math.random() * totalWeight;
  const entries = Object.entries(pack.rarityWeights);
  for (const [rarity, weight] of entries) {
    if (roll < weight) {
      const candidates = PACK_EXCLUSIVE_CARDS.concat(AETHER_ROOT_SPELLS).filter(
        (c) => c.pack === pack.id && c.rarity === rarity,
      );
      if (candidates.length > 0) return pickOne(candidates);
      // Fall through to next rarity if empty
    }
    roll -= weight;
  }
  // Fallback: any card in this pack
  const all = PACK_EXCLUSIVE_CARDS.concat(AETHER_ROOT_SPELLS).filter(
    (c) => c.pack === pack.id,
  );
  return all.length > 0 ? pickOne(all) : null;
}

/**
 * Open a pack and return an array of card definitions.
 *
 * @param {string} packId — 'mythic' | 'arcane' | 'frenzy'
 * @param {object} pityState — { mythicCount, arcaneCount, frenzyCount }
 *                              tracked by the run; pre-incremented before
 *                              calling this function (i.e., 5 means this
 *                              is the 5th frenzy pack opened).
 * @returns {Array} cards
 */
export function rollPackCards(packId, pityState = {}) {
  const pack = PACKS[packId];
  if (!pack) return [];

  const count = randInt(pack.cardCountMin, pack.cardCountMax);
  const cards = [];
  for (let i = 0; i < count; i++) {
    const c = rollPackCardOnce(pack);
    if (c) cards.push(c);
  }

  // Pity 1: Frenzy guarantees at least one Epic-or-better
  if (pack.guaranteedRarity) {
    const minTier = RARITIES[pack.guaranteedRarity]?.tier ?? 0;
    const hasGuaranteed = cards.some(
      (c) => (RARITIES[c.rarity]?.tier ?? 0) >= minTier,
    );
    if (!hasGuaranteed && cards.length > 0) {
      const candidates = PACK_EXCLUSIVE_CARDS.concat(AETHER_ROOT_SPELLS).filter(
        (c) =>
          c.pack === pack.id &&
          (RARITIES[c.rarity]?.tier ?? 0) >= minTier,
      );
      if (candidates.length > 0) {
        cards[cards.length - 1] = pickOne(candidates);
      }
    }
  }

  // Pity 2: Every Nth pack guarantees a Legendary
  const countKey = `${pack.id}Count`;
  const opened = pityState[countKey] ?? 0;
  if (
    pack.pityLegendaryEvery &&
    opened > 0 &&
    opened % pack.pityLegendaryEvery === 0
  ) {
    const legendaries = PACK_EXCLUSIVE_CARDS.concat(AETHER_ROOT_SPELLS).filter(
      (c) => c.pack === pack.id && c.rarity === 'legendary',
    );
    if (legendaries.length > 0 && cards.length > 0) {
      cards[cards.length - 1] = pickOne(legendaries);
    }
  }

  return cards;
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

/** Build a tooltip-ready stat string for a card. */
export function formatCardStats(card) {
  if (!card) return '';
  if (card.type === 'plant') {
    const parts = [`${card.health} HP`];
    if (card.damage > 0) parts.push(`${card.damage} DMG`);
    if (card.castTime > 0) parts.push(`${card.castTime}s cast`);
    return parts.join(' · ');
  }
  if (card.type === 'spell') {
    if (card.cooldown) return `${card.cooldown}s cooldown`;
    if (card.oncePerRound) return '1 per round';
    return 'spell';
  }
  return '';
}

/** Build a one-line label for a card (name + rarity). */
export function formatCardLabel(card) {
  if (!card) return '';
  const r = RARITIES[card.rarity];
  return `${card.name} (${r?.label ?? card.rarity})`;
}
