/**
 * Card Data Validation
 *
 * Sanity-check all card definitions at boot. Reports duplicates, invalid
 * rarities, missing required fields, and pack misconfiguration. Logs to
 * console; doesn't throw, so a malformed card doesn't break the game.
 */

import { RARITIES } from './rarities.js';
import { PACKS } from './packs.js';
import { STANDARD_CARDS } from './standard.js';
import { PACK_EXCLUSIVE_CARDS } from './packExclusives.js';
import { AETHER_ROOT_SPELLS } from './aetherRoot.js';

const VALID_TYPES = new Set(['plant', 'spell']);
const VALID_CATEGORIES = new Set([
  'standard',
  'pack_exclusive',
  'economy',
  'aether_root',
]);

/**
 * Validate the entire card database. Returns { ok, errors, warnings }.
 */
export function validateCards() {
  const errors = [];
  const warnings = [];
  const allCards = [
    ...STANDARD_CARDS,
    ...PACK_EXCLUSIVE_CARDS,
    ...AETHER_ROOT_SPELLS,
  ];
  const ids = new Set();

  for (const card of allCards) {
    const ctx = `[${card.id ?? '<missing-id>'}]`;

    // Required scalar fields
    if (!card.id) errors.push(`${ctx} missing id`);
    if (!card.name) errors.push(`${ctx} missing name`);
    if (!VALID_TYPES.has(card.type)) errors.push(`${ctx} invalid type: ${card.type}`);
    if (!VALID_CATEGORIES.has(card.category)) errors.push(`${ctx} invalid category: ${card.category}`);
    if (!RARITIES[card.rarity]) errors.push(`${ctx} invalid rarity: ${card.rarity}`);

    // Duplicate ids
    if (card.id) {
      if (ids.has(card.id)) errors.push(`${ctx} duplicate id`);
      ids.add(card.id);
    }

    // Pack-exclusive cards must reference a real pack
    if (card.category === 'pack_exclusive' || card.category === 'aether_root') {
      if (!card.pack || !PACKS[card.pack]) {
        errors.push(`${ctx} category=${card.category} but pack='${card.pack}' is invalid`);
      }
    }

    // Plants need stats
    if (card.type === 'plant') {
      if (card.health == null) errors.push(`${ctx} plant missing health`);
      if (card.damage == null) errors.push(`${ctx} plant missing damage`);
      if (card.castTime == null) errors.push(`${ctx} plant missing castTime`);
      if (!card.attackPattern) errors.push(`${ctx} plant missing attackPattern`);
    }

    // Spells need an effect descriptor
    if (card.type === 'spell') {
      if (!card.effect && !card.cooldown && !card.oncePerRound) {
        warnings.push(`${ctx} spell has no effect/cooldown/oncePerRound`);
      }
    }

    // Aether-Root spells need cooldown OR oncePerRound
    if (card.category === 'aether_root') {
      if (!card.cooldown && !card.oncePerRound) {
        errors.push(`${ctx} aether_root spell missing cooldown/oncePerRound`);
      }
    }

    // Cost/sell shape
    if (card.cost && (card.cost.min == null || card.cost.max == null)) {
      errors.push(`${ctx} cost must have {min,max} or be null`);
    }
    if (card.sell && (card.sell.min == null || card.sell.max == null)) {
      errors.push(`${ctx} sell must have {min,max}`);
    }
    if (card.cost && card.cost.min > card.cost.max) {
      errors.push(`${ctx} cost.min > cost.max`);
    }
    if (card.sell && card.sell.min > card.sell.max) {
      errors.push(`${ctx} sell.min > sell.max`);
    }
  }

  // Pack drop weights must sum to 100
  for (const pack of Object.values(PACKS)) {
    const sum = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      errors.push(`[pack:${pack.id}] rarity weights sum to ${sum}, expected 100`);
    }
  }

  // Each pack should have at least one card per declared rarity
  for (const pack of Object.values(PACKS)) {
    for (const rarity of Object.keys(pack.rarityWeights)) {
      const found = PACK_EXCLUSIVE_CARDS.some(
        (c) => c.pack === pack.id && c.rarity === rarity,
      );
      if (!found) {
        warnings.push(
          `[pack:${pack.id}] no cards found for declared rarity '${rarity}' — drops may be empty`,
        );
      }
    }
  }

  // Frenzy pack should have at least one Legendary (for pity drops)
  const frenzyLegendaries = PACK_EXCLUSIVE_CARDS.filter(
    (c) => c.pack === 'frenzy' && c.rarity === 'legendary',
  );
  if (frenzyLegendaries.length === 0) {
    errors.push('[pack:frenzy] needs at least one Legendary card for pity rolls');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    cardCount: allCards.length,
  };
}

/** Run validation and log to console. Used at dev boot. */
export function validateAndLog() {
  const result = validateCards();
  const tag = '[cards]';
  if (result.ok) {
    console.log(`${tag} ✓ ${result.cardCount} cards loaded, no errors`);
  } else {
    console.error(`${tag} ✗ ${result.errors.length} errors in ${result.cardCount} cards:`);
    result.errors.forEach((e) => console.error(`  ${e}`));
  }
  if (result.warnings.length > 0) {
    console.warn(`${tag} ${result.warnings.length} warnings:`);
    result.warnings.forEach((w) => console.warn(`  ${w}`));
  }
  return result;
}
