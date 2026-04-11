/**
 * Standard Cards
 *
 * Cards that can appear in the regular shop randomizer (not pack-exclusive).
 * Includes the 6 standard plants, 6 standard spells, and 2 economy plants
 * (Sunflower + Gilded Rose).
 *
 * Schema (plants):
 *   { id, name, type:'plant', rarity, category, cost:{min,max}, sell:{min,max},
 *     health, damage, castTime, range, attackPattern, targetingDefault,
 *     description, abilities:[], economy?:{...}, evolution?:{...} }
 *
 * Schema (spells):
 *   { id, name, type:'spell', rarity, category, cost:{min,max}, sell:{min,max},
 *     target, description, effect:{...} }
 */

// ============================================================
// PLANTS — Standard Roster
// ============================================================
export const STANDARD_PLANTS = [
  {
    id: 'seedling_scrubber',
    name: 'Seedling Scrubber',
    type: 'plant',
    rarity: 'trash',
    category: 'standard',
    cost: { min: 2, max: 4 },
    sell: { min: 1, max: 3 },
    health: 5,
    damage: 1,
    castTime: 1.0,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Cheap fodder to stall a lane. Attacks fast but hits weak.',
    abilities: [],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'blooming_scrubber' },
  },
  {
    id: 'ironroot_sentry',
    name: 'Ironroot Sentry',
    type: 'plant',
    rarity: 'common',
    category: 'standard',
    cost: { min: 3, max: 5 },
    sell: { min: 2, max: 4 },
    health: 15,
    damage: 5,
    castTime: 2.0,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'The bread-and-butter melee plant.',
    abilities: [],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'ironroot_archer' },
  },
  {
    id: 'cinder_fern',
    name: 'Cinder-Fern',
    type: 'plant',
    rarity: 'uncommon',
    category: 'standard',
    cost: { min: 4, max: 7 },
    sell: { min: 3, max: 5 },
    health: 25,
    damage: 10,
    castTime: 2.0,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Shoots small firebolts down its lane at range.',
    abilities: [{ type: 'projectile', element: 'fire' }],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'smoldering_fern' },
  },
  {
    id: 'frost_bite_willow',
    name: 'Frost-Bite Willow',
    type: 'plant',
    rarity: 'rare',
    category: 'standard',
    cost: { min: 5, max: 8 },
    sell: { min: 4, max: 7 },
    health: 50,
    damage: 25,
    castTime: 3.0,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Slow attack speed, but chills enemies and slows their movement.',
    abilities: [{ type: 'slow_on_hit', percent: 0.5, duration: 2.0 }],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'frozen_willow' },
  },
  {
    id: 'void_petal_bloom',
    name: 'Void-Petal Bloom',
    type: 'plant',
    rarity: 'epic',
    category: 'standard',
    cost: { min: 6, max: 9 },
    sell: { min: 5, max: 8 },
    health: 50,
    damage: 22,
    castTime: 2.0,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Splash damage to adjacent lanes. Fragile but lethal.',
    abilities: [{ type: 'splash', radius: 1 }],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'void_bloom' },
  },
  {
    id: 'solar_archon',
    name: 'Solar Archon',
    type: 'plant',
    rarity: 'legendary',
    category: 'standard',
    cost: { min: 15, max: 15 },
    sell: { min: 6, max: 10 },
    health: 100,
    damage: 50,
    castTime: 2.0,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Piercing beam damage; passively heals adjacent plants.',
    abilities: [
      { type: 'beam' },
      { type: 'heal_adjacent', value: 5, interval: 2.0 },
    ],
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'solar_breach' },
  },
];

// ============================================================
// SPELLS — Standard Roster
// ============================================================
export const STANDARD_SPELLS = [
  {
    id: 'barkskin_guard',
    name: 'Barkskin Guard',
    type: 'spell',
    rarity: 'common',
    category: 'standard',
    cost: { min: 3, max: 5 },
    sell: { min: 2, max: 4 },
    target: 'plant',
    description: 'Adds a Shield equal to 50% of the target plant\'s Max Health.',
    effect: { type: 'shield', value: 0.5, valueType: 'pct_max_hp' },
  },
  {
    id: 'aether_bloom',
    name: 'Aether Bloom',
    type: 'spell',
    rarity: 'uncommon',
    category: 'standard',
    cost: { min: 4, max: 7 },
    sell: { min: 3, max: 5 },
    target: 'plant',
    description: 'Permanently reduces a plant\'s cast time by 1 second.',
    effect: { type: 'cast_speed_buff', value: -1 },
  },
  {
    id: 'wild_growth',
    name: 'Wild Growth',
    type: 'spell',
    rarity: 'uncommon',
    category: 'standard',
    cost: { min: 4, max: 7 },
    sell: { min: 3, max: 5 },
    target: 'plant',
    description: 'Permanently buffs a plant\'s Max Health by +20.',
    effect: { type: 'permanent_hp_buff', value: 20 },
  },
  {
    id: 'nectar_rush',
    name: 'Nectar Rush',
    type: 'spell',
    rarity: 'rare',
    category: 'standard',
    cost: { min: 5, max: 8 },
    sell: { min: 4, max: 7 },
    target: 'plant',
    description: 'Buffs a plant\'s Damage by +15 for the rest of the round.',
    effect: { type: 'damage_buff', value: 15, duration: 'round' },
  },
  {
    id: 'magic_mushroom',
    name: 'Magic Mushroom',
    type: 'spell',
    rarity: 'epic',
    category: 'standard',
    cost: { min: 6, max: 9 },
    sell: { min: 5, max: 8 },
    target: 'plant',
    description: 'Tier Up. Target plant gains a tier (+10 HP, +5 DMG, stacking up to T99). Cast on a Sunflower to duplicate it instead.',
    effect: { type: 'tier_up', hpPerTier: 10, dmgPerTier: 5, maxTier: 99 },
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    type: 'spell',
    rarity: 'rare',
    category: 'standard',
    cost: { min: 5, max: 8 },
    sell: { min: 4, max: 7 },
    target: 'lane',
    description: 'Deals 50 damage to all zombies in a single lane.',
    effect: { type: 'damage_lane', value: 50 },
  },
];

// ============================================================
// ECONOMY PLANTS — Standard (Sunflower + Gilded Rose)
// ============================================================
export const STANDARD_ECONOMY = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    type: 'plant',
    rarity: 'uncommon',
    category: 'economy',
    cost: { min: 4, max: 7 },
    sell: { min: 3, max: 5 },
    health: 25,
    damage: 0,
    castTime: 10.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Photosynthesis. Generates 2 Gold every 10 seconds. Three Sunflowers merge into a Gilded Rose.',
    abilities: [],
    economy: { goldPerCast: 2 },
    evolution: {
      requiresCount: 3,
      requiresSameId: true,
      intoId: 'gilded_rose',
    },
  },
  {
    id: 'gilded_rose',
    name: 'Gilded Rose',
    type: 'plant',
    rarity: 'epic',
    category: 'economy',
    // Not directly purchasable — created via Sunflower evolution
    cost: null,
    sell: { min: 5, max: 8 },
    health: 120,
    damage: 0,
    castTime: 25.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Royal Bloom. Generates 30 Gold every 25 seconds. Saves precious board space.',
    abilities: [],
    economy: { goldPerCast: 30 },
    notInShop: true, // Hidden from regular shop randomizer
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'thorn' },
  },
];

// ============================================================
// EXPORT — All standard cards in one array for query API
// ============================================================
export const STANDARD_CARDS = [
  ...STANDARD_PLANTS,
  ...STANDARD_SPELLS,
  ...STANDARD_ECONOMY,
];
