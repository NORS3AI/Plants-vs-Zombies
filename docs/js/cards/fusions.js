/**
 * Fusion Plants
 *
 * Evolved plants created by placing 3 of a base plant on the grid.
 * They are never rolled in the shop or in packs — they only come
 * into existence via the merge system in placement.js. Each fusion
 * inherits the abilities of its base plant so the identity carries
 * through the chain.
 *
 * Some chains span two tiers (e.g. Seedling Scrubber → Blooming
 * Scrubber → Scrubber); the middle-tier plants carry their own
 * `evolution` metadata so the merge can cascade.
 *
 * All plants here are category: 'fusion' and notInShop: true.
 */

export const FUSION_PLANTS = [
  // ============================================================
  // Seedling Scrubber → Blooming Scrubber → Scrubber
  // ============================================================
  {
    id: 'blooming_scrubber',
    name: 'Blooming Scrubber',
    type: 'plant',
    rarity: 'common',
    category: 'fusion',
    cost: null,
    sell: { min: 3, max: 5 },
    health: 20,
    damage: 10,
    castTime: 1.3,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Seedling Scrubbers. Sprouted, fast, a step up.',
    abilities: [],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'scrubber' },
  },
  {
    id: 'scrubber',
    name: 'Scrubber',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 4, max: 7 },
    health: 75,
    damage: 40,
    castTime: 1.5,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Blooming Scrubbers. Full-grown brawler.',
    abilities: [],
    notInShop: true,
  },

  // ============================================================
  // Ironroot Sentry → Ironroot Archer → Ironroot Knight
  // ============================================================
  {
    id: 'ironroot_archer',
    name: 'Ironroot Archer',
    type: 'plant',
    rarity: 'uncommon',
    category: 'fusion',
    cost: null,
    sell: { min: 4, max: 7 },
    health: 45,
    damage: 20,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Ironroot Sentries. Now shoots at range.',
    abilities: [],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'ironroot_knight' },
  },
  {
    id: 'ironroot_knight',
    name: 'Ironroot Knight',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 100,
    damage: 65,
    castTime: 1.6,
    range: 1,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Ironroot Archers. Heavy melee champion.',
    abilities: [],
    notInShop: true,
  },

  // ============================================================
  // Frost-Bite Willow → Frozen Willow → Pulsing Willow
  // ============================================================
  {
    id: 'frozen_willow',
    name: 'Frozen Willow',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 120,
    damage: 85,
    castTime: 2.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Frost-Bite Willows. Colder, heavier hits.',
    abilities: [{ type: 'slow_on_hit', percent: 0.6, duration: 2.5 }],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'pulsing_willow' },
  },
  {
    id: 'pulsing_willow',
    name: 'Pulsing Willow',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 240,
    damage: 160,
    castTime: 2.5,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Frozen Willows. Every hit is a deep freeze.',
    abilities: [{ type: 'slow_on_hit', percent: 0.75, duration: 3.0 }],
    notInShop: true,
  },

  // ============================================================
  // Cinder-Fern → Smoldering Fern → Horned Fern
  // ============================================================
  {
    id: 'smoldering_fern',
    name: 'Smoldering Fern',
    type: 'plant',
    rarity: 'rare',
    category: 'fusion',
    cost: null,
    sell: { min: 5, max: 8 },
    health: 75,
    damage: 40,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Cinder-Ferns. Hotter, faster firebolts.',
    abilities: [{ type: 'projectile', element: 'fire' }],
    notInShop: true,
    evolution: { requiresCount: 3, requiresSameId: true, intoId: 'horned_fern' },
  },
  {
    id: 'horned_fern',
    name: 'Horned Fern',
    type: 'plant',
    rarity: 'epic',
    category: 'fusion',
    cost: null,
    sell: { min: 6, max: 9 },
    health: 160,
    damage: 90,
    castTime: 1.6,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Smoldering Ferns. Horned firestorm.',
    abilities: [{ type: 'projectile', element: 'fire' }],
    notInShop: true,
  },

  // ============================================================
  // Void-Petal Bloom → Void Bloom
  // ============================================================
  {
    id: 'void_bloom',
    name: 'Void Bloom',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 120,
    damage: 65,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Void-Petal Blooms. Splash damage through the void.',
    abilities: [{ type: 'splash', radius: 1 }],
    notInShop: true,
  },

  // ============================================================
  // Solar Archon → Solar Breach
  // ============================================================
  {
    id: 'solar_breach',
    name: 'Solar Breach',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 175,
    damage: 150,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Solar Archons. Piercing beam + adjacent heal aura.',
    abilities: [
      { type: 'beam' },
      { type: 'heal_adjacent', value: 8, interval: 2.0 },
    ],
    notInShop: true,
  },

  // ============================================================
  // Dragon-Breath Snapdragon → Runite Dragon
  // ============================================================
  {
    id: 'runite_dragon',
    name: 'Runite Dragon',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 100,
    damage: 85,
    castTime: 2.0,
    range: 6,
    attackPattern: 'cone',
    targetingDefault: 'first',
    description: 'Fusion: 3 Dragon-Breath Snapdragons. Runic cone burst.',
    abilities: [{ type: 'cone_damage', width: 3, depth: 6 }],
    notInShop: true,
  },

  // ============================================================
  // Void-Reaper Lily → Void Lily
  // ============================================================
  {
    id: 'void_lily',
    name: 'Void Lily',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 165,
    damage: 80,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Void-Reaper Lilies. Executes sub-15% HP enemies.',
    abilities: [{ type: 'execute', threshold: 0.15, bossExempt: true }],
    notInShop: true,
  },

  // ============================================================
  // Midas Mandrake → Bloody Mandrake
  // ============================================================
  {
    id: 'bloody_mandrake',
    name: 'Bloody Mandrake',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 160,
    damage: 92,
    castTime: 1.8,
    range: 12,
    attackPattern: 'forward',
    targetingDefault: 'first',
    description: 'Fusion: 3 Midas Mandrakes. Blood-for-gold harvest.',
    abilities: [],
    economy: { goldPerKill: 'round_number' },
    notInShop: true,
  },

  // ============================================================
  // Gilded Rose → Thorn (economy)
  // ============================================================
  {
    id: 'thorn',
    name: 'Thorn',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 8, max: 12 },
    health: 200,
    damage: 0,
    castTime: 10.0,
    range: 0,
    attackPattern: 'none',
    targetingDefault: 'none',
    description: 'Fusion: 3 Gilded Roses. Generates 120 Gold every 10 seconds.',
    abilities: [],
    economy: { goldPerCast: 120 },
    notInShop: true,
  },

  // ============================================================
  // Lily Weed × 5 → Blue Lily (omni-pattern; hits all 8 directions)
  // ============================================================
  {
    id: 'blue_lily',
    name: 'Blue Lily',
    type: 'plant',
    rarity: 'legendary',
    category: 'fusion',
    cost: null,
    sell: { min: 10, max: 15 },
    health: 300,
    damage: 1000,
    castTime: 0.1,
    range: 2,
    attackPattern: 'omni',
    targetingDefault: 'first',
    description: 'Fusion: 5 Lily Weeds. Lashes in all 8 directions up to 2 tiles away. 0.1s cast, 1000 DMG — deletes anything it catches.',
    abilities: [],
    notInShop: true,
  },
];
